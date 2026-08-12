import { LLMProvider, LLMGenerateOptions, LLMGenerateResult } from './base.js';

export class OpenAILocalProvider implements LLMProvider {
  id = 'openai_local';
  name = 'OpenAI Compatible Local API (LM Studio / vLLM / LocalAI)';
  baseUrl: string;
  defaultModel: string;

  constructor(baseUrl = 'http://localhost:1234/v1', defaultModel = 'local-model') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.defaultModel = defaultModel;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
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
      const res = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) return [this.defaultModel];
      const data = await res.json() as { data?: Array<{ id: string }> };
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        return data.data.map(m => m.id);
      }
      return [this.defaultModel];
    } catch {
      return [this.defaultModel];
    }
  }

  async generate(options: LLMGenerateOptions): Promise<LLMGenerateResult> {
    const url = `${this.baseUrl}/chat/completions`;

    const messages = [];
    if (options.systemInstruction) {
      messages.push({ role: 'system', content: options.systemInstruction });
    }
    messages.push({ role: 'user', content: options.prompt });

    const payload: Record<string, any> = {
      model: this.defaultModel,
      messages,
      temperature: options.temperature ?? 0.7
    };

    if (options.responseFormat === 'json') {
      payload.response_format = { type: 'json_object' };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60000)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI Local API error (${response.status}): ${errText}`);
      }

      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: { total_tokens?: number } };
      const text = data.choices?.[0]?.message?.content || '';

      return {
        text,
        model: this.defaultModel,
        provider: this.id,
        tokensUsed: data.usage?.total_tokens || 0
      };
    } catch (err: any) {
      throw new Error(`OpenAI Local API execution failed: ${err.message}`);
    }
  }
}
