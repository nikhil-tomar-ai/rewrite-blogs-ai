import { LLMProvider } from './base.js';
import { OllamaProvider } from './ollamaProvider.js';
import { OllamaCloudProvider } from './ollamaCloudProvider.js';
import { OpenAILocalProvider } from './openaiLocalProvider.js';
import { FallbackLocalProvider } from './fallbackProvider.js';
import {
  getConfiguredProviderType,
  getDefaultProviderType,
  getDefaultTemperature,
  getOllamaCloudApiKey,
  getOllamaCloudBaseUrl,
  getOllamaCloudModel,
  getOllamaLocalBaseUrl,
  getOllamaLocalModel,
  validateProviderConfig
} from '../config.js';

export class LLMProviderManager {
  private static instance: LLMProviderManager;
  private currentProvider: LLMProvider;
  private providerType: 'ollama-cloud' | 'ollama-local' | 'openai_local' | 'fallback';
  private config: {
    baseUrl: string;
    model: string;
    temperature: number;
  };

  private constructor() {
    this.providerType = getConfiguredProviderType() || getDefaultProviderType();
    validateProviderConfig(this.providerType);

    this.config = {
      baseUrl: this.getDefaultBaseUrl(this.providerType),
      model: this.getDefaultModel(this.providerType),
      temperature: getDefaultTemperature()
    };

    this.currentProvider = this.createProvider(this.providerType, this.config.baseUrl, this.config.model);
  }

  public static getInstance(): LLMProviderManager {
    if (!LLMProviderManager.instance) {
      LLMProviderManager.instance = new LLMProviderManager();
    }
    return LLMProviderManager.instance;
  }

  private getDefaultBaseUrl(providerType: string): string {
    if (providerType === 'ollama-cloud') {
      return getOllamaCloudBaseUrl();
    }
    if (providerType === 'ollama-local') {
      return getOllamaLocalBaseUrl();
    }
    return '';
  }

  private getDefaultModel(providerType: string): string {
    if (providerType === 'ollama-cloud') {
      return getOllamaCloudModel();
    }
    if (providerType === 'ollama-local') {
      return getOllamaLocalModel();
    }
    if (providerType === 'openai_local') {
      return process.env.OPENAI_LOCAL_MODEL || 'local-model';
    }
    return '';
  }

  public createProvider(type: string, baseUrl: string, model: string): LLMProvider {
    if (type === 'ollama-cloud') {
      return new OllamaCloudProvider(baseUrl || getOllamaCloudBaseUrl(), model || getOllamaCloudModel(), getOllamaCloudApiKey());
    }
    if (type === 'ollama-local') {
      return new OllamaProvider(baseUrl || getOllamaLocalBaseUrl(), model || getOllamaLocalModel());
    }
    if (type === 'openai_local') {
      return new OpenAILocalProvider(baseUrl || 'http://localhost:1234/v1', model || 'local-model');
    }
    return new FallbackLocalProvider();
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

  public updateConfig(newConfig: { providerType?: 'ollama-cloud' | 'ollama-local' | 'openai_local' | 'fallback'; baseUrl?: string; model?: string; temperature?: number }) {
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

    validateProviderConfig(this.providerType);
    this.currentProvider = this.createProvider(this.providerType, this.config.baseUrl, this.config.model);
  }

  public async getActiveProviderWithFallback(): Promise<LLMProvider> {
    const isPrimaryAvailable = await this.currentProvider.isAvailable();
    if (isPrimaryAvailable) {
      return this.currentProvider;
    }

    console.warn(`AI provider (${this.currentProvider.name}) is unavailable. Falling back to the local rule engine.`);
    return new FallbackLocalProvider();
  }
}

export const getLLMProviderManager = () => LLMProviderManager.getInstance();
