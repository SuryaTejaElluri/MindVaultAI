import hashlib
import logging
from pathlib import Path
from typing import Any, Dict, Optional
from uuid import NAMESPACE_URL, uuid4, uuid5

from sqlalchemy import create_engine, text

from app.config import Settings
from app.ingestion import load_and_split_file
from app.vector_store import get_vector_store

logger = logging.getLogger(__name__)


def check_user_quota(user_id: str, new_bytes: int, settings: Settings, engine) -> None:
    """Verifies that the user has not exceeded their configured storage quota."""
    max_bytes = settings.user_storage_quota_mb * 1024 * 1024
    with engine.connect() as connection:
        current_used = connection.execute(
            text("""
                SELECT COALESCE(SUM(file_size), 0)
                FROM rag_ingested_files
                WHERE user_id = :user_id AND status != 'failed'
            """),
            {"user_id": user_id},
        ).scalar() or 0

    if current_used + new_bytes > max_bytes:
        used_mb = current_used / (1024 * 1024)
        quota_mb = settings.user_storage_quota_mb
        raise ValueError(
            f"Storage quota exceeded. Currently using {used_mb:.2f} MB of {quota_mb} MB allowed."
        )


def ingest_file(
    file_path: Path,
    user_id: str,
    original_filename: Optional[str] = None,
    doc_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Ingests a document synchronously scoped strictly to the authenticated user."""
    if not file_path.is_file():
        raise FileNotFoundError(f"File not found: {file_path}")

    filename = original_filename or file_path.name
    file_bytes = file_path.read_bytes()
    file_size = len(file_bytes)
    content_hash = hashlib.sha256(file_bytes).hexdigest()

    settings = Settings.from_env()
    engine = create_engine(settings.database_url, pool_pre_ping=True)

    try:
        # Check quota
        check_user_quota(user_id, file_size, settings, engine)

        # Check per-user uniqueness rule
        with engine.begin() as connection:
            existing = connection.execute(
                text("""
                    SELECT id, filename, chunk_count, status
                    FROM rag_ingested_files
                    WHERE user_id = :user_id AND content_hash = :content_hash
                """),
                {"user_id": user_id, "content_hash": content_hash},
            ).first()

            if existing and existing.status == "completed":
                return {
                    "status": "already_ingested",
                    "document_id": str(existing.id),
                    "filename": existing.filename,
                    "chunks": existing.chunk_count,
                }

            effective_doc_id = str(existing.id) if existing else (doc_id or str(uuid4()))

            if existing:
                connection.execute(
                    text("""
                        UPDATE rag_ingested_files
                        SET status = 'processing', error_message = NULL, updated_at = now()
                        WHERE id = :id AND user_id = :user_id
                    """),
                    {"id": effective_doc_id, "user_id": user_id},
                )
            else:
                connection.execute(
                    text("""
                        INSERT INTO rag_ingested_files
                            (id, user_id, filename, content_hash, file_size, chunk_count, status)
                        VALUES
                            (:id, :user_id, :filename, :content_hash, :file_size, 0, 'processing')
                    """),
                    {
                        "id": effective_doc_id,
                        "user_id": user_id,
                        "filename": filename,
                        "content_hash": content_hash,
                        "file_size": file_size,
                    },
                )

        # Parse and chunk document
        chunks = load_and_split_file(file_path)
        if not chunks:
            raise ValueError(
                "No readable text was found in the file. Scanned PDFs need OCR first."
            )

        # Scope metadata to authenticated owner
        for chunk in chunks:
            chunk.metadata["user_id"] = user_id
            chunk.metadata["doc_id"] = effective_doc_id
            chunk.metadata["content_hash"] = content_hash
            chunk.metadata["source"] = filename

        # User-scoped stable chunk IDs prevent collisions across accounts
        chunk_ids = [
            str(uuid5(NAMESPACE_URL, f"{user_id}:{content_hash}:{index}"))
            for index in range(len(chunks))
        ]

        # Embed and store chunks in pgvector
        get_vector_store().add_documents(chunks, ids=chunk_ids)

        # Mark document completed in registry
        with engine.begin() as connection:
            connection.execute(
                text("""
                    UPDATE rag_ingested_files
                    SET status = 'completed',
                        chunk_count = :chunk_count,
                        error_message = NULL,
                        updated_at = now()
                    WHERE id = :id AND user_id = :user_id
                """),
                {
                    "id": effective_doc_id,
                    "user_id": user_id,
                    "chunk_count": len(chunks),
                },
            )

        return {
            "status": "ingested",
            "document_id": effective_doc_id,
            "filename": filename,
            "chunks": len(chunks),
        }

    except Exception as err:
        logger.exception("Ingestion failed")
        if 'effective_doc_id' in locals():
            with engine.begin() as connection:
                connection.execute(
                    text("""
                        UPDATE rag_ingested_files
                        SET status = 'failed',
                            error_message = :error_message,
                            updated_at = now()
                        WHERE id = :id AND user_id = :user_id
                    """),
                    {
                        "id": effective_doc_id,
                        "user_id": user_id,
                        "error_message": str(err)[:500],
                    },
                )
        raise
    finally:
        engine.dispose()


def run_background_ingest(
    file_path: Path,
    user_id: str,
    original_filename: str,
    doc_id: str,
) -> None:
    """Task executed by FastAPI BackgroundTasks for asynchronous ingestion."""
    try:
        ingest_file(
            file_path=file_path,
            user_id=user_id,
            original_filename=original_filename,
            doc_id=doc_id,
        )
    except Exception as err:
        logger.error(f"Background ingestion failed for doc {doc_id} ({original_filename}): {err}")
    finally:
        # Clean up staging temporary file
        try:
            if file_path.exists():
                file_path.unlink()
        except Exception as cleanup_err:
            logger.warning(f"Failed to delete temp file {file_path}: {cleanup_err}")
