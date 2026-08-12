export type AIProviderType = 'ollama-cloud' | 'ollama-local' | 'openai_local' | 'fallback';

const providerAliasMap: Record<string, AIProviderType> = {
  'ollama-cloud': 'ollama-cloud',
  'ollama_cloud': 'ollama-cloud',
  'cloud': 'ollama-cloud',
  'ollama': 'ollama-local',
  'ollama-local': 'ollama-local',
  'ollama_local': 'ollama-local',
  'local': 'ollama-local',
  'openai_local': 'openai_local',
  'openai-local': 'openai_local',
  'fallback': 'fallback'
};

export function normalizeProviderType(value: string | undefined): AIProviderType | undefined {
  if (!value) return undefined;
  return providerAliasMap[value.trim().toLowerCase()];
}

export function getConfiguredProviderType(): AIProviderType | undefined {
  return normalizeProviderType(process.env.AI_PROVIDER || process.env.LLM_PROVIDER);
}

export function getDefaultTemperature(): number {
  return Number(process.env.DEFAULT_TEMPERATURE ?? '0.7') || 0.7;
}

export function getOllamaLocalBaseUrl(): string {
  return (process.env.OLLAMA_LOCAL_BASE_URL || process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '');
}

export function getOllamaLocalModel(): string {
  return process.env.OLLAMA_LOCAL_MODEL || process.env.OLLAMA_MODEL || 'llama3.1:8b';
}

export function getOllamaCloudBaseUrl(): string {
  return (process.env.OLLAMA_CLOUD_BASE_URL || 'https://ollama.com/api').replace(/\/$/, '');
}

export function getOllamaCloudModel(): string {
  return process.env.OLLAMA_CLOUD_MODEL || '';
}

export function getOllamaCloudApiKey(): string {
  return process.env.OLLAMA_CLOUD_API_KEY || '';
}

export function getDefaultProviderType(): AIProviderType {
  const configured = getConfiguredProviderType();
  if (configured) {
    return configured;
  }

  if (getOllamaCloudApiKey() && getOllamaCloudModel()) {
    return 'ollama-cloud';
  }

  if (getOllamaLocalBaseUrl() && getOllamaLocalModel()) {
    return 'ollama-local';
  }

  return 'fallback';
}

export function validateProviderConfig(providerType: AIProviderType) {
  if (providerType === 'ollama-cloud') {
    if (!getOllamaCloudApiKey()) {
      throw new Error('Ollama Cloud provider selected but OLLAMA_CLOUD_API_KEY is not configured.');
    }
    if (!getOllamaCloudModel()) {
      throw new Error('Ollama Cloud provider selected but OLLAMA_CLOUD_MODEL is not configured.');
    }
    if (!getOllamaCloudBaseUrl()) {
      throw new Error('Ollama Cloud provider selected but OLLAMA_CLOUD_BASE_URL is not configured.');
    }
  }
}
