export type TonePreset =
  | 'casual'
  | 'conversational'
  | 'thought_leader'
  | 'storyteller'
  | 'punchy'
  | 'sarcastic'
  | 'academic'
  | 'custom';

export interface ToneOption {
  id: TonePreset;
  name: string;
  description: string;
  iconName: string;
  example: string;
}

export interface HumanizerConfig {
  contentColumn: string;
  titleColumn: string;
  authorColumn: string;
  targetColumns: string[]; // List of column headers to rewrite ('*' for all columns)
  tone: TonePreset;
  customPrompt: string;
  temperature: number; // 0.0 - 1.0
  enableCritic: boolean;
  preserveKeywords: string[];
  addContractions: boolean;
  removeAiFluff: boolean;
  batchConcurrency: number;
}

export interface CriticResult {
  score: number; // 0 - 100
  feedback: string;
  isHumanEnough: boolean;
  turns: number;
}

export interface BlogRow {
  id: string; // unique row id
  originalIndex: number;
  rawRecord: Record<string, string>;
  title: string;
  author: string;
  originalContent: string;
  humanizedContent: string;
  humanizedColumns: Record<string, string>; // Maps column header -> humanized text
  status: 'pending' | 'processing' | 'humanized' | 'failed' | 'edited';
  errorMessage?: string;
  criticResult?: CriticResult;
  wordCountOriginal: number;
  wordCountHumanized: number;
  fleschScoreOriginal: number;
  fleschScoreHumanized: number;
  aiFluffReduction: number; // percentage
  processedAt?: string;
  timeTakenMs?: number;
}

export interface AuditLogEntry {
  id: string;
  filename: string;
  rowIndex: number;
  title: string;
  originalContent: string;
  humanizedContent: string;
  tone: string;
  criticScore: number;
  timestamp: string;
  tokensUsed: number;
}

export interface BatchProcessingStats {
  totalRows: number;
  completedRows: number;
  successfulRows: number;
  failedRows: number;
  startTime: number | null;
  endTime: number | null;
  isProcessing: boolean;
  isPaused: boolean;
  currentProcessingId: string | null;
}

export interface SampleCSVDataset {
  id: string;
  name: string;
  description: string;
  filename: string;
  rowsCount: number;
  contentColumn: string;
  titleColumn: string;
  authorColumn: string;
  data: Record<string, string>[];
}
