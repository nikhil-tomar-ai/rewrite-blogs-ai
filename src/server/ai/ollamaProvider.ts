import { LLMProvider, LLMGenerateOptions, LLMGenerateResult } from './base.js';
import fs from 'fs/promises';
import path from 'path';

export class OllamaProvider implements LLMProvider {
  id = 'ollama';
  name = 'Ollama (Local LLM)';
  baseUrl: string;
  defaultModel: string;

  constructor(baseUrl = 'http://localhost:11434', defaultModel = 'llama3.1:8b') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.defaultModel = defaultModel;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/version`, {
        method: 'GET',
        signal: AbortSignal.timeout(2500)
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) return [this.defaultModel];
      const data = await res.json() as { models?: Array<{ name?: string; model?: string }> };
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
    const url = `${this.baseUrl}/api/generate`;

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
      // Log outgoing payload and instructions for debugging/audit
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
        console.log('OLLAMA REQUEST:', JSON.stringify(logEntry, null, 2));

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
        console.error('OLLAMA logging error:', logErr);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(90000)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama API error (${response.status}): ${errText}`);
      }

      const data = await response.json() as { response?: string; eval_count?: number };

      // Log full provider response to console for immediate visibility
      try {
        console.log('OLLAMA RESPONSE:', JSON.stringify(data, null, 2));
      } catch (e) {
        // ignore
      }

      // Append response to last log entry for easier tracing
      try {
        const logFile = path.join(process.cwd(), 'storage', 'ollama_requests.json');
        try {
          const existing = await fs.readFile(logFile, 'utf8');
          const arr = JSON.parse(existing || '[]');
          const last = arr[arr.length - 1];
          if (last && last.timestamp) {
            last.response = data.response || null;
            last.responseMeta = { eval_count: data.eval_count || 0 };
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
        tokensUsed: data.eval_count || 0
      };
    } catch (err: any) {
      throw new Error(`Ollama Local Model execution failed: ${err.message}`);
    }
  }
}
