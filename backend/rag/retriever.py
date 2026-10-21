"""
Retriever and Citation Formatter for Darshan AI RAG.
Ranks retrieved chunks and builds source-cited prompts for LLM grounding.
"""

from typing import List, Dict, Any, Tuple
from backend.rag.vectorstore import VectorStoreManager


def retrieve_with_citations(
    user_id: str,
    query: str,
    top_k: int = 4,
    min_score: float = 0.25
) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Retrieves matching document chunks and constructs a cited context string
    along with metadata citations for the user interface.
    """
    results = VectorStoreManager.search(user_id=user_id, query=query, top_k=top_k)
    filtered = [r for r in results if r["score"] >= min_score]

    if not filtered:
        return "", []

    context_blocks = []
    citations = []

    for i, item in enumerate(filtered, 1):
        chunk = item["chunk"]
        score = item["score"]
        source = chunk["source"]
        chunk_idx = chunk.get("chunk_index", i)

        citation_id = f"[{i}]"
        context_blocks.append(
            f"--- Citation {citation_id} (Source: {source}, Chunk #{chunk_idx}, Relevance: {score}) ---\n"
            f"{chunk['content']}"
        )

        citations.append({
            "citation_id": citation_id,
            "source": source,
            "chunk_index": chunk_idx,
            "score": score,
            "snippet": chunk["content"][:240] + ("..." if len(chunk["content"]) > 240 else ""),
        })

    formatted_context = "\n\n".join(context_blocks)
    return formatted_context, citations
