import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text


load_dotenv()

database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise ValueError("DATABASE_URL is missing from .env")

engine = create_engine(database_url, pool_pre_ping=True)

try:
    with engine.connect() as connection:
        database = connection.execute(
            text("SELECT current_database()")
        ).scalar_one()

        vector_enabled = connection.execute(
            text(
                "SELECT EXISTS "
                "(SELECT 1 FROM pg_extension WHERE extname = 'vector')"
            )
        ).scalar_one()

    print(f"Connected to database: {database}")
    print(f"pgvector enabled: {vector_enabled}")
finally:
    engine.dispose()