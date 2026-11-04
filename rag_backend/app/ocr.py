import io
import logging
import shutil
from typing import Optional

from app.config import Settings

logger = logging.getLogger(__name__)


def is_tesseract_installed() -> bool:
    """Checks whether the Tesseract OCR CLI binary is installed and discoverable on PATH."""
    return shutil.which("tesseract") is not None


def extract_ocr_from_page(pdf_page, page_number: int) -> Optional[str]:
    """Attempts OCR extraction on images embedded in a scanned PDF page.
    
    If OCR_ENABLED is True and pytesseract/tesseract are installed, runs OCR on
    extracted images. Otherwise returns None or empty string, preserving a clear
    hook for cloud or local OCR engines.
    """
    settings = Settings.from_env()
    if not settings.ocr_enabled:
        return None

    try:
        import pytesseract  # type: ignore
        from PIL import Image  # type: ignore
    except ImportError:
        logger.warning(
            "OCR is enabled in settings, but 'pytesseract' or 'Pillow' is not installed in Python environment."
        )
        return None

    if not is_tesseract_installed():
        logger.warning(
            "OCR is enabled, but the 'tesseract' system binary is not found on PATH. "
            "Please install Tesseract-OCR."
        )
        return None

    extracted_texts = []
    try:
        # pypdf exposes page.images containing embedded image objects
        if hasattr(pdf_page, "images") and pdf_page.images:
            for img_index, img_file in enumerate(pdf_page.images):
                image = Image.open(io.BytesIO(img_file.data))
                text = pytesseract.image_to_string(image)
                if text.strip():
                    extracted_texts.append(text.strip())

        if extracted_texts:
            return "\n\n".join(extracted_texts)
    except Exception as err:
        logger.error(f"OCR processing failed for page {page_number}: {err}")

    return None
