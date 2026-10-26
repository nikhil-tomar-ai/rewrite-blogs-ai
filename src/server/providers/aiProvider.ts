/**
 * AI Provider Abstraction Interface
 * Section 11: Decoupled architecture allowing seamless addition of
 * OllamaProvider, OpenAIProvider, GeminiProvider, and AnthropicProvider.
 */

export interface AIRequest {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
  stopSequences?: string[];
}

export interface AIResponse {
  text: string;
  model: string;
  provider: string;
  tokensUsed?: number;
  processingTimeMs?: number;
}

export interface AIHealthStatus {
  isAvailable: boolean;
  provider: string;
  baseUrl: string;
  availableModels: string[];
  message: string;
  latencyMs?: number;
}

export interface AIProvider {
  id: string;
  name: string;
  generate(request: AIRequest): Promise<AIResponse>;
  healthCheck(): Promise<AIHealthStatus>;
  listModels?(): Promise<string[]>;
}
