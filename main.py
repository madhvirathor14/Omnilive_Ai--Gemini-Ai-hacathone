"""
OmniLive AI - FastAPI Backend (Fixed - Free Tier Compatible)
"""
import os
import json
import time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import google.generativeai as genai
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="OmniLive AI Backend", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.0-flash")

SYSTEM_PROMPT = """You are OmniLive AI — a real-time multimodal coaching agent. Be encouraging, specific, concise (2-4 sentences). Support multiple languages."""

sessions = {}

@app.get("/")
async def root():
    return {"status": "OmniLive AI Backend Running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.websocket("/ws/live/{session_id}")
async def websocket_live_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    if session_id not in sessions:
        sessions[session_id] = {"history": [], "start_time": time.time()}
    chat = model.start_chat(history=[])
    try:
        await websocket.send_json({"type": "text", "content": "Hello! I'm OmniLive AI, your real-time coaching agent. How can I help you today?", "metrics": default_metrics()})
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            if msg_type == "text":
                user_text = data.get("content", "")
                if not user_text:
                    continue
                try:
                    response = chat.send_message(f"{SYSTEM_PROMPT}\n\nUser: {user_text}")
                    reply = response.text
                    sessions[session_id]["history"].append({"role": "user", "content": user_text})
                    sessions[session_id]["history"].append({"role": "ai", "content": reply})
                    await websocket.send_json({"type": "text", "content": reply, "metrics": analyze(reply)})
                except Exception as e:
                    await websocket.send_json({"type": "text", "content": f"Error: {str(e)[:100]}", "metrics": default_metrics()})
            elif msg_type == "interrupt":
                await websocket.send_json({"type": "interrupted"})
            elif msg_type == "end_session":
                break
    except WebSocketDisconnect:
        logger.info(f"Disconnected: {session_id}")

@app.get("/api/memory/{session_id}")
async def get_memory(session_id: str):
    h = sessions.get(session_id, {}).get("history", [])
    ctx = "\n".join([f"{x['role']}: {x['content']}" for x in h[-5:]])
    return {"session_id": session_id, "context": ctx or "No history yet"}

@app.delete("/api/memory/{session_id}")
async def clear_memory(session_id: str):
    sessions.pop(session_id, None)
    return {"status": "cleared"}

def analyze(text):
    words = text.lower().split()
    pos = sum(1 for w in words if w in {"great","excellent","good","perfect","well","clear","confident","strong"})
    neg = sum(1 for w in words if w in {"struggle","weak","poor","bad","nervous","confused"})
    sentiment = "positive" if pos > neg else "negative" if neg > pos else "neutral"
    return {"confidence": round(min(0.95, 0.7 + pos*0.05 - neg*0.05), 2), "sentiment": sentiment, "sentiment_score": round(0.5 + (pos-neg)*0.1, 2), "speech_speed_wpm": min(180, max(80, len(words)*12)), "word_count": len(words), "timestamp": time.time()}

def default_metrics():
    return {"confidence": 0.72, "sentiment": "neutral", "sentiment_score": 0.5, "speech_speed_wpm": 130, "word_count": 0, "timestamp": time.time()}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), reload=False)