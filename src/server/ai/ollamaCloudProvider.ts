import { LLMProvider, LLMGenerateOptions, LLMGenerateResult } from './base.js';
import fs from 'fs/promises';
import path from 'path';

export class OllamaCloudProvider implements LLMProvider {
  id = 'ollama-cloud';
  name = 'Ollama Cloud';
  baseUrl: string;
  defaultModel: string;
  private apiKey: string;

  constructor(baseUrl = 'https://ollama.com/api', defaultModel = 'gemma3:27b-cloud', apiKey = '') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.defaultModel = defaultModel;
    this.apiKey = apiKey;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }
    try {
      // Ollama Cloud /api/tags lists available cloud models — a quick connectivity check
      const res = await fetch(`${this.baseUrl}/tags`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(4000)
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/tags`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000)
      });
      if (!res.ok) {
        return [this.defaultModel];
      }
      const data = (await res.json()) as { models?: Array<{ name?: string; model?: string }> };
      if (data.models && Array.isArray(data.models) && data.models.length > 0) {
        const models = data.models.map(m => m.name || m.model || '').filter(Boolean);
        return models.length > 0 ? models : [this.defaultModel];
      }
      return [this.defaultModel];
    } catch {
      return [this.defaultModel];
    }
  }

  async generate(options: LLMGenerateOptions): Promise<LLMGenerateResult> {
    const model = options.model || this.defaultModel;

    // Ollama Cloud uses the /api/chat endpoint with OpenAI-style messages array
    const url = `${this.baseUrl}/chat`;

    const messages: Array<{ role: string; content: string }> = [];

    if (options.systemInstruction) {
      messages.push({ role: 'system', content: options.systemInstruction });
    }

    messages.push({ role: 'user', content: options.prompt });

    const payload: Record<string, any> = {
      model,
      messages,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.7
      }
    };

    if (options.responseFormat === 'json') {
      payload.format = 'json';
    }

    try {
      // Log outgoing payload for debugging
      try {
        const logEntry = {
          timestamp: new Date().toISOString(),
          provider: this.id,
          model,
          url,
          payload,
          systemInstruction: options.systemInstruction || null,
          promptPreview: typeof options.prompt === 'string' ? options.prompt.slice(0, 1024) : null
        } as any;

        const logFile = path.join(process.cwd(), 'storage', 'ollama_requests.json');
        try {
          await fs.mkdir(path.dirname(logFile), { recursive: true });
          let arr: any[] = [];
          try {
            const existing = await fs.readFile(logFile, 'utf8');
            arr = JSON.parse(existing || '[]');
          } catch (e) {
            arr = [];
          }
          arr.push(logEntry);
          await fs.writeFile(logFile, JSON.stringify(arr, null, 2), 'utf8');
        } catch (wfErr) {
          // ignore
        }
      } catch (logErr) {
        // ignore
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(120000) // 2-minute timeout for cloud model
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama Cloud API error (${response.status}): ${errText}`);
      }
      const data = (await response.json()) as {
        message?: { role?: string; content?: string };
        response?: string;
        eval_count?: number;
        prompt_eval_count?: number;
        usage?: { total_tokens?: number };
      };

      const text = data.message?.content || data.response || '';

      try {
        const logFile = path.join(process.cwd(), 'storage', 'ollama_requests.json');
        try {
          const existing = await fs.readFile(logFile, 'utf8');
          const arr = JSON.parse(existing || '[]');
          const last = arr[arr.length - 1];
          if (last && last.timestamp) {
            last.response = text || null;
            last.responseMeta = { eval_count: data.eval_count || 0, prompt_eval_count: data.prompt_eval_count || 0, usage: data.usage || null };
            await fs.writeFile(logFile, JSON.stringify(arr, null, 2), 'utf8');
          }
        } catch (e) {
          // ignore
        }
      } catch (e) {
        // ignore
      }

      return {
        text,
        model,
        provider: this.id,
        tokensUsed: (data.eval_count || 0) + (data.prompt_eval_count || 0)
      };
    } catch (err: any) {
      throw new Error(`Ollama Cloud Model execution failed: ${err.message}`);
    }
  }
}
