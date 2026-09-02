@echo off
title Siri Samruddhi CRM Backend
echo ===================================================
echo Starting Siri Samruddhi CRM FastAPI Backend Server
echo Port: 8000
echo ===================================================
cd /d "%~dp0"
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)
python -m uvicorn app.main:app --reload --port 8000
pause
