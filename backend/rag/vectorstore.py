"""
Multi-user RAG storage.

When SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured, document
chunks and embeddings are persisted in public.darshan_ai_chunks. Otherwise,
the in-memory fallback is intended only for development/testing and is lost
when the server restarts.
"""
import math
import re
from typing import List, Dict, Any

import httpx

from backend.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

_IN_MEMORY_STORES: Dict[str, List[Dict[str, Any]]] = {}
_EMBEDDING_MODEL = None

TABLE = "darshan_ai_chunks"

print("[RAG] Supabase URL configured:", bool(SUPABASE_URL))
print("[RAG] Service-role key configured:", bool(SUPABASE_SERVICE_ROLE_KEY))
print(
    "[RAG] Key appears to be publishable:",
    SUPABASE_SERVICE_ROLE_KEY.startswith("sb_publishable_")
)



def supabase_enabled() -> bool:
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
    global _EMBEDDING_MODEL
    if _EMBEDDING_MODEL is None:
        try:
            from sentence_transformers import SentenceTransformer
            _EMBEDDING_MODEL = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        except Exception as exc:
            print(f"Embedding model unavailable; using lexical fallback: {exc}")
            _EMBEDDING_MODEL = "fallback"
    return _EMBEDDING_MODEL


def compute_fallback_embedding(text: str, dim: int = 128) -> List[float]:
    words = re.findall(r"\b[a-zA-Z0-9_-]{2,}\b", text.lower())
    vector = [0.0] * dim
    for word in words:
        index = sum(ord(c) * (31 ** i) for i, c in enumerate(word[:8])) % dim
        vector[index] += 1.0
    norm = math.sqrt(sum(value * value for value in vector))
    return [value / norm for value in vector] if norm else vector


def generate_embedding(text: str) -> List[float]:
    model = get_embedding_model()
    if model != "fallback":
        try:
            return model.encode(text, normalize_embeddings=True).tolist()
        except Exception as exc:
            print(f"Embedding failed; using lexical fallback: {exc}")
    return compute_fallback_embedding(text)


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    return dot / (norm1 * norm2) if norm1 and norm2 else 0.0


def _persist_chunks(user_id: str, chunks: List[Dict[str, Any]]) -> None:
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
    with httpx.Client(timeout=20.0) as client:
        response = client.post(
            _rest_url(),
            params={"on_conflict": "user_id,source,chunk_index"},
            headers=_headers("resolution=merge-duplicates,return=minimal"),
            json=rows,
        )
    if response.is_error:
        print("[RAG] Supabase status:", response.status_code)
        print("[RAG] Supabase response:", response.text)
    response.raise_for_status()


def _fetch_chunks(user_id: str) -> List[Dict[str, Any]]:
    with httpx.Client(timeout=20.0) as client:
        response = client.get(
            _rest_url(),
            params={
                "select": "user_id,source,chunk_index,content,embedding,char_start,char_end",
                "user_id": f"eq.{user_id}",
                "order": "source.asc,chunk_index.asc",
                "limit": "5000",
            },
            headers=_headers(),
        )
    response.raise_for_status()
    return response.json()


class VectorStoreManager:
    """Multi-tenant chunk index with Supabase persistence when configured."""

    @staticmethod
    def add_chunks(user_id: str, chunks: List[Dict[str, Any]]) -> int:
        prepared = []
        for chunk in chunks:
            item = dict(chunk)
            item["embedding"] = generate_embedding(item["content"])
            prepared.append(item)

        if supabase_enabled():
            # Do not silently report success if persistent storage fails.
            _persist_chunks(user_id, prepared)
        else:
            _IN_MEMORY_STORES.setdefault(user_id, []).extend(prepared)

        return len(prepared)

    @staticmethod
    def get_user_documents(user_id: str) -> List[Dict[str, Any]]:
        chunks = _fetch_chunks(user_id) if supabase_enabled() else _IN_MEMORY_STORES.get(user_id, [])
        stats: Dict[str, Dict[str, Any]] = {}
        for chunk in chunks:
            source = chunk["source"]
            if source not in stats:
                stats[source] = {"source": source, "chunk_count": 0, "char_count": 0}
            stats[source]["chunk_count"] += 1
            stats[source]["char_count"] += len(chunk["content"])
        return list(stats.values())

    @staticmethod
    def search(user_id: str, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        chunks = _fetch_chunks(user_id) if supabase_enabled() else _IN_MEMORY_STORES.get(user_id, [])
        if not chunks:
            return []

        query_embedding = generate_embedding(query)
        scored = []
        query_terms = [term for term in query.lower().split() if len(term) > 3]
        for chunk in chunks:
            embedding = chunk.get("embedding")
            if not isinstance(embedding, list):
                embedding = generate_embedding(chunk["content"])
            score = cosine_similarity(query_embedding, embedding)
            content_lower = chunk["content"].lower()
            if any(term in content_lower for term in query_terms):
                score += 0.15
            scored.append({
                "chunk": chunk,
                "score": min(round(score, 4), 1.0),
            })
        scored.sort(key=lambda item: item["score"], reverse=True)
        return scored[:max(1, min(int(top_k), 10))]

    @staticmethod
    def clear_user_index(user_id: str) -> bool:
        if supabase_enabled():
            with httpx.Client(timeout=20.0) as client:
                response = client.delete(
                    _rest_url(),
                    params={"user_id": f"eq.{user_id}"},
                    headers=_headers("return=minimal"),
                )
            response.raise_for_status()
        else:
            _IN_MEMORY_STORES[user_id] = []
        return True
