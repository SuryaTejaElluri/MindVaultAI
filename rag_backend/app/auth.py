import hashlib
import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass, field
from typing import Any, Dict, Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import create_engine, text

from app.config import Settings

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=True)


def hash_password(password: str) -> str:
    """Securely hashes a plaintext password using PBKDF2-HMAC-SHA256 with a unique salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000,
    )
    return f"{salt}:{key.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Verifies a plaintext password against the stored salt:hash string."""
    try:
        salt, key_hex = stored_hash.split(":", 1)
        key = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            100000,
        )
        return secrets.compare_digest(key.hex(), key_hex)
    except Exception:
        return False


def create_access_token(user_id: str, email: str, settings: Settings) -> str:
    """Generates a verifiable JWT token with the user's stable subject ID."""
    now = datetime.now(timezone.utc)
    exp = now + timedelta(days=7)  # 7-day session validity
    payload = {
        "sub": str(user_id).strip(),
        "email": email.strip().lower(),
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    if settings.auth_issuer:
        payload["iss"] = settings.auth_issuer
    if settings.auth_audience:
        payload["aud"] = settings.auth_audience

    return jwt.encode(payload, settings.auth_secret_key, algorithm="HS256")


@dataclass(frozen=True)
class AuthenticatedUser:
    """Represents an authenticated user verified via JWT."""
    user_id: str
    email: Optional[str] = None
    claims: Dict[str, Any] = field(default_factory=dict)


def verify_token(token: str, settings: Settings) -> AuthenticatedUser:
    """Verifies a JWT bearer token and extracts the stable owner subject ID."""
    try:
        decode_kwargs: Dict[str, Any] = {
            "algorithms": ["HS256", "RS256"] if "HS256" not in settings.auth_algorithms else settings.auth_algorithms,
            "options": {"verify_signature": True, "verify_exp": True},
        }

        unverified_payload = jwt.decode(token, options={"verify_signature": False})
        if "iss" in unverified_payload and settings.auth_issuer:
            decode_kwargs["issuer"] = settings.auth_issuer
        if "aud" in unverified_payload and settings.auth_audience:
            decode_kwargs["audience"] = settings.auth_audience

        payload = jwt.decode(token, settings.auth_secret_key, **decode_kwargs)

        sub = payload.get("sub")
        if not sub or not isinstance(sub, str) or not sub.strip():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token is missing a valid subject ('sub') claim.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id = sub.strip()
        email = payload.get("email")
        if email and not isinstance(email, str):
            email = None

        return AuthenticatedUser(user_id=user_id, email=email, claims=payload)

    except jwt.ExpiredSignatureError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired.",
            headers={"WWW-Authenticate": "Bearer error=\"invalid_token\", error_description=\"Token expired\""},
        ) from err
    except (jwt.InvalidIssuerError, jwt.InvalidAudienceError) as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token issuer or audience.",
            headers={"WWW-Authenticate": "Bearer error=\"invalid_token\""},
        ) from err
    except jwt.PyJWTError as err:
        logger.warning(f"JWT verification failed: {err}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer error=\"invalid_token\""},
        ) from err


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> AuthenticatedUser:
    """FastAPI dependency to authenticate requests using bearer tokens."""
    settings = Settings.from_env()
    token = credentials.credentials
    return verify_token(token, settings)


def register_user(email: str, password: str, settings: Settings) -> Dict[str, Any]:
    """Registers a new user with hashed password and returns an access token."""
    email_clean = email.strip().lower()
    if not email_clean or "@" not in email_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid email address is required.",
        )
    if len(password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters.",
        )

    pwd_hash = hash_password(password)
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    try:
        with engine.begin() as conn:
            existing = conn.execute(
                text("SELECT id FROM rag_users WHERE LOWER(email) = :email"),
                {"email": email_clean},
            ).fetchone()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An account with this email already exists.",
                )

            row = conn.execute(
                text("""
                    INSERT INTO rag_users (email, password_hash)
                    VALUES (:email, :pwd_hash)
                    RETURNING id, email, created_at
                """),
                {"email": email_clean, "pwd_hash": pwd_hash},
            ).fetchone()

            user_id = str(row.id)
            token = create_access_token(user_id=user_id, email=row.email, settings=settings)
            return {
                "access_token": token,
                "token_type": "bearer",
                "user": {
                    "id": user_id,
                    "email": row.email,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                },
            }
    finally:
        engine.dispose()


def authenticate_user(email: str, password: str, settings: Settings) -> Dict[str, Any]:
    """Authenticates email and password, returning an access token."""
    email_clean = email.strip().lower()
    if not email_clean or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required.",
        )

    engine = create_engine(settings.database_url, pool_pre_ping=True)
    try:
        with engine.connect() as conn:
            row = conn.execute(
                text("SELECT id, email, password_hash, created_at FROM rag_users WHERE LOWER(email) = :email"),
                {"email": email_clean},
            ).fetchone()
            if not row or not verify_password(password, row.password_hash):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password.",
                )

            user_id = str(row.id)
            token = create_access_token(user_id=user_id, email=row.email, settings=settings)
            return {
                "access_token": token,
                "token_type": "bearer",
                "user": {
                    "id": user_id,
                    "email": row.email,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                },
            }
    finally:
        engine.dispose()


def get_user_profile(user_id: str, settings: Settings) -> Dict[str, Any]:
    """Retrieves user profile details by ID."""
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    try:
        with engine.connect() as conn:
            try:
                uuid.UUID(user_id)
                query = text("SELECT id, email, created_at FROM rag_users WHERE id = CAST(:user_id AS uuid)")
            except (ValueError, AttributeError):
                query = text("SELECT id, email, created_at FROM rag_users WHERE id::text = :user_id")

            row = conn.execute(query, {"user_id": user_id}).fetchone()
            if not row:
                return {"id": user_id, "email": None}
            return {
                "id": str(row.id),
                "email": row.email,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
    finally:
        engine.dispose()
