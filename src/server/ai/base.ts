export interface LLMGenerateOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
  model?: string;
}

export interface LLMGenerateResult {
  text: string;
  model: string;
  provider: string;
  tokensUsed?: number;
}

export interface LLMProvider {
  id: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
  generate(options: LLMGenerateOptions): Promise<LLMGenerateResult>;
  isAvailable(): Promise<boolean>;
  listModels(): Promise<string[]>;
}
