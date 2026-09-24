from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Darshan AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "status": "online",
        "message": "Darshan AI backend is running"
    }


@app.post("/api/chat")
async def chat():
    return {
        "reply": "Backend is connected successfully!",
        "conversation_id": "test",
        "tools_used": []
    }
