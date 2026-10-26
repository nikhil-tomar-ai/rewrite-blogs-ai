# SparkyAI — Open-Source Local CSV Blog Humanizer & Editorial Workspace

![SparkyAI Local Banner](https://img.shields.shields.gov/badge/License-MIT-blue.svg) ![Local AI](https://img.shields.shields.gov/badge/AI-100%25%20Local%20%26%20Offline-emerald.svg) ![Node.js](https://img.shields.shields.gov/badge/Node.js-18%2B-green.svg) ![Ollama](https://img.shields.shields.gov/badge/Ollama-Supported-orange.svg)

**SparkyAI** is a privacy-first, 100% open-source, local-first application designed to bulk rewrite, polish, and humanize AI-generated blog drafts, CSV datasets, and content records using **local open-source LLMs** (such as Llama 3.1:8b, Llama 3.2, Mistral, Qwen 2.5, Gemma 2, or any Ollama / LM Studio endpoint).

---

## 🌟 Key Features

* **100% Local & Privacy-Preserving:** Zero external cloud API calls required. CSV records, blog content, prompts, and outputs stay completely on your machine.
* **Open-Source LLM Architecture:** Powered by Ollama (`http://localhost:11434`) and OpenAI-compatible local servers (LM Studio, vLLM, LocalAI), tested with `llama3.1:8b`.
* **Multi-Column & All-Column Rewriting:** Humanize single body fields or entire CSV rows across titles, summaries, and content blocks simultaneously.
* **Dual-Pass Editorial Critic:** Automatic local critique loop evaluating human tone authenticity, sentence rhythm, and fluff removal.
* **Interactive Vibe Workspace:** Side-by-side diff review modal, quick AI editing prompts, Flesch readability metrics, and export capabilities.
* **Local Persistence & Audit Log:** SQLite/JSON database storing job history, checkpointing, and audit trails without external database servers.
* **Offline Fallback:** Includes a built-in rule & template engine so the app boots and functions even if your local LLM service is starting up.

---

## 🚀 Quick Start Guide

### Prerequisites

* **Node.js:** v18 or later
* **Ollama (Recommended):** Download from [ollama.com](https://ollama.com)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/sparkyai.git
cd sparkyai
npm install
```

### 2. Launch Local LLM (Ollama)

```bash
# Start Ollama service
ollama serve

# Pull default model (llama3.1:8b)
ollama pull llama3.1:8b
```

### 3. Start SparkyAI Application

```bash
npm run dev
```

Open your browser at **`http://localhost:3000`**.

---

## 🛠️ Automated Setup Scripts

* **macOS / Linux:**
  ```bash
  chmod +x scripts/setup.sh scripts/start.sh
  ./scripts/setup.sh
  ./scripts/start.sh
  ```

* **Windows PowerShell:**
  ```powershell
  .\scripts\setup.ps1
  .\scripts\start.ps1
  ```

---

## 🐳 Docker Setup

Run SparkyAI with Docker Compose:

```bash
docker-compose up --build
```

Access SparkyAI at `http://localhost:3000`.

---

## ⚙️ Environment Configuration (`.env`)

Copy `.env.example` to `.env`:

```env
APP_ENV=development
PORT=3000

# Local LLM Provider ('ollama' or 'openai_local')
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
DEFAULT_TEMPERATURE=0.7

DATABASE_URL=file:./data/sparkyai_local_db.json
STORAGE_DIR=./storage
```

---

## 📑 API Reference

* `GET /api/health` — Application health check.
* `GET /api/health/llm` — Local LLM connection status and installed model list.
* `GET /api/settings/llm` — View local LLM provider configuration.
* `POST /api/settings/llm` — Switch local models or provider base URLs dynamically.
* `POST /api/humanize` — Execute single-row or multi-column humanization pass.
* `POST /api/quick-edit` — Apply natural language editorial instructions to drafts.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.
