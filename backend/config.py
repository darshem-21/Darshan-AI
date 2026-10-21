"""
Configuration module for Darshan AI Backend.
Loads environment variables and sets sensible operational defaults.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Base paths
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "storage" / "uploads"
VECTOR_DIR = BASE_DIR / "storage" / "vectorstores"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
VECTOR_DIR.mkdir(parents=True, exist_ok=True)

# Load backend/.env if present
env_path = BASE_DIR / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

# OpenRouter
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_DEFAULT_MODEL = os.getenv("OPENROUTER_DEFAULT_MODEL", "openrouter/free")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")

# GitHub
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")

# REA (Reverse Engineer Anything)
# Pinned local install lives in backend/rea/node_modules (see scripts/install-rea.sh).
_LOCAL_REA = BASE_DIR / "rea" / "node_modules" / ".bin" / ("rea.cmd" if os.name == "nt" else "rea")
REA_CLI_PATH = os.getenv("REA_CLI_PATH") or (str(_LOCAL_REA) if _LOCAL_REA.exists() else "rea")
REA_MCP_COMMAND = os.getenv("REA_MCP_COMMAND", f"{REA_CLI_PATH} mcp")
ENABLE_REA_CLI_EXECUTION = os.getenv("ENABLE_REA_CLI_EXECUTION", "false").lower() == "true"

# Security & Constraints
REQUIRE_HUMAN_APPROVAL_FOR_TOOLS = os.getenv("REQUIRE_HUMAN_APPROVAL_FOR_TOOLS", "true").lower() == "true"
ALLOWED_EXTENSIONS = os.getenv("ALLOWED_EXTENSIONS", ".pdf,.txt,.md,.py,.js,.ts,.json").split(",")
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "25"))
CORS_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")]
