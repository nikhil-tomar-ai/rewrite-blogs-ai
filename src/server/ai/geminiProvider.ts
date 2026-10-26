import { GoogleGenAI } from '@google/genai';
import { LLMProvider, LLMGenerateOptions, LLMGenerateResult } from './base.js';

export class GeminiProvider implements LLMProvider {
  id = 'gemini';
  name = 'Google Gemini (Cloud Accelerated)';
  baseUrl = 'https://generativelanguage.googleapis.com';
  defaultModel = 'gemini-3.8-flash';
  private ai: GoogleGenAI | null = null;

  constructor(model = 'gemini-3.8-flash') {
    this.defaultModel = model;
    if (process.env.GEMINI_API_KEY) {
      try {
        this.ai = new GoogleGenAI({});
      } catch (err) {
        console.warn('Could not initialize GoogleGenAI client:', err);
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  async listModels(): Promise<string[]> {
    return ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  }

  async generate(options: LLMGenerateOptions): Promise<LLMGenerateResult> {
    if (!this.ai) {
      if (process.env.GEMINI_API_KEY) {
        this.ai = new GoogleGenAI({});
      } else {
        throw new Error('GEMINI_API_KEY environment variable is not configured.');
      }
    }

    const requestedModel = options.model || this.defaultModel;

    const config: Record<string, any> = {};
    if (options.temperature !== undefined) {
      config.temperature = options.temperature;
    }
    if (options.systemInstruction) {
      config.systemInstruction = options.systemInstruction;
    }
    if (options.responseFormat === 'json') {
      config.responseMimeType = 'application/json';
    }

    // Attempt generation with automatic exponential retry and secondary model fallback
    const modelsToTry = [
      requestedModel,
      requestedModel !== 'gemini-3.1-flash-lite' ? 'gemini-3.1-flash-lite' : 'gemini-flash-latest'
    ];

    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const result = await this.executeWithRetry(modelName, options.prompt, config);
        return {
          text: result.text,
          model: modelName,
          provider: this.id,
          tokensUsed: result.tokensUsed
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini generation failed on model ${modelName}:`, err.message || err);
        // If it's a rate limit or quota error, proceed to try fallback model
        const isQuotaOrRateLimit =
          err?.status === 429 ||
          err?.message?.includes('429') ||
          err?.message?.includes('RESOURCE_EXHAUSTED') ||
          err?.message?.includes('quota') ||
          err?.message?.includes('overloaded');

        if (!isQuotaOrRateLimit) {
          // If it's an unrecoverable non-quota error, don't loop endlessly
          break;
        }
      }
    }

    throw lastError || new Error('Failed to generate content with Gemini API');
  }

  private async executeWithRetry(
    modelName: string,
    prompt: string,
    config: Record<string, any>,
    maxRetries = 3
  ): Promise<{ text: string; tokensUsed: number }> {
    let delay = 1200;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.ai!.models.generateContent({
          model: modelName,
          contents: prompt,
          config
        });

        const text = response.text || '';
        const tokensUsed = response.usageMetadata?.totalTokenCount || 0;

        return { text, tokensUsed };
      } catch (err: any) {
        const isTransient =
          err?.status === 429 ||
          err?.status === 503 ||
          err?.status === 500 ||
          err?.message?.includes('429') ||
          err?.message?.includes('RESOURCE_EXHAUSTED') ||
          err?.message?.includes('quota') ||
          err?.message?.includes('overloaded') ||
          err?.message?.includes('temporarily unavailable') ||
          err?.message?.includes('fetch failed');

        if (isTransient && attempt < maxRetries) {
          const jitter = Math.floor(Math.random() * 500);
          const backoff = delay + jitter;
          console.warn(
            `Gemini rate limit / transient issue on ${modelName} (attempt ${attempt}/${maxRetries}). Retrying in ${backoff}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, backoff));
          delay *= 2;
        } else {
          throw err;
        }
      }
    }

    throw new Error(`Max retries reached on ${modelName}`);
  }
}
