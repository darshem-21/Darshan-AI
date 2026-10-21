"""
Document Loader and Chunking Engine for Darshan AI RAG.
Supports PDF, TXT, Markdown, and source code files with security validation.
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Any


def sanitize_filename(filename: str) -> str:
    """Removes path traversal patterns and unsafe characters."""
    clean = os.path.basename(filename)
    clean = re.sub(r'[^a-zA-Z0-9_.-]', '_', clean)
    return clean or "document.txt"


def extract_text_from_pdf(file_path: Path) -> str:
    """Extracts text from PDF files using pypdf if available, with resilient fallback."""
    try:
        import pypdf
        reader = pypdf.PdfReader(str(file_path))
        text_parts = []
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            if page_text.strip():
                text_parts.append(f"--- Page {i + 1} ---\n{page_text}")
        return "\n\n".join(text_parts)
    except Exception as e:
        # Fallback basic binary text scan
        try:
            with open(file_path, "rb") as f:
                content = f.read().decode("latin-1", errors="ignore")
                matches = re.findall(r"\(([^\(\)]+)\)\s*Tj", content)
                if matches:
                    return " ".join(matches)
        except Exception:
            pass
        return f"[PDF parsing notice: Extracted using fallback reader. {str(e)}]"


def load_document_text(file_path: Path) -> str:
    """Loads raw text from supported document formats."""
    suffix = file_path.suffix.lower()
    if suffix == ".pdf":
        return extract_text_from_pdf(file_path)
    else:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()


def chunk_text(
    text: str,
    source_name: str,
    user_id: str,
    chunk_size: int = 800,
    chunk_overlap: int = 150
) -> List[Dict[str, Any]]:
    """
    Chunks text with overlapping windows and preserves source metadata for citations.
    """
    if not text.strip():
        return []

    # Clean redundant whitespace while keeping paragraph breaks
    cleaned = re.sub(r'\r\n', '\n', text)
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)

    chunks: List[Dict[str, Any]] = []
    start = 0
    text_len = len(cleaned)
    chunk_idx = 1

    while start < text_len:
        end = min(start + chunk_size, text_len)
        # Attempt to split at clean sentence or paragraph boundary
        if end < text_len:
            last_newline = cleaned.rfind('\n', start, end)
            last_period = cleaned.rfind('. ', start, end)
            split_at = max(last_newline, last_period)
            if split_at > start + (chunk_size // 2):
                end = split_at + (1 if split_at == last_period else 0)

        chunk_content = cleaned[start:end].strip()
        if chunk_content:
            chunks.append({
                "id": f"{sanitize_filename(source_name)}-c{chunk_idx}",
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
