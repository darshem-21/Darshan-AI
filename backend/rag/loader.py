
"""
Document Loader and Chunking Engine for Darshan AI RAG.
Supports PDF, TXT, Markdown, and source-code files.

PDF extraction uses pypdf. Scanned PDFs require OCR, which is not
included in this lightweight loader.
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Any


def sanitize_filename(filename: str) -> str:
    """Remove path traversal and unsafe filename characters."""
    clean = os.path.basename(filename)
    clean = re.sub(r"[^a-zA-Z0-9_.-]", "_", clean)
    return clean or "document.txt"

def _extract_with_pymupdf(file_path: Path) -> str:
    """Fallback extractor; returns "" if PyMuPDF is missing or finds nothing."""
    try:
        try:
            import pymupdf as fitz
        except ImportError:
            import fitz
        with fitz.open(str(file_path)) as doc:
            text = "\n\n".join(page.get_text() for page in doc)
        return text.replace("\x00", "").strip()
    except Exception as exc:
        print(f"[RAG] PyMuPDF fallback unavailable/failed: {exc}")
        return ""


def extract_text_from_pdf(file_path: Path) -> str:
    """Extract selectable text from a PDF using pypdf."""
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise RuntimeError(
            "PDF support is unavailable. Install the pypdf package."
        ) from exc

    try:
        reader = PdfReader(str(file_path), strict=False)

        if reader.is_encrypted:
            try:
                decrypted = reader.decrypt("")
            except Exception as exc:
                raise ValueError(
                    "This PDF is password-protected. Upload an unlocked PDF."
                ) from exc

            if not decrypted:
                raise ValueError(
                    "This PDF is password-protected. Upload an unlocked PDF."
                )

        if not reader.pages:
            raise ValueError("The uploaded PDF contains no pages.")

        text_parts = []

        for page_number, page in enumerate(reader.pages, start=1):
            try:
                page_text = page.extract_text() or ""
            except Exception as exc:
                print(
                    f"[RAG] Could not extract PDF page "
                    f"{page_number}: {exc}"
                )
                continue

            page_text = page_text.replace("\x00", "").strip()

            if page_text:
                text_parts.append(
                    f"--- Page {page_number} ---\n{page_text}"
                )

        extracted_text = "\n\n".join(text_parts).strip()

        if not extracted_text:
            extracted_text = _extract_with_pymupdf(file_path)

        print(
            f"[RAG] PDF pages: {len(reader.pages)}; "
            f"extracted characters: {len(extracted_text)}"
        )

        if not extracted_text:
            raise ValueError(
                "No selectable text was found in this PDF. "
                "It may be a scanned document. Try a text-based PDF; "
                "scanned PDFs require OCR."
            )

        return extracted_text

    except ValueError:
        raise
    except Exception as exc:
        print(f"[RAG] PDF parsing failed: {type(exc).__name__}: {exc}")
        raise ValueError(
            "The PDF could not be parsed. Check that it is a valid, "
            "readable PDF and try exporting it again."
        ) from exc


def load_document_text(file_path: Path) -> str:
    """Load text from a supported document."""
    suffix = file_path.suffix.lower()

    if suffix == ".pdf":
        return extract_text_from_pdf(file_path)

    try:
        with open(file_path, "r", encoding="utf-8-sig", errors="replace") as f:
            return f.read().replace("\x00", "")
    except OSError as exc:
        raise ValueError(
            "The uploaded text file could not be read."
        ) from exc


def chunk_text(
    text: str,
    source_name: str,
    user_id: str,
    chunk_size: int = 800,
    chunk_overlap: int = 150,
) -> List[Dict[str, Any]]:
    """Split extracted text into overlapping chunks for RAG."""
    if not text or not text.strip():
        return []

    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than zero.")

    if chunk_overlap < 0 or chunk_overlap >= chunk_size:
        raise ValueError(
            "chunk_overlap must be non-negative and smaller than chunk_size."
        )

    cleaned = text.replace("\r\n", "\n").replace("\r", "\n")
    cleaned = re.sub(r"[ \t]+\n", "\n", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)

    chunks: List[Dict[str, Any]] = []
    text_len = len(cleaned)
    start = 0
    chunk_idx = 1
    safe_name = sanitize_filename(source_name)

    while start < text_len:
        end = min(start + chunk_size, text_len)

        if end < text_len:
            last_newline = cleaned.rfind("\n", start, end)
            last_period = cleaned.rfind(". ", start, end)
            split_at = max(last_newline, last_period)

            if split_at > start + chunk_size // 2:
                end = split_at + (1 if split_at == last_period else 0)

        chunk_content = cleaned[start:end].strip()

        if chunk_content:
            chunks.append({
                "id": f"{safe_name}-c{chunk_idx}",
                "content": chunk_content,
                "user_id": user_id,
                "source": source_name,
                "chunk_index": chunk_idx,
                "char_start": start,
                "char_end": end,
            })
            chunk_idx += 1

        if end >= text_len:
            break

        start = max(start + 1, end - chunk_overlap)

    return chunks
