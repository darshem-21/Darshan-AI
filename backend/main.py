"""
Main FastAPI Server for Darshan AI.
Exposes Chat, RAG, GitHub Analyzer, REA Reverse Engineering, Feature Recreation,
LangChain/LangGraph Agent, and Supabase persistence endpoints.
"""

import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from backend.rea.approval_store import (
    create_pending_approval,
    update_pending_approval,
    consume_approved_action,
)

from backend.config import (
    CORS_ORIGINS,
    ALLOWED_EXTENSIONS,
    MAX_UPLOAD_SIZE_MB,
    UPLOAD_DIR,
    OPENROUTER_DEFAULT_MODEL,
    ENABLE_REA_CLI_EXECUTION,
)
from backend.auth import get_optional_user_id, get_required_user_id
from backend.rag.loader import sanitize_filename, load_document_text, chunk_text
from backend.rag.vectorstore import VectorStoreManager
from backend.rag.retriever import retrieve_with_citations
from backend.github.analyzer import analyze_github_repository
from backend.rea.rea_adapter import run_rea_doctor, inspect_target_with_rea, get_rea_mcp_config
from backend.recreation.generator import generate_feature_recreation
from backend.creative.creative_tools import CreativeToolsManager
from backend.agent.graph import run_darshan_agent

app = FastAPI(
    title="Darshan AI API",
    description="Full-stack AI Agent backend with RAG, GitHub Analyzer, REA Reverse Engineering, and OpenRouter integration.",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# In-memory persistence fallback for conversations and memories when Supabase DB is offline
_DEV_CONVERSATIONS: Dict[str, List[Dict[str, Any]]] = {}
_DEV_MEMORIES: Dict[str, List[Dict[str, Any]]] = {}


# --- Health & Diagnostic Endpoints ---

@app.get("/health")
async def health_check():
    """Service health and connection test."""
    doctor = await run_rea_doctor()
    return {
        "status": "healthy",
        "service": "Darshan AI Backend",
        "version": "2.0.0",
        "rea_status": "verified" if doctor["verified_active"] else "standby",
        "timestamp": os.path.getmtime(__file__) if os.path.exists(__file__) else None
    }


# --- Chat & Agent Endpoints ---

class ChatRequest(BaseModel):
    message: str
    conversation_id: str
    model: Optional[str] = OPENROUTER_DEFAULT_MODEL
    temperature: Optional[float] = 0.7
    enable_memory: Optional[bool] = True
    enable_tools: Optional[bool] = True
    history: Optional[List[Dict[str, str]]] = []
    approved_action_id: Optional[str] = None


@app.post("/api/chat")
async def chat_endpoint(
    req: ChatRequest,
    user_id: Optional[str] = Depends(get_optional_user_id)
):
    """
    Core Chat Endpoint.
    - If user_id is None: Guest mode (temporary in-memory interaction, no database persistence).
    - If user_id is present: Authenticated mode (persists conversation and memory, strictly capped at 10 items).
    """
    result = await run_darshan_agent(
        user_id=user_id,
        conversation_id=req.conversation_id,
        message=req.message,
        history=req.history or [],
        model=req.model,
        temperature=req.temperature or 0.7,
        enable_memory=bool(req.enable_memory and user_id),
        enable_tools=bool(req.enable_tools),
        approved_action_id=req.approved_action_id
    )

    # If authenticated, update in-memory / database memory record
    if user_id and req.enable_memory and len(req.message.split()) > 3:
        if user_id not in _DEV_MEMORIES:
            _DEV_MEMORIES[user_id] = []
        _DEV_MEMORIES[user_id].insert(0, {
            "id": f"mem-{os.urandom(4).hex()}",
            "title": f"Context: {req.message[:30]}...",
            "category": "conversations",
            "content": f"User queried: {req.message[:120]}",
            "timestamp": "Just now",
            "source": req.conversation_id
        })
        _DEV_MEMORIES[user_id] = _DEV_MEMORIES[user_id][:10]

    return {
        "reply": result["reply"],
        "activity_steps": result["activity_steps"],
        "tool_calls": result.get("tool_calls"),
        "citations": result.get("citations"),
        "pending_action": result.get("pending_action"),
    }


# --- RAG Endpoints ---

@app.post("/api/rag/upload")
async def upload_document_endpoint(
    file: UploadFile = File(...),
    user_id: str = Depends(get_required_user_id)
):
    """
    Uploads PDF or TXT files, validates file extension and size, chunks text,
    and indexes embeddings for source-aware retrieval.
    """
    effective_uid = user_id
    clean_name = sanitize_filename(file.filename or "upload.txt")
    suffix = Path(clean_name).suffix.lower()

    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{suffix}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read content with size check
    content_bytes = await file.read()
    size_mb = len(content_bytes) / (1024 * 1024)
    if size_mb > MAX_UPLOAD_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum upload limit of {MAX_UPLOAD_SIZE_MB}MB."
        )

    # The source file is temporary; persistent chunks/embeddings live in Supabase
    # when configured. A UUID prevents concurrent uploads with the same name colliding.
    import uuid
    target_path = UPLOAD_DIR / f"{effective_uid}_{uuid.uuid4().hex}_{clean_name}"
    
    try:
        print(f"[RAG] Starting upload: {clean_name}")

        target_path.write_bytes(content_bytes)
        print(f"[RAG] Saved temporary file: {target_path}")

        extracted_text = load_document_text(target_path)
        extracted_text = extracted_text.replace("\x00", "")
        print(f"[RAG] Extracted {len(extracted_text)} characters")

        if not extracted_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not extract readable text from the uploaded document."
            )

        chunks = chunk_text(
            extracted_text,
            source_name=clean_name,
            user_id=effective_uid
        )
        print(f"[RAG] Created {len(chunks)} chunks")

        added = VectorStoreManager.add_chunks(effective_uid, chunks)
        print(f"[RAG] Indexed {added} chunks")

        return {
            "success": True,
            "filename": clean_name,
            "chunks_indexed": added,
            "total_characters": len(extracted_text),
            "user_id": effective_uid,
            "storage": "supabase" if os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_SERVICE_ROLE_KEY") else "memory_only",
        }

    except HTTPException:
        raise

    except Exception:
        import logging
        logging.exception("[RAG] Document upload failed")
        raise

    finally:
        target_path.unlink(missing_ok=True)



@app.get("/api/rag/documents")
async def get_documents_endpoint(user_id: str = Depends(get_required_user_id)):
    """Lists indexed documents and chunks for the authenticated user."""
    effective_uid = user_id
    docs = VectorStoreManager.get_user_documents(effective_uid)
    return {"documents": docs, "user_id": effective_uid}


@app.post("/api/rag/query")
async def query_rag_endpoint(
    query: str = Form(...),
    top_k: int = Form(4),
    user_id: str = Depends(get_required_user_id)
):
    """Searches indexed documents and returns source citations."""
    effective_uid = user_id
    context, citations = retrieve_with_citations(user_id=effective_uid, query=query, top_k=top_k)
    return {"context": context, "citations": citations}


@app.delete("/api/rag/clear")
async def clear_rag_endpoint(user_id: str = Depends(get_required_user_id)):
    """Deletes all indexed documents for the authenticated user."""
    effective_uid = user_id
    VectorStoreManager.clear_user_index(effective_uid)
    return {"success": True, "message": "Vector index cleared."}


# --- GitHub Repository Analyzer Endpoints ---

class GitHubAnalyzeRequest(BaseModel):
    repo_url: str


@app.post("/api/github/analyze")
async def github_analyze_endpoint(req: GitHubAnalyzeRequest):
    """Inspects a GitHub repository without cloning and returns an architecture report."""
    result = await analyze_github_repository(req.repo_url)
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to analyze repository.")
        )
    return result



# --- REA (Reverse Engineer Anything) Endpoints ---

@app.get("/api/rea/doctor")
async def rea_doctor_endpoint(
    user_id: str = Depends(get_required_user_id),
):
    """Checks REA prerequisites for an authenticated user."""
    return await run_rea_doctor(probe=False)



class REAApprovalRequest(BaseModel):
    action_id: str


class REACreateApprovalRequest(BaseModel):
    action_type: str = Field(min_length=1, max_length=100)
    parameters: Dict[str, Any] = Field(default_factory=dict)


class REAInspectRequest(BaseModel):
    target: str
    analysis_type: Optional[str] = "auto"
    action_id: Optional[str] = None


@app.post("/api/rea/inspect")
async def rea_inspect_endpoint(
    req: REAInspectRequest,
    user_id: str = Depends(get_required_user_id),
):
    """
    Run REA on an uploaded target. When ENABLE_REA_CLI_EXECUTION=true, a single-use,
    user-approved action_id (created via /api/rea/approvals) bound to this exact
    target is required.
    """
    if ENABLE_REA_CLI_EXECUTION:
        if not req.action_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="An approved action_id is required. Create one via /api/rea/approvals and approve it first.",
            )
        try:
            record = await consume_approved_action(user_id, req.action_id)
        except Exception:
            raise HTTPException(status_code=503, detail="Approval check failed.")
        if not record or record.get("action_type") != "inspect":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Approval not found, expired, not approved, or already used.",
            )
        try:
            approved_target = Path(record["parameters"]["target"]).resolve()
            requested_target = Path(req.target.strip()).expanduser().resolve()
        except (KeyError, OSError, RuntimeError, ValueError):
            raise HTTPException(status_code=400, detail="Invalid approved target.")
        if approved_target != requested_target:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="The approval was issued for a different target.",
            )

    return await inspect_target_with_rea(
        req.target,
        user_id,
        req.analysis_type or "auto",
    )


@app.post("/api/rea/upload")
async def rea_upload_endpoint(
    file: UploadFile = File(...),
    user_id: str = Depends(get_required_user_id),
):
    """Store an REA target in the authenticated user's directory."""
    import uuid

    user_upload_dir = (UPLOAD_DIR / user_id).resolve()
    user_upload_dir.mkdir(parents=True, exist_ok=True)

    original_name = Path(file.filename or "upload.bin").name
    safe_name = "".join(
        char for char in original_name
        if char.isalnum() or char in "._-"
    ).strip(".")
    safe_name = safe_name[:150] or "upload.bin"
    # APKs may be uploaded for authorized inspection, but uploading never executes them.
    allowed_extensions = {
        ".js", ".mjs", ".cjs", ".jsx",
        ".ts", ".tsx", ".html", ".json",
        ".py", ".txt", ".md", ".apk",
    }

    if Path(safe_name).suffix.lower() not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported file type. Upload a supported source/text file or an APK (maximum 200 MB).",
        )

    max_upload_size = 200 * 1024 * 1024  # 200 MB
    total_size = 0
    destination = user_upload_dir / f"{uuid.uuid4().hex}_{safe_name}"

    try:
        with destination.open("wb") as output:
            while True:
                chunk = await file.read(1024 * 1024)

                if not chunk:
                    break

                total_size += len(chunk)

                if total_size > max_upload_size:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="Upload exceeds the 200 MB limit.",
                    )

                output.write(chunk)

        return {
            "status": "uploaded",
            "filename": safe_name,
            "target": str(destination),
            "message": (
                "APK uploaded to your user-specific REA directory. Uploading does not execute or decompile the APK."
                if Path(safe_name).suffix.lower() == ".apk"
                else "Upload saved to your user-specific REA directory."
            ),
        }

    except HTTPException:
        destination.unlink(missing_ok=True)
        raise

    except Exception:
        destination.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to save the REA upload.",
        )

    finally:
        await file.close()





@app.get("/api/rea/mcp-config")
async def rea_mcp_config_endpoint(
    user_id: str = Depends(get_required_user_id),
):
    """Returns REA MCP configuration to authenticated users."""
    return get_rea_mcp_config()


# --- Feature Recreation Endpoint ---

class FeatureRecreateRequest(BaseModel):
    feature_name: str
    feature_description: str
    target_stack: Optional[str] = "React + TypeScript + Tailwind"
    evidence_context: Optional[str] = None
    model: Optional[str] = None


@app.post("/api/recreate/feature")
async def recreate_feature_endpoint(req: FeatureRecreateRequest):
    """Generates clean-room implementation from reverse-engineered specifications."""
    return await generate_feature_recreation(
        feature_name=req.feature_name,
        feature_description=req.feature_description,
        target_stack=req.target_stack or "React + TypeScript + Tailwind",
        evidence_context=req.evidence_context,
        model=req.model
    )


# --- Creative Tools Endpoints ---

@app.get("/api/creative/tools")
async def get_creative_tools_endpoint():
    """Lists supported creative automation tools."""
    return CreativeToolsManager.get_supported_tools()


class SVGGenerateRequest(BaseModel):
    prompt: str
    width: Optional[int] = 400
    height: Optional[int] = 400


@app.post("/api/creative/generate-svg")
async def generate_svg_endpoint(req: SVGGenerateRequest):
    """Generates a procedural SVG vector asset."""
    svg = CreativeToolsManager.generate_svg_asset(req.prompt, req.width or 400, req.height or 400)
    return {"svg": svg}


# --- Authenticated Conversations & Memory Persistence (Strict 10-Item Limits) ---

@app.get("/api/conversations")
async def get_conversations_endpoint(user_id: str = Depends(get_required_user_id)):
    """Returns strictly the latest 10 conversations for the authenticated user."""
    user_convs = _DEV_CONVERSATIONS.get(user_id, [])
    return user_convs[:10]


@app.post("/api/conversations")
async def create_conversation_endpoint(payload: dict, user_id: str = Depends(get_required_user_id)):
    """Creates a conversation and automatically deletes the oldest if exceeding 10 items."""
    if user_id not in _DEV_CONVERSATIONS:
        _DEV_CONVERSATIONS[user_id] = []

    new_conv = {
        "id": payload.get("id") or f"conv-{os.urandom(4).hex()}",
        "title": payload.get("title", "New Conversation"),
        "createdAt": payload.get("createdAt") or "Just now",
        "updatedAt": "Just now",
        "messageCount": 0
    }
    _DEV_CONVERSATIONS[user_id].insert(0, new_conv)
    # Strictly maintain latest 10
    _DEV_CONVERSATIONS[user_id] = _DEV_CONVERSATIONS[user_id][:10]
    return new_conv


@app.post("/api/rea/approvals")
async def create_rea_approval_endpoint(
    req: REACreateApprovalRequest,
    user_id: str = Depends(get_required_user_id),
):
    if req.action_type != "inspect":
        raise HTTPException(status_code=400, detail="Unsupported REA action type.")

    target = req.parameters.get("target")
    if not isinstance(target, str) or not target.strip():
        raise HTTPException(status_code=400, detail="A valid target is required.")

    # Bind approvals to an existing file owned by this authenticated user.
    # Do not accept arbitrary local paths or paths belonging to another user.
    try:
        target_path = Path(target.strip()).expanduser().resolve(strict=True)
        user_root = (UPLOAD_DIR / user_id).resolve()
        if (
            target_path == user_root
            or not target_path.is_relative_to(user_root)
            or not (target_path.is_file() or target_path.is_dir())
        ):
            raise HTTPException(
                status_code=403,
                detail="REA approvals are limited to files uploaded by your account.",
            )
    except HTTPException:
        raise
    except (OSError, RuntimeError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="The uploaded REA target could not be found. Upload it again before requesting approval.",
        )

    try:
        record = await create_pending_approval(
            user_id=user_id,
            action_type="inspect",
            parameters={"target": str(target_path)},
        )
    except Exception:
        raise HTTPException(status_code=503, detail="Could not create approval.")

    return {
        "action_id": record["action_id"],
        "status": record["status"],
        "expires_at": record["expires_at"],
        "requires_approval": True,
    }


@app.post("/api/rea/approvals/approve")
async def approve_rea_action_endpoint(
    req: REAApprovalRequest,
    user_id: str = Depends(get_required_user_id),
):
    try:
        record = await update_pending_approval(
            user_id, req.action_id, "approved"
        )
    except Exception:
        raise HTTPException(status_code=503, detail="Approval update failed.")

    if not record:
        raise HTTPException(
            status_code=409,
            detail="Approval not found, expired, or no longer pending.",
        )

    return {"action_id": record["action_id"], "status": record["status"]}


@app.post("/api/rea/approvals/reject")
async def reject_rea_action_endpoint(
    req: REAApprovalRequest,
    user_id: str = Depends(get_required_user_id),
):
    try:
        record = await update_pending_approval(
            user_id, req.action_id, "rejected"
        )
    except Exception:
        raise HTTPException(status_code=503, detail="Approval update failed.")

    if not record:
        raise HTTPException(
            status_code=409,
            detail="Approval not found, expired, or no longer pending.",
        )

    return {"action_id": record["action_id"], "status": record["status"]}



@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation_endpoint(conversation_id: str, user_id: str = Depends(get_required_user_id)):
    """Deletes a conversation for the authenticated user."""
    if user_id in _DEV_CONVERSATIONS:
        _DEV_CONVERSATIONS[user_id] = [c for c in _DEV_CONVERSATIONS[user_id] if c["id"] != conversation_id]
    return {"success": True}


@app.get("/api/memory")
async def get_memory_endpoint(user_id: str = Depends(get_required_user_id)):
    """Returns strictly the latest 10 memories for the authenticated user."""
    return _DEV_MEMORIES.get(user_id, [])[:10]


@app.post("/api/memory")
async def add_memory_endpoint(payload: dict, user_id: str = Depends(get_required_user_id)):
    """Adds a memory item and automatically prunes to the 10 latest items."""
    if user_id not in _DEV_MEMORIES:
        _DEV_MEMORIES[user_id] = []

    new_mem = {
        "id": f"mem-{os.urandom(4).hex()}",
        "title": payload.get("title", "Memory Note"),
        "category": payload.get("category", "saved_information"),
        "content": payload.get("content", ""),
        "timestamp": "Just now",
        "source": payload.get("source", "User")
    }
    _DEV_MEMORIES[user_id].insert(0, new_mem)
    _DEV_MEMORIES[user_id] = _DEV_MEMORIES[user_id][:10]
    return new_mem


@app.delete("/api/memory")
async def clear_memory_endpoint(user_id: str = Depends(get_required_user_id)):
    """Deletes all memories for the authenticated user."""
    _DEV_MEMORIES[user_id] = []
    return {"success": True}
