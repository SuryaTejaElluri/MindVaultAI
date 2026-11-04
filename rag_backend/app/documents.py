import logging
from typing import Any, Dict, List

from fastapi import HTTPException, status
from sqlalchemy import create_engine, text

from app.config import Settings

logger = logging.getLogger(__name__)


def list_user_documents(user_id: str) -> List[Dict[str, Any]]:
    """Lists all documents registered to the authenticated owner."""
    settings = Settings.from_env()
    engine = create_engine(settings.database_url, pool_pre_ping=True)

    try:
        with engine.connect() as conn:
            rows = conn.execute(
                text("""
                    SELECT id, filename, content_hash, file_size, chunk_count, 
                           status, error_message, ingested_at, updated_at
                    FROM rag_ingested_files
                    WHERE user_id = :user_id
                    ORDER BY ingested_at DESC
                """),
                {"user_id": user_id},
            ).fetchall()

            return [
                {
                    "id": str(row.id),
                    "filename": row.filename,
                    "content_hash": row.content_hash,
                    "file_size": row.file_size,
                    "chunk_count": row.chunk_count,
                    "status": row.status,
                    "error_message": row.error_message,
                    "ingested_at": row.ingested_at.isoformat() if row.ingested_at else None,
                    "updated_at": row.updated_at.isoformat() if row.updated_at else None,
                }
                for row in rows
            ]
    finally:
        engine.dispose()


def get_user_document(user_id: str, document_id: str) -> Dict[str, Any]:
    """Retrieves document details and ingestion status for the authenticated owner."""
    settings = Settings.from_env()
    engine = create_engine(settings.database_url, pool_pre_ping=True)

    try:
        with engine.connect() as conn:
            row = conn.execute(
                text("""
                    SELECT id, filename, content_hash, file_size, chunk_count, 
                           status, error_message, ingested_at, updated_at
                    FROM rag_ingested_files
                    WHERE id = :id AND user_id = :user_id
                """),
                {"id": document_id, "user_id": user_id},
            ).first()

            if not row:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Document '{document_id}' not found.",
                )

            return {
                "id": str(row.id),
                "filename": row.filename,
                "content_hash": row.content_hash,
                "file_size": row.file_size,
                "chunk_count": row.chunk_count,
                "status": row.status,
                "error_message": row.error_message,
                "ingested_at": row.ingested_at.isoformat() if row.ingested_at else None,
                "updated_at": row.updated_at.isoformat() if row.updated_at else None,
            }
    finally:
        engine.dispose()


def rename_user_document(user_id: str, document_id: str, new_filename: str) -> Dict[str, Any]:
    """Renames a document in the registry and updates source metadata in vector chunks."""
    new_filename = new_filename.strip().replace("\\", "/").split("/")[-1]
    if not new_filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename cannot be empty.",
        )

    settings = Settings.from_env()
    engine = create_engine(settings.database_url, pool_pre_ping=True)

    try:
        with engine.begin() as conn:
            doc = conn.execute(
                text("""
                    SELECT id, content_hash, filename
                    FROM rag_ingested_files
                    WHERE id = :id AND user_id = :user_id
                """),
                {"id": document_id, "user_id": user_id},
            ).first()

            if not doc:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Document '{document_id}' not found.",
                )

            # Update document registry
            conn.execute(
                text("""
                    UPDATE rag_ingested_files
                    SET filename = :new_filename, updated_at = now()
                    WHERE id = :id AND user_id = :user_id
                """),
                {"id": document_id, "user_id": user_id, "new_filename": new_filename},
            )

            # Update vector chunk metadata source to reflect the new filename
            conn.execute(
                text("""
                    UPDATE langchain_pg_embedding
                    SET cmetadata = cmetadata || jsonb_build_object('source', CAST(:new_filename AS text))
                    WHERE cmetadata->>'user_id' = :user_id 
                      AND (cmetadata->>'doc_id' = :id OR cmetadata->>'content_hash' = :content_hash)
                """),
                {
                    "new_filename": new_filename,
                    "user_id": user_id,
                    "id": document_id,
                    "content_hash": doc.content_hash,
                },
            )

        return {
            "status": "renamed",
            "document_id": document_id,
            "old_filename": doc.filename,
            "new_filename": new_filename,
        }
    finally:
        engine.dispose()


def delete_user_document(user_id: str, document_id: str) -> Dict[str, Any]:
    """Deletes a document from the registry and removes all associated vector embeddings."""
    settings = Settings.from_env()
    engine = create_engine(settings.database_url, pool_pre_ping=True)

    try:
        with engine.begin() as conn:
            doc = conn.execute(
                text("""
                    SELECT id, content_hash, filename
                    FROM rag_ingested_files
                    WHERE id = :id AND user_id = :user_id
                """),
                {"id": document_id, "user_id": user_id},
            ).first()

            if not doc:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Document '{document_id}' not found.",
                )

            # 1. Delete associated vector chunks
            deleted_chunks = conn.execute(
                text("""
                    DELETE FROM langchain_pg_embedding
                    WHERE cmetadata->>'user_id' = :user_id
                      AND (cmetadata->>'doc_id' = :id OR cmetadata->>'content_hash' = :content_hash)
                """),
                {
                    "user_id": user_id,
                    "id": document_id,
                    "content_hash": doc.content_hash,
                },
            ).rowcount

            # 2. Delete registry entry
            conn.execute(
                text("""
                    DELETE FROM rag_ingested_files
                    WHERE id = :id AND user_id = :user_id
                """),
                {"id": document_id, "user_id": user_id},
            )

        return {
            "status": "deleted",
            "document_id": document_id,
            "filename": doc.filename,
            "deleted_chunks": deleted_chunks,
        }
    finally:
        engine.dispose()
