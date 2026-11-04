import logging
from sqlalchemy import create_engine, text

from app.config import Settings

logger = logging.getLogger(__name__)


def run_migrations() -> None:
    """Executes database schema migrations and secures legacy unowned records."""
    settings = Settings.from_env()
    engine = create_engine(settings.database_url, pool_pre_ping=True)

    try:
        with engine.begin() as conn:
            # 1. Ensure pgcrypto extension for UUID generation
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto;"))

            # 2. Ingested files table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS rag_users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
                );
            """))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_rag_users_email ON rag_users(LOWER(email));"))

            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS rag_ingested_files (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id TEXT NOT NULL,
                    filename TEXT NOT NULL,
                    content_hash TEXT NOT NULL,
                    chunk_count INTEGER NOT NULL DEFAULT 0,
                    file_size BIGINT NOT NULL DEFAULT 0,
                    status TEXT NOT NULL DEFAULT 'completed',
                    error_message TEXT DEFAULT NULL,
                    ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                    CONSTRAINT uq_rag_ingested_files_user_hash UNIQUE (user_id, content_hash)
                );
            """))

            # For existing tables created under older versions, ensure all columns exist
            columns = [row[0] for row in conn.execute(text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'rag_ingested_files'
            """)).fetchall()]

            if "id" not in columns:
                conn.execute(text("ALTER TABLE rag_ingested_files ADD COLUMN id UUID DEFAULT gen_random_uuid();"))
                conn.execute(text("UPDATE rag_ingested_files SET id = gen_random_uuid() WHERE id IS NULL;"))
                conn.execute(text("ALTER TABLE rag_ingested_files ALTER COLUMN id SET NOT NULL;"))

            if "user_id" not in columns:
                conn.execute(text("ALTER TABLE rag_ingested_files ADD COLUMN user_id TEXT;"))
                # Quarantine legacy unowned records to prevent data leak
                conn.execute(text("UPDATE rag_ingested_files SET user_id = '__legacy_quarantine__' WHERE user_id IS NULL;"))
                conn.execute(text("ALTER TABLE rag_ingested_files ALTER COLUMN user_id SET NOT NULL;"))

            if "file_size" not in columns:
                conn.execute(text("ALTER TABLE rag_ingested_files ADD COLUMN file_size BIGINT NOT NULL DEFAULT 0;"))

            if "status" not in columns:
                conn.execute(text("ALTER TABLE rag_ingested_files ADD COLUMN status TEXT NOT NULL DEFAULT 'completed';"))

            if "error_message" not in columns:
                conn.execute(text("ALTER TABLE rag_ingested_files ADD COLUMN error_message TEXT DEFAULT NULL;"))

            if "updated_at" not in columns:
                conn.execute(text("ALTER TABLE rag_ingested_files ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();"))

            # Drop any legacy primary key that is not on id
            pk_cols = [row[0] for row in conn.execute(text("""
                SELECT a.attname
                FROM pg_index i
                JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
                WHERE i.indrelid = 'rag_ingested_files'::regclass AND i.indisprimary
            """)).fetchall()]

            if pk_cols != ["id"]:
                pk_constraint = conn.execute(text("""
                    SELECT conname FROM pg_constraint
                    WHERE conrelid = 'rag_ingested_files'::regclass AND contype = 'p'
                """)).scalar()
                if pk_constraint:
                    conn.execute(text(f"ALTER TABLE rag_ingested_files DROP CONSTRAINT {pk_constraint};"))
                conn.execute(text("ALTER TABLE rag_ingested_files ADD CONSTRAINT rag_ingested_files_pkey PRIMARY KEY (id);"))

            # Explicitly drop any legacy single-column UNIQUE constraint or index on content_hash alone
            # Uniqueness MUST be per-user (user_id, content_hash), allowing two users to upload identical files
            conn.execute(text("""
                DO $$
                DECLARE
                    r RECORD;
                BEGIN
                    FOR r IN (
                        SELECT c.conname 
                        FROM pg_constraint c
                        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
                        WHERE c.conrelid = 'rag_ingested_files'::regclass 
                          AND c.contype = 'u' 
                          AND array_length(c.conkey, 1) = 1
                          AND a.attname = 'content_hash'
                    ) LOOP
                        EXECUTE 'ALTER TABLE rag_ingested_files DROP CONSTRAINT ' || quote_ident(r.conname);
                    END LOOP;

                    FOR r IN (
                        SELECT indexname
                        FROM pg_indexes
                        WHERE tablename = 'rag_ingested_files'
                          AND indexdef LIKE '%UNIQUE INDEX%content_hash%'
                          AND indexdef NOT LIKE '%user_id%'
                    ) LOOP
                        EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(r.indexname);
                    END LOOP;
                END $$;
            """))

            # Ensure per-user unique constraint on (user_id, content_hash)
            has_uq = conn.execute(text("""
                SELECT 1 FROM pg_constraint
                WHERE conrelid = 'rag_ingested_files'::regclass 
                AND conname = 'uq_rag_ingested_files_user_hash'
            """)).scalar()
            if not has_uq:
                conn.execute(text("""
                    ALTER TABLE rag_ingested_files 
                    ADD CONSTRAINT uq_rag_ingested_files_user_hash UNIQUE (user_id, content_hash);
                """))

            # 3. Quarantine unowned records in langchain_pg_embedding (if table exists)
            has_embedding_table = conn.execute(text("""
                SELECT 1 FROM information_schema.tables WHERE table_name = 'langchain_pg_embedding'
            """)).scalar()
            if has_embedding_table:
                conn.execute(text("""
                    UPDATE langchain_pg_embedding
                    SET cmetadata = cmetadata || jsonb_build_object('user_id', '__legacy_quarantine__')
                    WHERE cmetadata->>'user_id' IS NULL;
                """))
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_langchain_pg_embedding_cmetadata_user 
                    ON langchain_pg_embedding ((cmetadata->>'user_id'));
                """))

            # Indexes on rag_ingested_files
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_rag_ingested_files_user 
                ON rag_ingested_files(user_id, status);
            """))

            # 4. Chat session and message tables
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS rag_chat_sessions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
                );
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_rag_chat_sessions_user 
                ON rag_chat_sessions(user_id, updated_at DESC);
            """))

            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS rag_chat_messages (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    session_id UUID NOT NULL REFERENCES rag_chat_sessions(id) ON DELETE CASCADE,
                    user_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    sources JSONB DEFAULT '[]'::jsonb,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
                );
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_rag_chat_messages_session 
                ON rag_chat_messages(session_id, created_at ASC);
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_rag_chat_messages_user 
                ON rag_chat_messages(user_id);
            """))

            # 5. Row-Level Security (RLS) policies (Defense-in-depth preparation)
            # NOTE: Under PostgreSQL RLS rules (PostgreSQL docs section 5.8), table owners
            # and superusers bypass RLS by default. Since the default Neon connection string
            # connects as neondb_owner (table owner), and LangChain PGVector does not set
            # session variables (SET LOCAL app.current_user_id), the primary and actual security
            # boundary is the application's verified identity and owner-scoped queries
            # (WHERE user_id = :user_id and filter={'user_id': user_id}).
            # These policies are prepared for when a non-owner database role is introduced.
            for table in ["rag_ingested_files", "rag_chat_sessions", "rag_chat_messages"]:
                conn.execute(text(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;"))
            
            conn.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_policies WHERE tablename = 'rag_ingested_files' AND policyname = 'rls_user_rag_ingested_files'
                    ) THEN
                        CREATE POLICY rls_user_rag_ingested_files ON rag_ingested_files
                        FOR ALL
                        USING (user_id = current_setting('app.current_user_id', true));
                    END IF;
                END $$;
            """))

            conn.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_policies WHERE tablename = 'rag_chat_sessions' AND policyname = 'rls_user_rag_chat_sessions'
                    ) THEN
                        CREATE POLICY rls_user_rag_chat_sessions ON rag_chat_sessions
                        FOR ALL
                        USING (user_id = current_setting('app.current_user_id', true));
                    END IF;
                END $$;
            """))

            conn.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_policies WHERE tablename = 'rag_chat_messages' AND policyname = 'rls_user_rag_chat_messages'
                    ) THEN
                        CREATE POLICY rls_user_rag_chat_messages ON rag_chat_messages
                        FOR ALL
                        USING (user_id = current_setting('app.current_user_id', true));
                    END IF;
                END $$;
            """))

            if has_embedding_table:
                conn.execute(text("ALTER TABLE langchain_pg_embedding ENABLE ROW LEVEL SECURITY;"))
                conn.execute(text("""
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_policies WHERE tablename = 'langchain_pg_embedding' AND policyname = 'rls_user_langchain_pg_embedding'
                        ) THEN
                            CREATE POLICY rls_user_langchain_pg_embedding ON langchain_pg_embedding
                            FOR ALL
                            USING (cmetadata->>'user_id' = current_setting('app.current_user_id', true));
                        END IF;
                    END $$;
                """))

        logger.info("Database migrations executed successfully.")
    finally:
        engine.dispose()
