"""
GitHub Repository Analyzer for Darshan AI.
Inspects README, directory tree, dependency manifests, and key source files
to explain system architecture and component patterns.
"""

import re
from typing import Dict, Any, List, Optional
import httpx
from backend.config import GITHUB_TOKEN


def parse_github_url(url: str) -> Optional[Dict[str, str]]:
    """Extracts owner and repo name from GitHub URLs."""
    pattern = r"github\.com[/:](?P<owner>[a-zA-Z0-9_.-]+)/(?P<repo>[a-zA-Z0-9_.-]+?)(?:\.git|/.*)?$"
    match = re.search(pattern, url.strip())
    if match:
        return {"owner": match.group("owner"), "repo": match.group("repo")}
    return None


async def analyze_github_repository(repo_url: str) -> Dict[str, Any]:
    """
    Analyzes a GitHub repository via GitHub REST API without heavy cloning.
    Gathers README, file tree, dependencies, and synthesizes architectural breakdown.
    """
    parsed = parse_github_url(repo_url)
    if not parsed:
        return {
            "success": False,
            "error": "Invalid GitHub repository URL. Format must be https://github.com/owner/repository",
        }

    owner = parsed["owner"]
    repo = parsed["repo"]

    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Darshan-AI-Analyzer",
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"

    async with httpx.AsyncClient(timeout=15.0) as client:
        # 1. Fetch Repository Metadata
        meta_res = await client.get(f"https://api.github.com/repos/{owner}/{repo}", headers=headers)
        if meta_res.status_code == 404:
            return {"success": False, "error": f"Repository '{owner}/{repo}' not found or is private."}
        elif meta_res.status_code == 403:
            return {
                "success": False,
                "error": "GitHub API rate limit reached. Please configure GITHUB_TOKEN in backend/.env.",
            }
        elif meta_res.status_code != 200:
            return {"success": False, "error": f"GitHub API error: {meta_res.text}"}

        meta = meta_res.json()
        default_branch = meta.get("default_branch", "main")

        # 2. Fetch README
        readme_content = ""
        try:
            readme_res = await client.get(f"https://api.github.com/repos/{owner}/{repo}/readme", headers=headers)
            if readme_res.status_code == 200:
                readme_data = readme_res.json()
                download_url = readme_data.get("download_url")
                if download_url:
                    raw_readme = await client.get(download_url)
                    readme_content = raw_readme.text[:8000]
        except Exception:
            readme_content = "README could not be fetched."

        # 3. Fetch Git Tree (Recursive)
        tree_res = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1",
            headers=headers
        )
        files: List[str] = []
        if tree_res.status_code == 200:
            tree_data = tree_res.json()
            files = [item["path"] for item in tree_data.get("tree", []) if item.get("type") == "blob"]

        # 4. Detect Dependencies & Tech Stack
        tech_stack = []
        dependencies_found: Dict[str, str] = {}

        manifest_candidates = [
            "package.json", "requirements.txt", "pyproject.toml",
            "Cargo.toml", "go.mod", "pom.xml", "composer.json"
        ]

        for manifest in manifest_candidates:
            matching = [f for f in files if f.endswith(manifest) or f == manifest]
            for m_path in matching[:2]:
                try:
                    raw_res = await client.get(
                        f"https://raw.githubusercontent.com/{owner}/{repo}/{default_branch}/{m_path}"
                    )
                    if raw_res.status_code == 200:
                        dependencies_found[m_path] = raw_res.text[:3000]
                        if "package.json" in m_path:
                            tech_stack.append("Node.js / JavaScript")
                        elif "requirements.txt" in m_path or "pyproject.toml" in m_path:
                            tech_stack.append("Python")
                        elif "Cargo.toml" in m_path:
                            tech_stack.append("Rust")
                        elif "go.mod" in m_path:
                            tech_stack.append("Go")
                except Exception:
                    pass

        # Detect Frameworks from file list
        if any(f.endswith((".tsx", ".jsx")) for f in files):
            tech_stack.append("React")
        if any("vite.config" in f for f in files):
            tech_stack.append("Vite")
        if any("next.config" in f for f in files):
            tech_stack.append("Next.js")
        if any("fastapi" in d.lower() for d in dependencies_found.values()):
            tech_stack.append("FastAPI")
        if any("docker-compose" in f.lower() or "dockerfile" in f.lower() for f in files):
            tech_stack.append("Docker")

        # 5. Build Architectural Directory Structure Summary
        top_level_structure = {}
        for f in files:
            parts = f.split("/")
            root = parts[0]
            top_level_structure[root] = top_level_structure.get(root, 0) + 1

        # Format Architectural Report
        architecture_summary = {
            "owner": owner,
            "repo": repo,
            "description": meta.get("description", "No description provided"),
            "stars": meta.get("stargazers_count", 0),
            "forks": meta.get("forks_count", 0),
            "primary_language": meta.get("language", "Unknown"),
            "default_branch": default_branch,
            "total_files": len(files),
            "tech_stack": list(set(tech_stack)),
            "directory_breakdown": top_level_structure,
            "manifest_files": list(dependencies_found.keys()),
            "readme_preview": readme_content[:1500] if readme_content else "No README file found.",
        }

        return {
            "success": True,
            "data": architecture_summary,
            "sample_files": files[:30],
        }
