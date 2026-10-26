/**
 * Core Data Models and Types for the AI-Powered CSV Blog Humanization Platform
 * Follows the Master Specification for Datasets, Jobs, Rows, AI, and Configuration.
 */

// -------------------------------------------------------------
// Status Enums
// -------------------------------------------------------------
export type DatasetStatus =
  | 'UPLOADING'
  | 'UPLOADED'
  | 'ANALYZING'
  | 'READY'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'FAILED';

export type JobStatus =
  | 'CREATED'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type RowStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED';

export type ColumnDataType =
  | 'STRING'
  | 'LONG_TEXT'
  | 'NUMBER'
  | 'INTEGER'
  | 'DECIMAL'
  | 'BOOLEAN'
  | 'DATE'
  | 'DATETIME'
  | 'URL'
  | 'JSON'
  | 'UNKNOWN';

export type HumanizationLevel = 'light' | 'medium' | 'strong';

export type ExpansionLevel = 'none' | 'low' | 'medium' | 'high';

export type WritingStyle =
  | 'casual'
  | 'conversational'
  | 'thought_leader'
  | 'storyteller'
  | 'punchy'
  | 'sarcastic'
  | 'academic'
  | 'custom';

export type ContentType =
  | 'blog_title'
  | 'meta_title'
  | 'meta_description'
  | 'introduction'
  | 'main_content'
  | 'conclusion'
  | 'faq'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'tags'
  | 'generic_text'
  | 'metadata_skip';

// -------------------------------------------------------------
// Dynamic Column Analysis
// -------------------------------------------------------------
export interface ColumnAnalysis {
  index: number;
  name: string;
  originalName: string;
  inferredType: ColumnDataType;
  totalValues: number;
  nonEmptyValues: number;
  emptyValues: number;
  emptyPercentage: number;
  averageLength: number;
  maxLength: number;
  sampleValues: string[];
  contentScore: number;
  recommendedForProcessing: boolean;
  reason: string;
  // Backward compatibility convenience fields
  dataType?: string;
  nonEmptyCount?: number;
  emptyCount?: number;
  suggestedContentType?: ContentType;
  isLocked?: boolean;
  isPotentialContent?: boolean;
}

// -------------------------------------------------------------
// Dataset Model
// -------------------------------------------------------------
export interface Dataset {
  id: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  totalRows: number;
  totalColumns: number;
  columns: ColumnAnalysis[];
  originalHeaders: string[];
  status: DatasetStatus;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// Processing Configuration Model
// -------------------------------------------------------------
export interface ProcessingConfiguration {
  id: string;
  jobId?: string;
  provider: 'ollama' | 'openai' | 'gemini' | 'anthropic' | 'fallback';
  model: string;
  humanizationLevel: HumanizationLevel;
  expansionLevel: ExpansionLevel;
  writingStyle: WritingStyle;
  selectedColumns: string[];
  contentTypeMap: Record<string, ContentType>;
  customInstructions?: string;
  preserveKeywords: string[];
  batchSize: number;
  maxRetries: number;
  temperature: number;
  updateWordCount: boolean;
  placeholderProtection: boolean;
}

// -------------------------------------------------------------
// Processing Job Model
// -------------------------------------------------------------
export interface ProcessingJob {
  id: string;
  datasetId: string;
  status: JobStatus;
  totalRows: number;
  completedRows: number;
  successfulRows: number;
  failedRows: number;
  currentBatch: number;
  totalBatches: number;
  errorMessage?: string;
  config: ProcessingConfiguration;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// Processing Row Model (Stores Original + Transformed Values)
// -------------------------------------------------------------
export interface ProcessingRow {
  id: string;
  datasetId: string;
  jobId?: string;
  rowNumber: number; // 0-indexed position in the original CSV
  originalData: Record<string, string>;
  transformedData?: Record<string, string>;
  status: RowStatus;
  errorMessage?: string;
  retryCount: number;
  modelUsed?: string;
  providerUsed?: string;
  originalWordCount: number;
  transformedWordCount: number;
  wordCountDiff: number;
  processingTimeMs: number;
  criticScore?: number;
  criticFeedback?: string;
  startedAt?: string;
  completedAt?: string;
}

// -------------------------------------------------------------
// Consistent API Standard Response Wrapper
// -------------------------------------------------------------
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, any>;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
