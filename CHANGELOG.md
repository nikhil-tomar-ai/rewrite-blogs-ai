# Changelog

All notable changes to **SparkyAI** will be documented in this file.

---

## [v4.0.0] - Open-Source Local Migration Release

### 🚀 Major Architectural Changes
* **Full Local Migration:** Completely removed mandatory external cloud AI dependencies (Gemini) in favor of open-source local LLM providers (Ollama & OpenAI Local APIs).
* **LLM Provider Abstraction:** Introduced `LLMProvider` interface supporting `OllamaProvider` (Llama 3.2, Mistral, Qwen 2.5), `OpenAILocalProvider` (LM Studio, vLLM), and `FallbackLocalProvider` (built-in rule & template engine).
* **Local Storage Layer:** Implemented local file-backed SQLite/JSON persistence for jobs, uploads, results, and audit logs.
* **Local AI Configuration Modal:** Integrated UI settings panel displaying connection status, active models, installed local model lists, and endpoint configurations.
* **Developer Workflows:** Added setup/start scripts for Linux, macOS, and Windows PowerShell, alongside Docker container setups.
