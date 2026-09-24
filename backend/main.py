from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
from supabase import create_client
import os


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()

print("SUPABASE_URL loaded:", bool(os.getenv("SUPABASE_URL")))
print("SUPABASE_SERVICE_ROLE_KEY loaded:", bool(os.getenv("SUPABASE_SERVICE_ROLE_KEY")))
print("SUPABASE_KEY loaded:", bool(os.getenv("SUPABASE_KEY")))

# Supabase connection
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError(
        "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set in .env"
    )

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
)

def save_memory(content: str, user_id: str = "default"):
    try:
        # Save new memory
        result = supabase.table("memories").insert({
            "content": content,
            "category": "conversation",
            "importance": 1,
            "user_id": user_id
        }).execute()

        # Get all memories for this user, newest first
        memories = (
            supabase
            .table("memories")
            .select("id, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        # Keep only the latest 10
        if len(memories.data) > 10:
            old_memories = memories.data[10:]

            for memory in old_memories:
                supabase \
                    .table("memories") \
                    .delete() \
                    .eq("id", memory["id"]) \
                    .execute()

        return result.data

    except Exception as e:
        print("Save memory error:", str(e))
        return []


def get_memories(user_id: str = "default", limit: int = 10):
    try:
        result = (
            supabase
            .table("memories")
            .select(
                "id, content, category, importance, created_at"
            )
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )

        return result.data

    except Exception as e:
        print("Get memory error:", str(e))
        return []

# OpenRouter

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")


# =========================================================
# CHECK API KEY
# =========================================================

if not OPENROUTER_API_KEY:
    raise RuntimeError(
        "OPENROUTER_API_KEY is not set. "
        "Create a .env file and add your OpenRouter API key."
    )


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="Darshan AI",
    description="AI Agent Backend using OpenRouter Free Models",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# OPENROUTER CLIENT
# =========================================================

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY
)


# =========================================================
# FREE MODEL
# =========================================================

FREE_MODELS = {
    "auto": "openrouter/free",
    "laguna": "poolside/laguna-s-2.1:free",
    "ling-fin": "inclusionai/ling-3.0-flash-fin:free",
    "dots": "dots-studio/dots-3-note-preview:free",
    "nemotron": "nvidia/nemotron-3.5-lightning:free",
}

FREE_MODEL = FREE_MODELS["auto"]


# =========================================================
# REQUEST MODEL
# =========================================================

class ChatRequest(BaseModel):
    message: str
    conversation_id: str = "default"
    model: str | None = None
    temperature: float | None = None
    enable_memory: bool = True
    enable_tools: bool = True

# =========================================================
# ROOT ENDPOINT
# =========================================================

@app.get("/")
async def home():

    return {
        "status": "online",
        "name": "Darshan AI",
        "message": "Darshan AI backend is running",
        "model": FREE_MODEL
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
async def health():
    try:
        supabase.table("memories").select("id").limit(1).execute()

        return {
            "status": "healthy",
            "backend": "online",
            "database": "connected",
            "model": FREE_MODEL
        }

    except Exception as e:
        print("Supabase health check error:", str(e))

        return {
            "status": "degraded",
            "backend": "online",
            "database": "disconnected",
            "model": FREE_MODEL
        }

#memories
@app.get("/api/memories/{user_id}")
async def memories(user_id: str):
    return {
        "memories": get_memories(user_id=user_id)
    }

@app.get("/api/memory")
async def get_memory_for_frontend():
    return {
        "memories": []
    }

#meories test
@app.post("/api/memories/test")
async def test_memory():
    result = save_memory("Darshan AI Supabase memory test")
    return {
        "saved": result
    }

# =========================================================
# CONVERSATIONS
# =========================================================

@app.get("/api/conversations")
async def get_conversations():
    try:
        result = (
            supabase
            .table("conversations")
            .select("*")
            .order("updated_at", desc=True)
            .execute()
        )

        return result.data

    except Exception as e:
        print("Get conversations error:", str(e))
        raise HTTPException(
            status_code=500,
            detail="Failed to get conversations."
        )


@app.post("/api/conversations")
async def create_conversation(conversation: dict):
    try:
        result = (
            supabase
            .table("conversations")
            .insert({
                "id": conversation["id"],
                "title": conversation["title"],
                "created_at": conversation.get("createdAt"),
                "updated_at": conversation.get("updatedAt"),
                "message_count": conversation.get("messageCount", 0),
                "last_message": conversation.get("lastMessage")
            })
            .execute()
        )

        return result.data[0]

    except Exception as e:
        print("Create conversation error:", str(e))
        raise HTTPException(
            status_code=500,
            detail="Failed to create conversation."
        )

@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    try:
        result = (
            supabase
            .table("conversations")
            .delete()
            .eq("id", conversation_id)
            .execute()
        )

        return {
            "success": True,
            "deleted": result.data
        }

    except Exception as e:
        print("Delete conversation error:", str(e))
        raise HTTPException(
            status_code=500,
            detail="Failed to delete conversation."
        )
# =========================================================
# CHAT ENDPOINT
# =========================================================

@app.post("/api/chat")
async def chat(request: ChatRequest):

    try:

        # ---------------------------------------------
        # Validate message
        # ---------------------------------------------

        if not request.message.strip():

            raise HTTPException(
                status_code=400,
                detail="Message cannot be empty."
            )


        # ---------------------------------------------
        # Send request to OpenRouter
        # ---------------------------------------------

        selected_model = request.model or FREE_MODEL

        if selected_model not in FREE_MODELS.values():
            selected_model = FREE_MODEL

        memories = []

        if request.enable_memory:
           memories = get_memories(
                user_id=request.conversation_id,
                limit=10
            )

        memory_text = "\n".join(
            f"- {memory['content']}"
            for memory in memories
        )

        system_prompt = f"""
        You are Darshan AI.

        You are a helpful, friendly and intelligent personal AI assistant.

        Give clear and useful answers.
        When explaining programming concepts, provide examples.
        When the user asks for code, provide clean and working code.
        Do not claim to have performed actions that you have not actually performed.

        Previous memories:
        {memory_text if memory_text else "No previous memories available."}
        """

        response = client.chat.completions.create(
            model=selected_model,

            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": request.message
                }
            ]
        )


        # ---------------------------------------------
        # Get AI response
        # ---------------------------------------------

        answer = response.choices[0].message.content

        # Save conversation to Supabase memory
        if request.enable_memory:
            save_memory(
                f"User: {request.message}\nAI: {answer}",
                user_id=request.conversation_id
            )


        # ---------------------------------------------
        # Return response to frontend
        # ---------------------------------------------

        return {
            "reply": answer,
            "conversation_id": request.conversation_id,
            "tools_used": [],
            "model": getattr(response, "model", selected_model)
        }


    except HTTPException:

        raise


    except Exception as e:

        print("OpenRouter error:", str(e))

        raise HTTPException(
            status_code=500,
            detail="Failed to get response from the AI model."
        )
