@echo off
echo ============================================
echo   OmniLive AI - Quick Start (Windows)
echo ============================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Install from https://python.org
    pause
    exit /b
)

REM Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Install from https://nodejs.org
    pause
    exit /b
)

echo [1/4] Setting up backend...
cd backend
if not exist ".env" (
    copy .env.example .env
    echo.
    echo IMPORTANT: Open backend\.env and add your GEMINI_API_KEY
    echo Get your key at: https://aistudio.google.com/apikey
    echo.
    pause
)

python -m venv venv 2>nul
call venv\Scripts\activate
pip install -r requirements.txt --quiet

echo [2/4] Starting backend (background)...
start "OmniLive Backend" cmd /k "venv\Scripts\activate && python main.py"

cd ..\frontend
echo [3/4] Installing frontend dependencies...
call npm install --silent

if not exist ".env.local" (
    copy .env.example .env.local
)

echo [4/4] Starting frontend...
echo.
echo ============================================
echo   Opening http://localhost:5173 ...
echo ============================================
start http://localhost:5173
npm run dev
