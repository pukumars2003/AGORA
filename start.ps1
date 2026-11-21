Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Swasthya Sahayak (स्वास्थ्य सहायक) - Voice AI for Bharat " -ForegroundColor White
Write-Host " Agora Conversational AI & Murf Falcon TTS Assistant      " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting Unified FastAPI Server on http://localhost:8000 ..." -ForegroundColor Yellow

$env:PYTHONPATH = "backend"
python -m uvicorn main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
