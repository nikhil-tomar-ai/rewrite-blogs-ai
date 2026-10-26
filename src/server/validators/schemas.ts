import { z } from 'zod';

/**
 * Zod Validation Schemas for the Platform
 * Section 38: Rigorous validation of API inputs, configuration, file metadata, and parameters.
 */

export const humanizationLevelSchema = z.enum(['light', 'medium', 'strong']);
export const expansionLevelSchema = z.enum(['none', 'low', 'medium', 'high']);
export const writingStyleSchema = z.enum([
  'casual',
  'conversational',
  'thought_leader',
  'storyteller',
  'punchy',
  'sarcastic',
  'academic',
  'custom'
]);

export const contentTypeSchema = z.enum([
  'blog_title',
  'meta_title',
  'meta_description',
  'introduction',
  'main_content',
  'conclusion',
  'faq',
  'h1',
  'h2',
  'h3',
  'tags',
  'generic_text',
  'metadata_skip'
]);

export const processingConfigurationSchema = z.object({
  provider: z.enum(['ollama', 'openai', 'gemini', 'anthropic', 'fallback']).default('ollama'),
  model: z.string().min(1, 'Model name is required'),
  humanizationLevel: humanizationLevelSchema.default('medium'),
  expansionLevel: expansionLevelSchema.default('none'),
  writingStyle: writingStyleSchema.default('casual'),
  selectedColumns: z.array(z.string()).min(1, 'At least one column must be selected for processing'),
  contentTypeMap: z.record(z.string(), contentTypeSchema).optional().default({}),
  customInstructions: z.string().optional().default(''),
  preserveKeywords: z.array(z.string()).optional().default([]),
  batchSize: z.number().int().min(1).max(100).default(10),
  maxRetries: z.number().int().min(1).max(10).default(3),
  temperature: z.number().min(0.0).max(1.0).default(0.7),
  updateWordCount: z.boolean().default(false),
  placeholderProtection: z.boolean().default(true)
});

export const createJobSchema = z.object({
  datasetId: z.string().min(1, 'Dataset ID is required'),
  configuration: processingConfigurationSchema
});

export const regenerateRowSchema = z.object({
  columnName: z.string().optional(),
  overrideInstructions: z.string().optional()
});

export const aiProviderSettingsSchema = z.object({
  providerType: z.enum(['ollama', 'openai', 'gemini', 'anthropic', 'fallback']),
  baseUrl: z.string().url('Must be a valid URL'),
  model: z.string().min(1, 'Model name is required'),
  temperature: z.number().min(0).max(1).optional()
});

export const structuredAiResponseSchema = z.object({
  transformedContent: z.string(),
  changesSummary: z.string().optional(),
  warnings: z.array(z.string()).optional().default([])
});
