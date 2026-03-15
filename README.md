# ◈ OmniLive AI — Real-Time Multimodal Action Agent

> Built for the **Gemini Live Agent Challenge** — National-Level Hackathon  
> Powered by **Gemini Live API** + **Google Cloud** + **Graph RAG Memory**

---

## 🌟 Features

| Feature | Description |
|---|---|
| 🔴 **Live Bidirectional Streaming** | ADK-powered bidi-streaming, low-latency simultaneous I/O |
| 🎙️ **Voice I/O** | Full microphone input + TTS output via Gemini |
| 📷 **Camera Visual Awareness** | Live camera frames sent to Gemini for visual context |
| 🧠 **Graph RAG Memory** | Structured memory bank retrieves past context for personalization |
| 📊 **Real-Time Monitoring** | Live dashboard: confidence, sentiment, speech speed, improvement graph |
| 🤖 **AI Avatar** | Animated avatar with speaking/listening states |
| ✋ **Interrupt Handling** | Barge-in support for natural human-like turn-taking |
| 🌍 **Multilingual** | Gemini detects and responds in user's language |

---

## 🏗️ Architecture

```
User (Voice + Camera)
       ↓
Frontend (React + WebRTC)
       ↓  WebSocket
FastAPI Backend
       ↓
Gemini Live API (bidi-streaming)
       ↓
Graph RAG Memory ←→ Firestore
       ↓
Response Stream → Avatar + Voice Output
       ↓
Monitoring Dashboard Update
```

---

## 🚀 Quick Setup (Local Development)

### Prerequisites

Make sure you have installed:
- **Python 3.11+** → https://python.org
- **Node.js 20+** → https://nodejs.org
- **Git** → https://git-scm.com

---

### Step 1 — Get a Gemini API Key

1. Go to: https://aistudio.google.com/apikey
2. Click **"Create API Key"**
3. Copy your key — you'll need it in Step 3

---

### Step 2 — Clone / Download the project

```bash
# If using git:
git clone https://github.com/YOUR_USERNAME/omnilive-ai.git
cd omnilive-ai

# Or just unzip the downloaded zip and cd into it
cd omnilive-ai
```

---

### Step 3 — Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it:
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create your .env file
cp .env.example .env
```

Now open `backend/.env` in any text editor and paste your Gemini API key:
```
GEMINI_API_KEY=your_actual_key_here
```

Start the backend:
```bash
python main.py
```

You should see: `Uvicorn running on http://0.0.0.0:8000`

---

### Step 4 — Setup Frontend

Open a **new terminal window**:

```bash
cd frontend

# Install dependencies
npm install

# Create env file
cp .env.example .env.local
```

Open `frontend/.env.local` and set:
```
VITE_BACKEND_URL=http://localhost:8000
```

Start the frontend:
```bash
npm run dev
```

Open your browser at: **http://localhost:5173**

---

### Step 5 — Use It!

1. Click **"Connect"** in the top-right
2. On the Live Session tab, click **"🎙️ Start"**
3. Allow microphone and camera access
4. Speak to OmniLive AI!
5. Check the **📊 Monitoring** tab for live metrics
6. Check the **🧠 Memory** tab to see what's been stored

---

## ☁️ Production Deployment (Google Cloud)

### Backend → Cloud Run

```bash
# Set your project
export PROJECT_ID=your-project-id
export GEMINI_API_KEY=your-key

# Make deploy script executable
chmod +x scripts/deploy.sh

# Deploy
./scripts/deploy.sh
```

### Frontend → Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools
firebase login

# Build frontend
cd frontend
npm run build

# Initialize Firebase (first time)
firebase init hosting

# Deploy
firebase deploy --only hosting
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + Vite
- **WebRTC** — Camera & Microphone capture
- **Web Audio API** — PCM audio streaming + playback
- **Canvas API** — Animated AI Avatar
- **WebSocket** — Real-time bidirectional communication

### Backend
- **Python + FastAPI** — High-performance async API
- **Gemini Live API** (`gemini-2.0-flash-live-001`) — Real-time streaming inference
- **ADK Bidi-Streaming** — Low-latency simultaneous I/O
- **Graph RAG Memory** — Structured context retrieval
- **Firestore** — Session persistence (with local fallback)
- **Google Cloud Run** — Serverless container deployment
- **Firebase Hosting** — Static frontend hosting

---

## 📁 Project Structure

```
omnilive-ai/
├── backend/
│   ├── main.py              # FastAPI app + WebSocket handler
│   ├── monitoring.py        # Real-time metrics agent
│   ├── memory/
│   │   └── graph_rag.py     # Graph RAG memory system
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main app + WebSocket logic
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── LiveSession.jsx      # Voice/text interaction
│   │   │   ├── AvatarDisplay.jsx    # Animated canvas avatar
│   │   │   ├── MonitoringDashboard.jsx
│   │   │   └── MemoryPanel.jsx
│   │   └── styles/
│   │       └── global.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── scripts/
│   └── deploy.sh            # Cloud Run deploy script
├── docker-compose.yml       # Full stack local dev
├── firebase.json
└── README.md
```

---

## 🔧 Troubleshooting

**"WebSocket connection failed"**  
→ Make sure backend is running on port 8000  
→ Check `VITE_BACKEND_URL` in `frontend/.env.local`

**"Microphone/Camera not working"**  
→ Browser needs HTTPS or localhost for camera access  
→ Allow permissions when browser asks

**"Gemini API error"**  
→ Check your `GEMINI_API_KEY` in `backend/.env`  
→ Make sure `gemini-2.0-flash-live-001` model is available in your region

**"Firebase not available"**  
→ App works without Firebase — memory falls back to in-memory store  
→ For persistent memory, add `serviceAccountKey.json` from Google Cloud Console

---

## 🏆 Hackathon Submission

- **Competition**: Gemini Live Agent Challenge  
- **URL**: https://geminiliveagentchallenge.devpost.com  
- **Deadline**: March 16, 2026  
- **Category**: Real-Time Multimodal Agent

### Competitive Advantages
✅ Full ADK Bidi-Streaming  
✅ Graph RAG Memory (unique differentiator)  
✅ Multimodal: Voice + Camera + Text + Avatar  
✅ Real-Time Coaching Dashboard  
✅ Interrupt/Barge-in handling  
✅ Multilingual support  
✅ Cloud-native (Cloud Run + Firebase)  

---

## 📄 License

MIT License — Built for the Gemini Live Agent Challenge 2026
