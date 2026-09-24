from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
import os


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()

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

FREE_MODEL = "openrouter/free"


# =========================================================
# REQUEST MODEL
# =========================================================

class ChatRequest(BaseModel):
    message: str
    conversation_id: str = "default"


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

    return {
        "status": "healthy",
        "model": FREE_MODEL
    }


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

        response = client.chat.completions.create(

            model=FREE_MODEL,

            messages=[
                {
                    "role": "system",
                    "content": """
You are Darshan AI.

You are a helpful, friendly and intelligent personal AI assistant.

Give clear and useful answers.
When explaining programming concepts, provide examples.
When the user asks for code, provide clean and working code.
Do not claim to have performed actions that you have not actually performed.
"""
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


        # ---------------------------------------------
        # Return response to frontend
        # ---------------------------------------------

        return {
            "reply": answer,
            "conversation_id": request.conversation_id,
            "tools_used": [],
            "model": FREE_MODEL
        }


    except HTTPException:

        raise


    except Exception as e:

        print("OpenRouter error:", str(e))

        raise HTTPException(
            status_code=500,
            detail="Failed to get response from the AI model."
        )
