import os
from dataclasses import dataclass, field
from typing import List, Optional

from dotenv import load_dotenv

DEFAULT_SECRET = "rag-jwt-secret-key-for-local-authentication-32bytes"


@dataclass(frozen=True, repr=False)
class Settings:
    database_url: str
    openai_api_key: str
    embedding_model: str
    chat_model: str
    collection_name: str
    chunk_size: int
    chunk_overlap: int
    # Multi-user & Auth settings
    auth_issuer: Optional[str] = None
    auth_audience: Optional[str] = None
    auth_jwks_url: Optional[str] = None
    auth_public_key: Optional[str] = None
    auth_secret_key: str = DEFAULT_SECRET
    auth_algorithms: List[str] = field(default_factory=lambda: ["HS256", "RS256"])
    # Quotas & Limits
    max_upload_size_mb: int = 25
    user_storage_quota_mb: int = 50
    rate_limit_requests_per_minute: int = 60
    # Retrieval & Search thresholds
    similarity_threshold: float = 0.65
    background_threshold_bytes: int = 2 * 1024 * 1024  # 2 MB
    ocr_enabled: bool = False

    @classmethod
    def from_env(cls) -> "Settings":
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        dotenv_path = os.path.join(base_dir, ".env")
        if os.path.exists(dotenv_path):
            load_dotenv(dotenv_path, override=True)
        else:
            load_dotenv(override=True)

        required = ["DATABASE_URL", "OPENAI_API_KEY"]
        missing = [name for name in required if not os.getenv(name)]
        if missing:
            raise ValueError(
                "Missing required .env values: " + ", ".join(missing)
            )

        auth_secret_key = os.getenv("AUTH_SECRET_KEY", DEFAULT_SECRET)
        algorithms_str = os.getenv("AUTH_ALGORITHMS", "HS256,RS256")
        algorithms = [alg.strip() for alg in algorithms_str.split(",") if alg.strip()]

        return cls(
            database_url=os.environ["DATABASE_URL"],
            openai_api_key=os.environ["OPENAI_API_KEY"],
            embedding_model=os.getenv(
                "EMBEDDING_MODEL", "text-embedding-3-small"
            ),
            chat_model=os.getenv("CHAT_MODEL", "gpt-4o-mini"),
            collection_name=os.getenv(
                "COLLECTION_NAME", "rag_documents"
            ),
            chunk_size=int(os.getenv("CHUNK_SIZE", "900")),
            chunk_overlap=int(os.getenv("CHUNK_OVERLAP", "150")),
            auth_issuer=os.getenv("AUTH_ISSUER"),
            auth_audience=os.getenv("AUTH_AUDIENCE"),
            auth_jwks_url=os.getenv("AUTH_JWKS_URL"),
            auth_public_key=os.getenv("AUTH_PUBLIC_KEY"),
            auth_secret_key=auth_secret_key,
            auth_algorithms=algorithms or ["HS256", "RS256"],
            max_upload_size_mb=int(os.getenv("MAX_UPLOAD_SIZE_MB", "25")),
            user_storage_quota_mb=int(os.getenv("USER_STORAGE_QUOTA_MB", "50")),
            rate_limit_requests_per_minute=int(
                os.getenv("RATE_LIMIT_REQUESTS_PER_MINUTE", "60")
            ),
            similarity_threshold=float(
                os.getenv("SIMILARITY_THRESHOLD", "0.65")
            ),
            background_threshold_bytes=int(
                os.getenv("BACKGROUND_THRESHOLD_BYTES", str(2 * 1024 * 1024))
            ),
            ocr_enabled=os.getenv("OCR_ENABLED", "false").lower() in {"true", "1", "yes"},
        )
