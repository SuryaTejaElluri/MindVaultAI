import logging
from pathlib import Path
from typing import List

from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
import pypdf

from app.config import Settings
from app.ocr import extract_ocr_from_page

logger = logging.getLogger(__name__)


def load_and_split_file(file_path: Path) -> List[Document]:
    """Load a PDF, TXT, or Markdown file and return LangChain chunks with source metadata."""
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    suffix = file_path.suffix.lower()
    documents: List[Document] = []

    if suffix == ".pdf":
        loader = PyPDFLoader(str(file_path))
        loaded_docs = loader.load()

        # Check for scanned pages with empty text and attempt OCR
        reader: pypdf.PdfReader | None = None
        for idx, doc in enumerate(loaded_docs):
            if not doc.page_content.strip():
                if reader is None:
                    try:
                        reader = pypdf.PdfReader(str(file_path))
                    except Exception as err:
                        logger.warning(f"Could not open PDF with pypdf for OCR inspection: {err}")
                if reader and idx < len(reader.pages):
                    ocr_text = extract_ocr_from_page(reader.pages[idx], page_number=idx + 1)
                    if ocr_text and ocr_text.strip():
                        doc.page_content = ocr_text.strip()

            documents.append(doc)

    elif suffix in {".txt", ".md"}:
        documents = TextLoader(
            str(file_path),
            encoding="utf-8",
        ).load()
        # For plain text and markdown, page metadata can be 1
        for doc in documents:
            doc.metadata["page"] = 0
    else:
        raise ValueError("Supported file types are PDF, TXT, and MD.")

    # Store filename in metadata
    for document in documents:
        document.metadata["source"] = file_path.name

    settings = Settings.from_env()
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
    )
    chunks = splitter.split_documents(documents)

    valid_chunks = [chunk for chunk in chunks if chunk.page_content.strip()]
    if not valid_chunks:
        raise ValueError(
            "No readable text was found in the file. "
            "Scanned PDFs need OCR first. Set OCR_ENABLED=true and install Tesseract-OCR."
        )

    return valid_chunks
