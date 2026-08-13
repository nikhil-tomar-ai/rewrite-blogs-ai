import { LLMProvider, LLMGenerateOptions, LLMGenerateResult } from './base.js';
import fs from 'fs/promises';
import path from 'path';

export class OllamaCloudProvider implements LLMProvider {
  id = 'ollama-cloud';
  name = 'Ollama Cloud';
  baseUrl: string;
  defaultModel: string;
  private apiKey: string;

  constructor(baseUrl = 'https://ollama.com/api', defaultModel = 'gemma4', apiKey = '') {
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
      const res = await fetch(`${this.baseUrl}/version`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(2500)
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
        signal: AbortSignal.timeout(3000)
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
    const url = `${this.baseUrl}/generate`;

    const payload: Record<string, any> = {
      model,
      prompt: options.prompt,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.7
      }
    };

    if (options.systemInstruction) {
      payload.system = options.systemInstruction;
    }
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
        console.log('OLLAMA CLOUD REQUEST:', JSON.stringify(logEntry, null, 2));

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
          console.error('Failed to write ollama request log:', wfErr);
        }
      } catch (logErr) {
        console.error('OLLAMA CLOUD logging error:', logErr);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(90000)
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama Cloud API error (${response.status}): ${errText}`);
      }
      const data = (await response.json()) as { response?: string; eval_count?: number; usage?: { total_tokens?: number } };

      // Log full provider response to console for immediate visibility
      try {
        console.log('OLLAMA CLOUD RESPONSE:', JSON.stringify(data, null, 2));
      } catch (e) {
        // ignore
      }

      try {
        const logFile = path.join(process.cwd(), 'storage', 'ollama_requests.json');
        try {
          const existing = await fs.readFile(logFile, 'utf8');
          const arr = JSON.parse(existing || '[]');
          const last = arr[arr.length - 1];
          if (last && last.timestamp) {
            last.response = data.response || null;
            last.responseMeta = { eval_count: data.eval_count || 0, usage: data.usage || null };
            await fs.writeFile(logFile, JSON.stringify(arr, null, 2), 'utf8');
          }
        } catch (e) {
          // ignore
        }
      } catch (e) {
        // ignore
      }

      return {
        text: data.response || '',
        model,
        provider: this.id,
        tokensUsed: data.eval_count || data.usage?.total_tokens || 0
      };
    } catch (err: any) {
      throw new Error(`Ollama Cloud Model execution failed: ${err.message}`);
    }
  }
}
