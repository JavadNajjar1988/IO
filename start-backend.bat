@echo off
echo Starting Backend Server...
echo IP Address: 0.0.0.0:8000 (All Network Interfaces)
echo.
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause 