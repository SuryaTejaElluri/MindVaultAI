from langchain_openai import OpenAIEmbeddings
from langchain_postgres import PGVector

from app.config import Settings


def get_vector_store() -> PGVector:
    settings = Settings.from_env()

    embeddings = OpenAIEmbeddings(
        model=settings.embedding_model,
        api_key=settings.openai_api_key,
    )

    return PGVector(
        embeddings=embeddings,
        collection_name=settings.collection_name,
        connection=settings.database_url,
        use_jsonb=True,
    )