import json
import logging
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import create_engine, text

from app.config import Settings

logger = logging.getLogger(__name__)


def list_user_sessions(user_id: str) -> List[Dict[str, Any]]:
    """Lists all chat sessions owned by the authenticated user."""
    settings = Settings.from_env()
    engine = create_engine(settings.database_url, pool_pre_ping=True)

    try:
        with engine.connect() as conn:
            rows = conn.execute(
                text("""
                    SELECT id, title, created_at, updated_at
                    FROM rag_chat_sessions
                    WHERE user_id = :user_id
                    ORDER BY updated_at DESC
                """),
                {"user_id": user_id},
            ).fetchall()

            return [
                {
                    "id": str(row.id),
                    "title": row.title,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                    "updated_at": row.updated_at.isoformat() if row.updated_at else None,
                }
                for row in rows
            ]
    finally:
        engine.dispose()


def create_user_session(user_id: str, title: Optional[str] = None) -> Dict[str, Any]:
    """Creates a new chat session owned by the authenticated user."""
    session_id = str(uuid4())
    session_title = (title or "New Chat").strip()[:100]

    settings = Settings.from_env()
    engine = create_engine(settings.database_url, pool_pre_ping=True)

    try:
        with engine.begin() as conn:
            conn.execute(
                text("""
                    INSERT INTO rag_chat_sessions (id, user_id, title)
                    VALUES (:id, :user_id, :title)
                """),
                {"id": session_id, "user_id": user_id, "title": session_title},
            )

        return {
            "id": session_id,
            "title": session_title,
            "user_id": user_id,
        }
    finally:
        engine.dispose()


def get_user_session(user_id: str, session_id: str) -> Dict[str, Any]:
    """Retrieves session details and its full message history for the owner."""
    settings = Settings.from_env()
    engine = create_engine(settings.database_url, pool_pre_ping=True)

    try:
        with engine.connect() as conn:
            session = conn.execute(
                text("""
                    SELECT id, title, created_at, updated_at
                    FROM rag_chat_sessions
                    WHERE id = :id AND user_id = :user_id
                """),
                {"id": session_id, "user_id": user_id},
            ).first()

            if not session:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Chat session '{session_id}' not found.",
                )

            messages = conn.execute(
                text("""
                    SELECT id, role, content, sources, created_at
                    FROM rag_chat_messages
                    WHERE session_id = :session_id AND user_id = :user_id
                    ORDER BY created_at ASC
                """),
                {"session_id": session_id, "user_id": user_id},
            ).fetchall()

            return {
                "id": str(session.id),
                "title": session.title,
                "created_at": session.created_at.isoformat() if session.created_at else None,
                "updated_at": session.updated_at.isoformat() if session.updated_at else None,
                "messages": [
                    {
                        "id": str(m.id),
                        "role": m.role,
                        "content": m.content,
                        "sources": m.sources or [],
                        "created_at": m.created_at.isoformat() if m.created_at else None,
                    }
                    for m in messages
                ],
            }
    finally:
        engine.dispose()


def delete_user_session(user_id: str, session_id: str) -> Dict[str, Any]:
    """Deletes a chat session and all cascading messages belonging to the owner."""
    settings = Settings.from_env()
    engine = create_engine(settings.database_url, pool_pre_ping=True)

    try:
        with engine.begin() as conn:
            result = conn.execute(
                text("""
                    DELETE FROM rag_chat_sessions
                    WHERE id = :id AND user_id = :user_id
                """),
                {"id": session_id, "user_id": user_id},
            )

            if result.rowcount == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Chat session '{session_id}' not found.",
                )

        return {"status": "deleted", "session_id": session_id}
    finally:
        engine.dispose()


def append_message(
    session_id: str,
    user_id: str,
    role: str,
    content: str,
    sources: Optional[List[Dict[str, Any]]] = None,
) -> None:
    """Appends a single message (user or assistant) to a session and updates timestamp."""
    settings = Settings.from_env()
    engine = create_engine(settings.database_url, pool_pre_ping=True)

    try:
        with engine.begin() as conn:
            conn.execute(
                text("""
                    INSERT INTO rag_chat_messages (session_id, user_id, role, content, sources)
                    VALUES (:session_id, :user_id, :role, :content, :sources)
                """),
                {
                    "session_id": session_id,
                    "user_id": user_id,
                    "role": role,
                    "content": content,
                    "sources": json.dumps(sources or []),
                },
            )

            conn.execute(
                text("""
                    UPDATE rag_chat_sessions
                    SET updated_at = now()
                    WHERE id = :session_id AND user_id = :user_id
                """),
                {"session_id": session_id, "user_id": user_id},
            )
    finally:
        engine.dispose()

