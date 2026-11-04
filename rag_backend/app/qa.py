import logging
from typing import Any, Dict, List, Optional

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from app.chat_history import append_message, create_user_session, get_user_session
from app.config import Settings
from app.vector_store import get_vector_store

logger = logging.getLogger(__name__)


def answer_question(
    question: str,
    user_id: str,
    k: int = 5,
    session_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Answers a user question scoped strictly to their private documents and chat history."""
    question = question.strip()
    if not question:
        raise ValueError("Question cannot be empty.")

    settings = Settings.from_env()
    vector_store = get_vector_store()

    # If no session_id is provided, start a new chat session for the user
    if not session_id:
        new_session = create_user_session(user_id=user_id, title=question[:50])
        session_id = new_session["id"]
    else:
        # Verify ownership of existing session
        get_user_session(user_id=user_id, session_id=session_id)

    # Scoped vector similarity search with score
    # Note: PGVector default distance metric is cosine distance (0.0 = identical, 1.0+ = dissimilar)
    try:
        docs_and_scores = vector_store.similarity_search_with_score(
            question,
            k=k,
            filter={"user_id": user_id},
        )
    except Exception as err:
        logger.error(f"Vector search failed: {err}")
        docs_and_scores = []

    # Filter out weak matches beyond the configured distance threshold
    filtered_results = [
        (doc, score)
        for doc, score in docs_and_scores
        if score <= settings.similarity_threshold
    ]

    # If no documents are ingested or none meet the relevance threshold, return a grounded answer
    if not filtered_results:
        no_match_answer = (
            "I could not find sufficiently relevant information in your uploaded documents to answer this question."
        )
        append_message(
            session_id=session_id,
            user_id=user_id,
            role="user",
            content=question,
            sources=[],
        )
        append_message(
            session_id=session_id,
            user_id=user_id,
            role="assistant",
            content=no_match_answer,
            sources=[],
        )
        return {
            "answer": no_match_answer,
            "sources": [],
            "session_id": session_id,
            "grounded": False,
        }

    # Format human-readable context and extract citations
    context_blocks = []
    sources: List[Dict[str, Any]] = []
    seen_sources = set()

    for doc, score in filtered_results:
        filename = doc.metadata.get("source", "unknown")
        doc_id = doc.metadata.get("doc_id")
        page = doc.metadata.get("page")

        # LangChain PDF page numbers start at 0; convert to human-friendly 1-indexed numbers
        readable_page = int(page) + 1 if page is not None else None

        page_str = f", Page {readable_page}" if readable_page else ""
        context_blocks.append(
            f"[Source: {filename}{page_str}]\n{doc.page_content}"
        )

        source_key = (filename, readable_page)
        if source_key not in seen_sources:
            seen_sources.add(source_key)
            preview = doc.page_content.strip()[:180] + ("..." if len(doc.page_content) > 180 else "")
            sources.append({
                "document_id": doc_id,
                "filename": filename,
                "page": readable_page,
                "distance": round(float(score), 4),
                "preview": preview,
            })

    context = "\n\n".join(context_blocks)

    # Retrieve prior conversation messages (last 6 turns) for multi-turn context
    prior_session = get_user_session(user_id=user_id, session_id=session_id)
    history_messages = []
    for msg in prior_session["messages"][-6:]:
        if msg["role"] == "user":
            history_messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            history_messages.append(AIMessage(content=msg["content"]))

    # System prompt enforcing grounded citations
    system_instruction = (
        "You are an assistant answering questions strictly based on the provided document context. "
        "Rules:\n"
        "1. Use only the supplied document context to answer the question.\n"
        "2. If the context does not contain sufficient facts to answer, explicitly state that you cannot answer from the documents.\n"
        "3. Always cite your sources in the text using format '[Source: filename, Page X]' (omit Page if not available).\n"
        "4. Do not invent facts or cite documents that are not in the provided context."
    )

    prompt_messages = [
        SystemMessage(content=system_instruction),
        *history_messages,
        HumanMessage(content=f"Question:\n{question}\n\nDocument Context:\n{context}"),
    ]

    model = ChatOpenAI(
        model=settings.chat_model,
        api_key=settings.openai_api_key,
        temperature=0,
    )

    chain = model | StrOutputParser()
    answer = chain.invoke(prompt_messages)

    # Persist chat history
    append_message(
        session_id=session_id,
        user_id=user_id,
        role="user",
        content=question,
        sources=[],
    )
    append_message(
        session_id=session_id,
        user_id=user_id,
        role="assistant",
        content=answer,
        sources=sources,
    )

    return {
        "answer": answer,
        "sources": sources,
        "session_id": session_id,
        "grounded": True,
    }
