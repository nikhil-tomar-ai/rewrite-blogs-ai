Write-Host "=== SparkyAI Local Humanizer Setup (Windows) ===" -ForegroundColor Green

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js is not installed. Please install Node.js v18 or higher." -ForegroundColor Red
    Exit 1
}

Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

if (-not (Test-Path .env)) {
    Write-Host "Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
}

if (Get-Command ollama -ErrorAction SilentlyContinue) {
    Write-Host "Ollama detected! Pulling default model 'llama3.1:8b'..." -ForegroundColor Green
    ollama pull llama3.1:8b
} else {
    Write-Host "Note: Ollama is not detected in PATH. Install from https://ollama.com for local AI execution." -ForegroundColor Yellow
    Write-Host "SparkyAI will run using its built-in rule engine until Ollama is launched." -ForegroundColor Cyan
}

Write-Host "=== Setup Completed Successfully ===" -ForegroundColor Green
Write-Host "Run 'npm run dev' or '.\scripts\start.ps1' to launch SparkyAI!" -ForegroundColor Green
