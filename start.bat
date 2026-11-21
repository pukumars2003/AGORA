@echo off
title Swasthya Sahayak - Voice AI for Bharat
echo ==========================================================
echo  Swasthya Sahayak (Arogya Vaani) - Voice AI for Bharat
echo  Agora Conversational AI + Murf AI Falcon TTS Assistant
echo ==========================================================
echo.
echo Starting application on http://localhost:8000 ...
python -m uvicorn main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
pause
