import { LLMProvider, LLMGenerateOptions, LLMGenerateResult } from './base.js';

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
        eval_count?: number;
        prompt_eval_count?: number;
      };

      const text = data.message?.content || '';

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
