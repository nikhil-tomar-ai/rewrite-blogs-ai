import { LLMProvider, LLMGenerateOptions, LLMGenerateResult } from './base.js';

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
