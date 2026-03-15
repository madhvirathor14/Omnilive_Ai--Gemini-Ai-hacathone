#!/bin/bash
echo "============================================"
echo "  OmniLive AI - Quick Start (Mac/Linux)"
echo "============================================"
echo ""

# Check Python
if ! command -v python3 &>/dev/null; then
    echo "ERROR: Python3 not found. Install from https://python.org"
    exit 1
fi

# Check Node
if ! command -v node &>/dev/null; then
    echo "ERROR: Node.js not found. Install from https://nodejs.org"
    exit 1
fi

# Backend setup
echo "[1/4] Setting up backend..."
cd backend

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Open backend/.env and add your GEMINI_API_KEY"
    echo "   Get your key at: https://aistudio.google.com/apikey"
    echo ""
    read -p "Press Enter after you've added your key..."
fi

python3 -m venv venv 2>/dev/null
source venv/bin/activate
pip install -r requirements.txt -q

echo "[2/4] Starting backend..."
python3 main.py &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
sleep 2

# Frontend setup
cd ../frontend
echo "[3/4] Installing frontend dependencies..."
npm install --silent

if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
fi

echo "[4/4] Starting frontend..."
echo ""
echo "============================================"
echo "  ✅ OmniLive AI running at:"
echo "     http://localhost:5173"
echo "============================================"
echo ""
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT
