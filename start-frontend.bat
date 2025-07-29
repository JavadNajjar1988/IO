@echo off
echo Starting Frontend Server...
echo IP Address: 0.0.0.0:5173 (All Network Interfaces)
echo.
cd frontend
npm install
npm run dev -- --host 0.0.0.0
pause 