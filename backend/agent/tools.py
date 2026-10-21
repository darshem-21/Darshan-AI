"""
LangChain Tools for Darshan AI.
Exposes RAG retrieval, GitHub inspection, REA reverse engineering, and creative automation.
"""

from typing import Dict, Any, List, Optional
from backend.rag.retriever import retrieve_with_citations
from backend.github.analyzer import analyze_github_repository
from backend.rea.rea_adapter import run_rea_doctor, inspect_target_with_rea
from backend.creative.creative_tools import CreativeToolsManager


class DarshanToolsRegistry:
    """Registry of tools accessible by the LangGraph agent."""

    @staticmethod
    async def rag_search(user_id: Optional[str], query: str) -> Dict[str, Any]:
        """Searches indexed PDF/TXT documents for the user."""
        if not user_id:
            return {
                "context": "",
                "citations": [],
                "message": "User is in guest mode. Documents are only indexed when authenticated or uploaded in session."
            }
        context, citations = retrieve_with_citations(user_id=user_id, query=query, top_k=4)
        return {"context": context, "citations": citations}

    @staticmethod
    async def github_analyze(repo_url: str) -> Dict[str, Any]:
        """Inspects GitHub repository architecture."""
        return await analyze_github_repository(repo_url)

    @staticmethod
    async def rea_doctor() -> Dict[str, Any]:
        """Runs REA reverse-engineering environment diagnostics."""
        return await run_rea_doctor()

    @staticmethod
    async def rea_inspect(target: str, user_id: str, requires_approval: bool = True) -> Dict[str, Any]:
        """Inspects an uploaded target with REA (user-scoped; execution still needs server-side approval)."""
        return await inspect_target_with_rea(target, user_id)

    @staticmethod
    def creative_generate_svg(prompt: str) -> Dict[str, Any]:
        """Generates clean SVG vector graphic."""
        svg = CreativeToolsManager.generate_svg_asset(prompt)
        return {"svg": svg}

    @staticmethod
    def calculate(expression: str) -> str:
        """Safely evaluates basic arithmetic expressions."""
        allowed_chars = set("0123456789+-*/(). %^")
        if not all(c in allowed_chars for c in expression.strip()):
            return "Expression contains unsupported symbols."
        try:
            # Safe evaluation of mathematical characters
            clean_expr = expression.replace("^", "**")
            result = eval(clean_expr, {"__builtins__": None}, {})
            return str(result)
        except Exception as e:
            return f"Calculation error: {e}"
