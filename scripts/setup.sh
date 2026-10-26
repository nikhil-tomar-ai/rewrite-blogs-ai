#!/usr/bin/env bash

set -e

echo "=== SparkyAI Local Humanizer Setup ==="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js v18 or later."
    exit 1
fi

echo "✓ Node.js version: $(node -v)"

# Install dependencies
echo "Installing application dependencies..."
npm install

# Setup environment file if not exists
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

# Check Ollama
if command -v ollama &> /dev/null; then
    echo "✓ Ollama is installed."
    echo "Pulling default local model (llama3.1:8b)..."
    ollama pull llama3.1:8b || echo "Warning: Could not pull llama3.1:8b automatically. Ensure 'ollama serve' is running."
else
    echo "Note: Ollama is not detected in PATH."
    echo "You can install Ollama from https://ollama.com for full offline local LLM power."
    echo "SparkyAI will automatically run using its built-in rule engine until Ollama is launched."
fi

echo "=== Setup Completed Successfully ==="
echo "Run 'npm run dev' or './scripts/start.sh' to launch SparkyAI!"
