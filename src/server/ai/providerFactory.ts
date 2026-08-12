import { LLMProvider } from './base.js';
import { OllamaProvider } from './ollamaProvider.js';
import { OpenAILocalProvider } from './openaiLocalProvider.js';
import { FallbackLocalProvider } from './fallbackProvider.js';

export class LLMProviderManager {
  private static instance: LLMProviderManager;
  private currentProvider: LLMProvider;
  private providerType: 'ollama' | 'openai_local' | 'fallback';
  private config: {
    baseUrl: string;
    model: string;
    temperature: number;
  };

  private constructor() {
    this.providerType = (process.env.LLM_PROVIDER as any) || 'ollama';
    this.config = {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
      temperature: Number(process.env.DEFAULT_TEMPERATURE) || 0.7
    };

    this.currentProvider = this.createProvider(this.providerType, this.config.baseUrl, this.config.model);
  }

  public static getInstance(): LLMProviderManager {
    if (!LLMProviderManager.instance) {
      LLMProviderManager.instance = new LLMProviderManager();
    }
    return LLMProviderManager.instance;
  }

  public createProvider(type: string, baseUrl: string, model: string): LLMProvider {
    if (type === 'openai_local') {
      return new OpenAILocalProvider(baseUrl || 'http://localhost:1234/v1', model || 'local-model');
    }
    if (type === 'fallback') {
      return new FallbackLocalProvider();
    }
    // Default to Ollama
    return new OllamaProvider(baseUrl || 'http://localhost:11434', model || 'llama3.1:8b');
  }

  public getProvider(): LLMProvider {
    return this.currentProvider;
  }

  public getConfig() {
    return {
      providerType: this.providerType,
      baseUrl: this.currentProvider.baseUrl,
      model: this.currentProvider.defaultModel,
      temperature: this.config.temperature
    };
  }

  public updateConfig(newConfig: { providerType?: 'ollama' | 'openai_local' | 'fallback'; baseUrl?: string; model?: string; temperature?: number }) {
    if (newConfig.providerType) {
      this.providerType = newConfig.providerType;
    }
    if (newConfig.baseUrl) {
      this.config.baseUrl = newConfig.baseUrl;
    }
    if (newConfig.model) {
      this.config.model = newConfig.model;
    }
    if (newConfig.temperature !== undefined) {
      this.config.temperature = newConfig.temperature;
    }

    this.currentProvider = this.createProvider(this.providerType, this.config.baseUrl, this.config.model);
  }

  public async getActiveProviderWithFallback(): Promise<LLMProvider> {
    const isPrimaryAvailable = await this.currentProvider.isAvailable();
    if (isPrimaryAvailable) {
      return this.currentProvider;
    }

    // Try fallback rule engine if primary local model service is offline
    console.warn(`Local LLM provider (${this.currentProvider.name}) is offline or unreachable. Using SparkyAI local rule engine fallback.`);
    return new FallbackLocalProvider();
  }
}

export const getLLMProviderManager = () => LLMProviderManager.getInstance();
