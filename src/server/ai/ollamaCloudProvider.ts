import { LLMProvider, LLMGenerateOptions, LLMGenerateResult } from './base.js';

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
