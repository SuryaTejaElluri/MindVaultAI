import logging
import os
import shutil
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional
from uuid import uuid4

from fastapi import (
    BackgroundTasks,
    Depends,
    FastAPI,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure OpenBLAS thread allocation does not cause memory issues on Windows
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")

from app.auth import (
    AuthenticatedUser,
    authenticate_user,
    get_current_user,
    get_user_profile,
    register_user,
)
from app.chat_history import (
    create_user_session,
    delete_user_session,
    get_user_session,
    list_user_sessions,
)
from app.config import Settings
from app.db_migration import run_migrations
from app.documents import (
    delete_user_document,
    get_user_document,
    list_user_documents,
    rename_user_document,
)
from app.ingest import ingest_file, run_background_ingest
from app.qa import answer_question
from app.rate_limiter import enforce_rate_limit

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Dedicated persistent staging directory for uploaded files
STAGING_DIR = Path("data/staging")
STAGING_DIR.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run automatic database migrations on backend launch
    try:
        run_migrations()
    except Exception as err:
        logger.error(f"Startup migration failed: {err}")
    yield


app = FastAPI(
    title="RAG Backend",
    version="0.2.0",
    description="Multi-user RAG backend with PostgreSQL pgvector and token-based authentication.",
    lifespan=lifespan,
)

cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173")
cors_origins = [orig.strip() for orig in cors_origins_env.split(",") if orig.strip()]
if "*" in cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# --- Request & Response Models ---

class AuthRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255, description="User email address")
    password: str = Field(min_length=6, max_length=128, description="User password")


class QuestionRequest(BaseModel):
    question: str = Field(min_length=1, description="Question text to query against documents")
    top_k: int = Field(default=5, ge=1, le=20, description="Number of document chunks to retrieve")
    session_id: Optional[str] = Field(default=None, description="Optional chat session ID for multi-turn history")


class RenameDocumentRequest(BaseModel):
    filename: str = Field(min_length=1, max_length=255, description="New filename for the document")


class CreateSessionRequest(BaseModel):
    title: Optional[str] = Field(default="New Chat", max_length=100, description="Chat session title")


# --- Public & Auth Endpoints ---

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/auth/register", status_code=status.HTTP_201_CREATED)
def register(request: AuthRequest):
    """Registers a new user and returns a signed JWT access token."""
    settings = Settings.from_env()
    return register_user(email=request.email, password=request.password, settings=settings)


@app.post("/auth/login", status_code=status.HTTP_200_OK)
def login(request: AuthRequest):
    """Authenticates email and password, returning a signed JWT access token."""
    settings = Settings.from_env()
    return authenticate_user(email=request.email, password=request.password, settings=settings)


@app.get("/auth/me", status_code=status.HTTP_200_OK)
def get_me(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Returns the authenticated user's profile and verified owner subject ID."""
    settings = Settings.from_env()
    return get_user_profile(user_id=current_user.user_id, settings=settings)


# --- Authenticated Document Endpoints ---

@app.post("/documents", status_code=status.HTTP_200_OK)
def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    background: Optional[bool] = Query(None, description="Force asynchronous background ingestion"),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Uploads and ingests a document scoped strictly to the authenticated user.
    
    For background ingestion, the file is persisted in data/staging until the
    background worker finishes processing, preventing premature deletion.
    """
    # 1. Enforce per-user rate limit
    enforce_rate_limit(current_user.user_id)

    # 2. Validate file type
    filename = (file.filename or "document").replace("\\", "/").split("/")[-1]
    suffix = Path(filename).suffix.lower()
    if suffix not in {".pdf", ".txt", ".md"}:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Supported file types are PDF, TXT, and MD.",
        )

    settings = Settings.from_env()
    max_bytes = settings.max_upload_size_mb * 1024 * 1024

    doc_id = str(uuid4())
    # Staging path persists on disk and is cleaned up ONLY after ingestion finishes
    staging_file = STAGING_DIR / f"{doc_id}_{filename}"

    try:
        written_bytes = 0
        with staging_file.open("wb") as destination:
            while chunk := file.file.read(1024 * 64):
                written_bytes += len(chunk)
                if written_bytes > max_bytes:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds maximum allowed upload size of {settings.max_upload_size_mb} MB.",
                    )
                destination.write(chunk)

        # 3. Determine whether to run background ingestion
        should_background = background is True or (
            background is None and written_bytes >= settings.background_threshold_bytes
        )

        if should_background:
            # The staging file remains in data/staging/ until run_background_ingest completes
            background_tasks.add_task(
                run_background_ingest,
                file_path=staging_file,
                user_id=current_user.user_id,
                original_filename=filename,
                doc_id=doc_id,
            )
            return {
                "status": "processing",
                "document_id": doc_id,
                "filename": filename,
                "message": "Document ingestion started in background. Check status at GET /documents/{document_id}",
            }
        else:
            # Synchronous ingestion for small files
            try:
                result = ingest_file(
                    file_path=staging_file,
                    user_id=current_user.user_id,
                    original_filename=filename,
                    doc_id=doc_id,
                )
                return result
            finally:
                if staging_file.exists():
                    staging_file.unlink(missing_ok=True)

    except HTTPException:
        if staging_file.exists():
            staging_file.unlink(missing_ok=True)
        raise
    except ValueError as err:
        if staging_file.exists():
            staging_file.unlink(missing_ok=True)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err)) from err
    except Exception as err:
        if staging_file.exists():
            staging_file.unlink(missing_ok=True)
        logger.exception("Document ingestion failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document ingestion failed: {str(err)}",
        ) from err
    finally:
        file.file.close()


@app.get("/documents")
def list_documents(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Lists all documents registered to the authenticated owner."""
    return list_user_documents(user_id=current_user.user_id)


@app.get("/documents/{document_id}")
def get_document(
    document_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Retrieves metadata and ingestion status for a document owned by the user."""
    return get_user_document(user_id=current_user.user_id, document_id=document_id)


@app.patch("/documents/{document_id}")
def rename_document(
    document_id: str,
    request: RenameDocumentRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Renames an existing document owned by the user."""
    return rename_user_document(
        user_id=current_user.user_id,
        document_id=document_id,
        new_filename=request.filename,
    )


@app.delete("/documents/{document_id}")
def delete_document(
    document_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Deletes a document and all its vector embeddings owned by the user."""
    return delete_user_document(user_id=current_user.user_id, document_id=document_id)


# --- Authenticated Chat & History Endpoints ---

@app.post("/chat")
def chat(
    request: QuestionRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Executes owner-scoped RAG question answering with grounded citations and chat history."""
    enforce_rate_limit(current_user.user_id)
    try:
        return answer_question(
            question=request.question,
            user_id=current_user.user_id,
            k=request.top_k,
            session_id=request.session_id,
        )
    except HTTPException:
        raise
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err)) from err
    except Exception as err:
        logger.exception("Question answering failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Question answering failed: {str(err)}",
        ) from err


@app.get("/chat/sessions")
def list_sessions(current_user: AuthenticatedUser = Depends(get_current_user)):
    """Lists all chat sessions owned by the authenticated user."""
    return list_user_sessions(user_id=current_user.user_id)


@app.post("/chat/sessions")
def create_session(
    request: CreateSessionRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Creates a new chat session for the authenticated user."""
    return create_user_session(user_id=current_user.user_id, title=request.title)


@app.get("/chat/sessions/{session_id}")
def get_session(
    session_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Retrieves full conversation messages for a chat session owned by the user."""
    return get_user_session(user_id=current_user.user_id, session_id=session_id)


@app.delete("/chat/sessions/{session_id}")
def delete_session(
    session_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """Deletes a chat session and its history owned by the user."""
    return delete_user_session(user_id=current_user.user_id, session_id=session_id)
