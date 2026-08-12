# SparkyAI / Local Content Humanizer - Target Local Architecture

**Architecture Overview:** Local-First, Open-Source, Offline-Ready CSV Content Humanization Engine

---

## 1. System Topology

```text
+-----------------------------------------------------------------------+
|                            USER BROWSER                               |
|       React 19 + Vite UI (Vibe Workspace, Audit Log, Settings)        |
+-----------------------------------------------------------------------+
                                   │
                           REST API / HTTP
                                   │
                                   ▼
+-----------------------------------------------------------------------+
|                          LOCAL BACKEND SERVER                         |
|                     Node.js / Express (server.ts)                     |
|                                                                       |
|  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐    |
|  │  Job & CSV API   │  │ Storage Provider │  │ Local Database   │    |
|  │    Controller    │  │  (Local Files)   │  │ (SQLite / JSON)  │    |
|  └────────┬─────────┘  └──────────────────┘  └──────────────────┘    |
|           │                                                           |
|           ▼                                                           |
|  ┌────────────────────────────────────────────────────────┐           |
|  │              LLMProvider Abstraction Layer             │           |
|  │                                                        │           |
|  │  ┌─────────────────┐ ┌──────────────────┐ ┌─────────┐  │           |
|  │  │ Ollama Provider │ │ OpenAILocal (vLLM│ │ Fallback│  │           |
|  │  │  (Default API)  │ │   / LM Studio)   │ │ Engine  │  │           |
|  │  └────────┬────────┘ └──────────────────┘ └─────────┘  │           |
|  └───────────┼────────────────────────────────────────────┘           |
+──────────────┼────────────────────────────────────────────────────────+
               │
          Local HTTP (localhost:11434)
               │
               ▼
+-----------------------------------------------------------------------+
|                         LOCAL LLM INFERENCE                           |
|      Ollama Runtime (Llama 3.2, Mistral, Qwen2.5, Gemma 2, etc.)      |
+-----------------------------------------------------------------------+
```

---

## 2. LLM Provider Abstraction Interface

The backend decouples AI operations from specific API providers via a unified interface:

```typescript
export interface LLMGenerateOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
}

export interface LLMGenerateResult {
  text: string;
  model: string;
  provider: string;
  tokensUsed?: number;
}

export interface LLMProvider {
  id: string;
  name: string;
  generate(options: LLMGenerateOptions): Promise<LLMGenerateResult>;
  isAvailable(): Promise<boolean>;
  listModels?(): Promise<string[]>;
}
```

---

## 3. Local Storage Architecture

* **Database (`./data/sparkyai.db`):** Stores Job metadata, CSV Row statuses, Critic Scores, Audit Logs, and App Settings.
* **File Directory (`./storage/`):**
  * `./storage/uploads/`: Raw uploaded CSV files.
  * `./storage/outputs/`: Transformed humanized CSV files.
  * `./storage/temp/`: Intermediate job state.

---

## 4. API Endpoints Contract

### Health & LLM Status
* `GET /api/health` - Basic app server status.
* `GET /api/health/llm` - Local LLM connection status, active model, and list of available models installed in Ollama/local server.

### Local Settings
* `GET /api/settings/llm` - Get current local LLM configuration (provider, model, base URL, temperature).
* `POST /api/settings/llm` - Update local LLM configuration.

### Processing & Jobs
* `POST /api/humanize` - Humanize single row or multi-column payload.
* `POST /api/quick-edit` - Apply natural language instructions to an existing draft.
* `POST /api/uploads` - Save raw CSV upload locally.
* `POST /api/jobs` - Create batch processing job.
* `GET /api/jobs/:id/progress` - Get realtime batch job progress.
* `GET /api/jobs/:id/download` - Export transformed CSV file.
* `GET /api/jobs/:id/audit` - Get audit log history for job.
