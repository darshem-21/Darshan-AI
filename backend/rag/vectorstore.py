
"""
Multi-user RAG storage.

When SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured, document
chunks and embeddings are persisted in public.darshan_ai_chunks.

The default lexical embedding mode avoids loading a machine-learning model,
which is useful on memory-constrained hosting such as Render's free instance.

Set EMBEDDINGS_BACKEND=local to use Sentence Transformers instead.
Do not mix lexical and semantic embeddings in the same user's document index.
"""

import math
import os
import re
from typing import List, Dict, Any

import httpx

from backend.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY


_IN_MEMORY_STORES: Dict[str, List[Dict[str, Any]]] = {}
_EMBEDDING_MODEL = None

TABLE = "darshan_ai_chunks"
LEXICAL_DIMENSION = 128
SUPABASE_TIMEOUT = 30.0
PERSIST_BATCH_SIZE = 50

print("[RAG] Supabase URL configured:", bool(SUPABASE_URL))
print("[RAG] Service-role key configured:", bool(SUPABASE_SERVICE_ROLE_KEY))


def supabase_enabled() -> bool:
    """Return whether persistent Supabase storage is configured."""
    return bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)


def _headers(prefer: str = "") -> Dict[str, str]:
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }

    if prefer:
        headers["Prefer"] = prefer

    return headers


def _rest_url() -> str:
    return f"{SUPABASE_URL.rstrip('/')}/rest/v1/{TABLE}"


def get_embedding_model():
    """
    Initialize the embedding backend once.

    Lexical mode is the default to reduce memory use on free hosting.
    The local mode loads Sentence Transformers only when explicitly enabled.
    """
    global _EMBEDDING_MODEL

    if _EMBEDDING_MODEL is not None:
        return _EMBEDDING_MODEL

    backend = os.getenv("EMBEDDINGS_BACKEND", "lexical").strip().lower()

    if backend != "local":
        _EMBEDDING_MODEL = "fallback"
        print("[RAG] Using lightweight lexical embeddings")
        return _EMBEDDING_MODEL

    try:
        from sentence_transformers import SentenceTransformer

        print("[RAG] Loading Sentence Transformers model...")
        _EMBEDDING_MODEL = SentenceTransformer(
            "sentence-transformers/all-MiniLM-L6-v2"
        )
        print("[RAG] Sentence Transformers model loaded")
    except Exception as exc:
        print(f"[RAG] Model unavailable; using lexical fallback: {exc}")
        _EMBEDDING_MODEL = "fallback"

    return _EMBEDDING_MODEL


def compute_fallback_embedding(
    text: str,
    dim: int = LEXICAL_DIMENSION,
) -> List[float]:
    """
    Create a lightweight, normalized lexical vector.

    This is not a semantic embedding model. It hashes tokens into a fixed-size
    vector and is intended as a low-resource retrieval fallback.
    """
    words = re.findall(r"\b[a-zA-Z0-9_-]{2,}\b", text.lower())
    vector = [0.0] * dim

    for word in words:
        index = sum(
            ord(char) * (31 ** position)
            for position, char in enumerate(word[:8])
        ) % dim
        vector[index] += 1.0

    norm = math.sqrt(sum(value * value for value in vector))

    if norm:
        return [value / norm for value in vector]

    return vector


def generate_embedding(text: str) -> List[float]:
    """Generate a vector using the configured backend."""
    model = get_embedding_model()

    if model == "fallback":
        return compute_fallback_embedding(text)

    try:
        return model.encode(
            text,
            normalize_embeddings=True,
        ).tolist()
    except Exception as exc:
        # Do not silently mix vector types in the same index.
        print(f"[RAG] Semantic embedding generation failed: {exc}")
        raise RuntimeError(
            "Embedding generation failed. Check the backend logs."
        ) from exc


def cosine_similarity(
    v1: List[float],
    v2: List[float],
) -> float:
    """Calculate cosine similarity, returning zero for incompatible vectors."""
    if not v1 or len(v1) != len(v2):
        return 0.0

    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))

    if not norm1 or not norm2:
        return 0.0

    return dot / (norm1 * norm2)


def _persist_chunks(
    user_id: str,
    chunks: List[Dict[str, Any]],
) -> None:
    """
    Persist chunks in smaller batches to avoid oversized REST requests.

    Each batch is upserted using the existing user/source/chunk_index key.
    """
    if not chunks:
        return

    rows = []

    for chunk in chunks:
        rows.append({
            "user_id": user_id,
            "source": chunk["source"],
            "chunk_index": chunk["chunk_index"],
            "content": chunk["content"],
            "embedding": chunk["embedding"],
            "char_start": chunk.get("char_start", 0),
            "char_end": chunk.get("char_end", 0),
        })

    total = len(rows)

    with httpx.Client(timeout=SUPABASE_TIMEOUT) as client:
        for start in range(0, total, PERSIST_BATCH_SIZE):
            batch = rows[start:start + PERSIST_BATCH_SIZE]

            print(
                f"[RAG] Persisting chunks "
                f"{start + 1}-{start + len(batch)} of {total}"
            )

            response = client.post(
                _rest_url(),
                params={
                    "on_conflict": "user_id,source,chunk_index",
                },
                headers=_headers(
                    "resolution=merge-duplicates,return=minimal"
                ),
                json=batch,
            )

            if response.is_error:
                print("[RAG] Supabase status:", response.status_code)
                print("[RAG] Supabase response:", response.text[:1000])

            response.raise_for_status()

    print(f"[RAG] Successfully persisted {total} chunks")


def _fetch_chunks(user_id: str) -> List[Dict[str, Any]]:
    """Fetch stored chunks for one user."""
    with httpx.Client(timeout=SUPABASE_TIMEOUT) as client:
        response = client.get(
            _rest_url(),
            params={
                "select": (
                    "user_id,source,chunk_index,content,embedding,"
                    "char_start,char_end"
                ),
                "user_id": f"eq.{user_id}",
                "order": "source.asc,chunk_index.asc",
                "limit": "5000",
            },
            headers=_headers(),
        )

    if response.is_error:
        print("[RAG] Supabase fetch failed:", response.status_code)
        print("[RAG] Supabase response:", response.text[:1000])

    response.raise_for_status()
    return response.json()


class VectorStoreManager:
    """Multi-tenant chunk index with Supabase persistence when configured."""

    @staticmethod
    def add_chunks(
        user_id: str,
        chunks: List[Dict[str, Any]],
    ) -> int:
        """Generate embeddings and persist document chunks."""
        if not chunks:
            return 0

        print(f"[RAG] Preparing {len(chunks)} chunks")

        prepared = []

        for index, chunk in enumerate(chunks, start=1):
            item = dict(chunk)
            item["embedding"] = generate_embedding(item["content"])
            prepared.append(item)

            if index % 25 == 0 or index == len(chunks):
                print(f"[RAG] Embedded {index}/{len(chunks)} chunks")

        if supabase_enabled():
            _persist_chunks(user_id, prepared)
        else:
            _IN_MEMORY_STORES.setdefault(user_id, []).extend(prepared)
            print("[RAG] Stored chunks in memory; they will be lost on restart")

        return len(prepared)

    @staticmethod
    def get_user_documents(user_id: str) -> List[Dict[str, Any]]:
        """Return document-level statistics for the specified user."""
        chunks = (
            _fetch_chunks(user_id)
            if supabase_enabled()
            else _IN_MEMORY_STORES.get(user_id, [])
        )

        stats: Dict[str, Dict[str, Any]] = {}

        for chunk in chunks:
            source = chunk["source"]

            if source not in stats:
                stats[source] = {
                    "source": source,
                    "chunk_count": 0,
                    "char_count": 0,
                }

            stats[source]["chunk_count"] += 1
            stats[source]["char_count"] += len(chunk["content"])

        return list(stats.values())

    @staticmethod
    def get_document_text(
        user_id: str,
        source: str,
        max_chars: int = 30000,
    ) -> str:
        """Return the indexed text of one document (chunks in order)."""
        chunks = (
            _fetch_chunks(user_id)
            if supabase_enabled()
            else _IN_MEMORY_STORES.get(user_id, [])
        )
        mine = sorted(
            (c for c in chunks if c.get("source") == source),
            key=lambda c: c.get("chunk_index", 0),
        )
        return "\n\n".join(c["content"] for c in mine)[:max_chars]

    @staticmethod
    def search(
        user_id: str,
        query: str,
        top_k: int = 4,
    ) -> List[Dict[str, Any]]:
        """Rank a user's stored chunks against a query."""
        chunks = (
            _fetch_chunks(user_id)
            if supabase_enabled()
            else _IN_MEMORY_STORES.get(user_id, [])
        )

        if not chunks:
            return []

        query_embedding = generate_embedding(query)
        query_terms = [
            term for term in re.findall(r"\w+", query.lower())
            if len(term) > 3
        ]

        scored = []

        for chunk in chunks:
            embedding = chunk.get("embedding")

            if not isinstance(embedding, list) or len(embedding) != len(query_embedding):
                embedding = generate_embedding(chunk["content"])

            score = cosine_similarity(query_embedding, embedding)
            content_lower = chunk["content"].lower()

            if any(term in content_lower for term in query_terms):
                score += 0.15

            scored.append({
                "chunk": chunk,
                "score": min(round(score, 4), 1.0),
            })

        scored.sort(
            key=lambda item: item["score"],
            reverse=True,
        )

        return scored[:max(1, min(int(top_k), 10))]

    @staticmethod
    def clear_user_index(user_id: str) -> bool:
        """Delete all indexed chunks belonging to one user."""
        if supabase_enabled():
            with httpx.Client(timeout=SUPABASE_TIMEOUT) as client:
                response = client.delete(
                    _rest_url(),
                    params={"user_id": f"eq.{user_id}"},
                    headers=_headers("return=minimal"),
                )

            if response.is_error:
                print("[RAG] Supabase delete failed:", response.status_code)
                print("[RAG] Supabase response:", response.text[:1000])

            response.raise_for_status()
        else:
            _IN_MEMORY_STORES[user_id] = []

        print("[RAG] Cleared document index for user")
        return True
