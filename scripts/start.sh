#!/usr/bin/env bash

set -e

echo "=== Launching SparkyAI Local Content Humanizer ==="

if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

# Attempt to start ollama serve in background if installed and not running
if command -v ollama &> /dev/null; then
    if ! pgrep -x "ollama" > /dev/null; then
        echo "Starting Ollama local server..."
        ollama serve > /dev/null 2>&1 &
        sleep 2
    fi
fi

echo "Starting SparkyAI web application server at http://localhost:3000 ..."
npm run dev
