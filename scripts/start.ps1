Write-Host "=== Launching SparkyAI Local Content Humanizer ===" -ForegroundColor Green

if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
}

Write-Host "Starting SparkyAI web application server at http://localhost:3000 ..." -ForegroundColor Cyan
npm run dev
