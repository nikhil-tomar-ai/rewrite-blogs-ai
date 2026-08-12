# SparkyAI / Local Content Humanizer - Architecture Audit Report

**Date:** August 2026  
**Status:** Audit Complete & Migration Strategy Defined

---

## 1. Executive Summary

This document presents the codebase audit for transforming the CSV Blog Humanizer application into a **fully local, open-source, local-first application (SparkyAI)**. The target architecture eliminates any hard requirement for external cloud AI services (specifically Google Gemini), removes proprietary SDK bottlenecks, and establishes a modular local execution engine powered by **Ollama / Local LLM providers** with local database persistence and storage.

---

## 2. Codebase Dependency & Service Map

### 2.1 AI Service Dependencies (Current vs Target)

* **Current Implementation:**
  * Package: `@google/genai` v2.4.0 in `package.json`.
  * Client: `GoogleGenAI` initialized in `server.ts`.
  * API Calls: `ai.models.generateContent()` with model `gemini-3.6-flash`.
  * Endpoint: Google Generative Language REST APIs (`https://generativelanguage.googleapis.com`).
  * Authentication: `GEMINI_API_KEY` environment variable.

* **Target Local Implementation:**
  * Local Runtime: **Ollama** (Default) or **OpenAI-Compatible Local APIs** (LM Studio, vLLM, LocalAI).
  * Package: Clean native HTTP/fetch calls or standard REST integration (`ollama` / `fetch`).
  * Abstraction: `LLMProvider` interface supporting `OllamaProvider`, `OpenAILocalProvider`, and `FallbackLocalProvider` (rule/template engine when Ollama is starting up or offline).
  * API Calls: Local HTTP calls to `http://localhost:11434/api/generate` or `http://localhost:11434/api/chat`.
  * Authentication: **None required.** Fully local and offline.

### 2.2 Data Layer & File Storage

* **Current Implementation:** Memory-only arrays in-memory within Express server and browser state.
* **Target Implementation:**
  * Local Database: SQLite / structured file-backed local database (`./data/sparkyai.db` / `./data/db.json`).
  * Local Storage: Local filesystem directory structure (`./storage/uploads/`, `./storage/outputs/`, `./storage/temp/`).

---

## 3. Detailed File Modification Plan

| File / Component | Current Role | Migration Action |
| :--- | :--- | :--- |
| `package.json` | Contains `@google/genai` | Remove `@google/genai` dependency or make optional; ensure local dev scripts. |
| `.env.example` | Contains `GEMINI_API_KEY` | Update to `LLM_PROVIDER=ollama`, `OLLAMA_BASE_URL=http://localhost:11434`, `OLLAMA_MODEL=llama3.2`. Remove required API key flags. |
| `server.ts` | Monolithic Express server calling Gemini directly | Refactor into modular architecture. Import `LLMProvider` abstraction layer. Add local LLM health checks, local settings endpoints, job queue APIs, and offline fallback. |
| `src/server/ai/*` | New directory | Implement `base.ts`, `ollamaProvider.ts`, `openaiLocalProvider.ts`, `fallbackProvider.ts`, and `providerFactory.ts`. |
| `src/server/db/*` | New directory | Implement local database repository (`database.ts`) for storing jobs, records, audit history, and local settings. |
| `src/server/storage/*` | New directory | Implement local filesystem storage manager (`localFileStorage.ts`) for CSV uploads and outputs. |
| `src/components/Navbar.tsx` | App header | Add Local AI status indicator pill (● Local AI Connected / Offline) and Local AI settings modal launcher. |
| `src/components/ConfigPanel.tsx` | Config controls | Add local model selection, temperature, and local provider status. |
| `src/components/LocalAiSettingsModal.tsx` | New component | Modal to test connection to Ollama, switch models, and configure local endpoints. |
| `scripts/*` | New directory | Create `setup.sh`, `start.sh`, `setup.ps1`, `start.ps1`. |
| `docker/*` | New directory | Create `backend.Dockerfile`, `frontend.Dockerfile`, `docker-compose.yml`. |
| Documentation | Generic | Add `README.md`, `LICENSE` (MIT), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CHANGELOG.md`, `LOCAL_ARCHITECTURE.md`. |

---

## 4. Security & Privacy Audit Verification

* **Data Transmission:** 100% of CSV row processing, prompts, and generated outputs stay strictly on `localhost`.
* **Telemetry:** Zero telemetry, tracking pixels, or external logging.
* **Offline Execution:** Once dependencies and model files are pulled locally (e.g. `ollama pull llama3.2`), the entire stack operates without active internet connectivity.
