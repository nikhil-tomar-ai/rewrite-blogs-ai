import Papa from 'papaparse';
import { BlogRow, CriticResult } from '../types';

/**
 * Calculates Flesch Reading Ease score
 * Formula: 206.835 - (1.015 x ASL) - (84.6 x ASW)
 * ASL = Average Sentence Length (words / sentences)
 * ASW = Average Syllables per Word (syllables / words)
 */
export function calculateFleschScore(text: string): number {
  if (!text || text.trim().length === 0) return 0;

  const cleanedText = text.replace(/[\n\r]+/g, ' ').trim();
  const words = cleanedText.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return 0;

  // Estimate sentence count
  const sentences = cleanedText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);

  // Count syllables roughly
  let totalSyllables = 0;
  words.forEach(word => {
    totalSyllables += countSyllables(word);
  });

  const asl = words.length / sentenceCount;
  const asw = totalSyllables / words.length;

  const score = 206.835 - 1.015 * asl - 84.6 * asw;
  return Math.min(100, Math.max(0, Math.round(score * 10) / 10));
}

function countSyllables(word: string): number {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleanWord.length <= 3) return 1;

  const matches = cleanWord.match(/[aeiouy]{1,2}/g);
  let count = matches ? matches.length : 1;

  if (cleanWord.endsWith('e') && !cleanWord.endsWith('le') && !cleanWord.endsWith('ee')) {
    count--;
  }

  return Math.max(1, count);
}

// Words commonly associated with generic AI filler text
const AI_FLUFF_WORDS = [
  'delve',
  'tapestry',
  'landscape',
  'testament',
  'supercharge',
  'seamless',
  'paradigm',
  'beacon',
  'multifaceted',
  'plethora',
  'paramount',
  'furthermore',
  'moreover',
  'in conclusion',
  'in summary',
  'it is important to note',
  'it goes without saying',
  'unprecedented',
  'interconnected',
  'vital cornerstone'
];

/**
 * Calculates percentage of AI fluff words present in text
 */
export function calculateFluffPercentage(text: string): number {
  if (!text) return 0;
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return 0;

  let fluffCount = 0;
  AI_FLUFF_WORDS.forEach(phrase => {
    if (phrase.includes(' ')) {
      // multi-word phrase
      const occurrences = (lower.match(new RegExp(phrase, 'g')) || []).length;
      fluffCount += occurrences * phrase.split(' ').length;
    } else {
      const occurrences = (lower.match(new RegExp(`\\b${phrase}\\b`, 'g')) || []).length;
      fluffCount += occurrences;
    }
  });

  const ratio = (fluffCount / words.length) * 100;
  return Math.min(100, Math.round(ratio * 10) / 10);
}

/**
 * Parse a raw CSV string using PapaParse
 */
export function parseCSVString(csvContent: string): Record<string, string>[] {
  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: header => header.trim()
  });

  if (parsed.errors && parsed.errors.length > 0) {
    console.warn('CSV parsing warnings/errors:', parsed.errors);
  }

  return parsed.data || [];
}

/**
 * Automatically guess likely Content, Title, and Author column names
 */
export function autoDetectColumns(headers: string[]): {
  contentColumn: string;
  titleColumn: string;
  authorColumn: string;
} {
  const headersLower = headers.map(h => h.toLowerCase().trim());

  // Detect Content Column
  let contentIndex = headersLower.findIndex(h =>
    ['content', 'body', 'body_text', 'blog_content', 'text', 'article', 'post_content', 'description'].includes(h)
  );
  if (contentIndex === -1) {
    contentIndex = headersLower.findIndex(h => h.includes('content') || h.includes('text') || h.includes('body'));
  }
  if (contentIndex === -1) contentIndex = 0;

  // Detect Title Column
  let titleIndex = headersLower.findIndex(h =>
    ['title', 'post_title', 'headline', 'article_title', 'blog_title', 'subject', 'name'].includes(h)
  );
  if (titleIndex === -1) {
    titleIndex = headersLower.findIndex(h => h.includes('title') || h.includes('headline'));
  }
  if (titleIndex === -1) titleIndex = headers.length > 1 ? 1 : 0;

  // Detect Author Column
  let authorIndex = headersLower.findIndex(h =>
    ['author', 'writer', 'creator', 'by', 'author_name', 'user'].includes(h)
  );
  if (authorIndex === -1) {
    authorIndex = headersLower.findIndex(h => h.includes('author') || h.includes('writer'));
  }

  return {
    contentColumn: headers[contentIndex] || headers[0] || 'content',
    titleColumn: titleIndex !== -1 ? headers[titleIndex] : '',
    authorColumn: authorIndex !== -1 ? headers[authorIndex] : ''
  };
}

/**
 * Converts internal BlogRow list back into a CSV string using PapaParse,
 * preserving ALL original CSV columns in their exact original order.
 */
export function exportRowsToCSV(
  rows: BlogRow[],
  includeStatsColumns: boolean = true
): string {
  if (rows.length === 0) return '';

  // Collect all unique original column headers across all rawRecords in exact order of appearance
  const originalHeaderOrder: string[] = [];
  const headerSet = new Set<string>();

  rows.forEach(row => {
    if (row.rawRecord) {
      Object.keys(row.rawRecord).forEach(key => {
        if (!headerSet.has(key)) {
          headerSet.add(key);
          originalHeaderOrder.push(key);
        }
      });
    }
  });

  // Additional new humanized / audit columns to append
  const newColumns: string[] = ['humanized_content'];
  if (includeStatsColumns) {
    newColumns.push(
      'humanization_status',
      'critic_human_score',
      'original_word_count',
      'humanized_word_count',
      'flesch_reading_score'
    );
  }

  // Complete list of fields: EXACT original columns FIRST, then newly added output columns
  const allFields = [...originalHeaderOrder];
  newColumns.forEach(col => {
    if (!allFields.includes(col)) {
      allFields.push(col);
    }
  });

  const exportData = rows.map(row => {
    const record: Record<string, string> = {};

    // First populate all original fields from rawRecord, updating with humanized version if column was rewritten
    originalHeaderOrder.forEach(col => {
      if (
        row.humanizedColumns &&
        row.humanizedColumns[col] !== undefined &&
        row.humanizedColumns[col].trim().length > 0
      ) {
        record[col] = row.humanizedColumns[col];
      } else if (row.rawRecord && row.rawRecord[col] !== undefined) {
        record[col] = row.rawRecord[col];
      } else {
        record[col] = '';
      }
    });

    // Populate designated humanized_content column (fallback to original if not humanized yet)
    record['humanized_content'] = row.humanizedContent || row.originalContent || '';

    if (includeStatsColumns) {
      record['humanization_status'] = row.status || 'pending';
      record['critic_human_score'] = row.criticResult ? `${row.criticResult.score}%` : '';
      record['original_word_count'] = row.wordCountOriginal !== undefined ? String(row.wordCountOriginal) : '0';
      record['humanized_word_count'] = row.wordCountHumanized !== undefined ? String(row.wordCountHumanized) : '0';
      record['flesch_reading_score'] = row.fleschScoreHumanized !== undefined ? String(row.fleschScoreHumanized) : '0';
    }

    return record;
  });

  return Papa.unparse(
    {
      fields: allFields,
      data: exportData
    },
    {
      quotes: true,
      header: true
    }
  );
}

export interface ValidationReport {
  isValid: boolean;
  originalColumnCount: number;
  exportedColumnCount: number;
  originalHeaders: string[];
  exportedHeaders: string[];
  originalRowCount: number;
  exportedRowCount: number;
  preservedOriginalColumns: boolean;
  preservedOriginalOrder: boolean;
  preservedRowCount: boolean;
  preservedNonHumanizedValues: boolean;
  correctRowMapping: boolean;
  errors: string[];
  warnings: string[];
  validatedAt: string;
}

/**
 * Programmatically validates that the exported CSV maintains 100% data integrity with the original schema:
 * - Checks original column count & presence
 * - Checks original column names & exact order
 * - Checks row count
 * - Checks row-to-result mapping
 * - Checks cell-by-cell preservation of non-humanized columns
 */
export function validateExportedCSV(
  rows: BlogRow[],
  exportedCSVString: string
): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Parse exported CSV string back using PapaParse
  const parseResult = Papa.parse<Record<string, string>>(exportedCSVString, {
    header: true,
    skipEmptyLines: 'greedy'
  });

  const exportedData = parseResult.data || [];
  const exportedHeaders = parseResult.meta.fields || [];

  // Extract original headers from input rows in order
  const originalHeaderSet = new Set<string>();
  const originalHeaders: string[] = [];
  rows.forEach(row => {
    if (row.rawRecord) {
      Object.keys(row.rawRecord).forEach(key => {
        if (!originalHeaderSet.has(key)) {
          originalHeaderSet.add(key);
          originalHeaders.push(key);
        }
      });
    }
  });

  // 1. Validate Row Count
  const preservedRowCount = exportedData.length === rows.length;
  if (!preservedRowCount) {
    errors.push(
      `Row count mismatch: Original dataset has ${rows.length} rows, but exported CSV has ${exportedData.length} rows.`
    );
  }

  // 2. Validate Original Columns Presence
  const missingOriginalColumns = originalHeaders.filter(
    col => !exportedHeaders.includes(col)
  );
  const preservedOriginalColumns = missingOriginalColumns.length === 0;
  if (!preservedOriginalColumns) {
    errors.push(
      `Missing original columns in export (${missingOriginalColumns.length}): ${missingOriginalColumns.join(', ')}`
    );
  }

  // 3. Validate Original Column Order (original headers must appear as prefix of exported headers in exact order)
  let preservedOriginalOrder = true;
  for (let i = 0; i < originalHeaders.length; i++) {
    if (exportedHeaders[i] !== originalHeaders[i]) {
      preservedOriginalOrder = false;
      errors.push(
        `Column order mismatch at index ${i}: Expected original header '${originalHeaders[i]}', but found '${exportedHeaders[i]}'.`
      );
      break;
    }
  }

  // 4. Validate Row-to-Result Mapping & Preservation of Non-Humanized Cell Values
  let preservedNonHumanizedValues = true;
  let correctRowMapping = true;

  exportedData.forEach((expRecord, idx) => {
    const origRow = rows[idx];
    if (!origRow || !origRow.rawRecord) {
      correctRowMapping = false;
      return;
    }

    // Check each original column
    originalHeaders.forEach(col => {
      const wasExplicitlyRewritten =
        origRow.humanizedColumns &&
        origRow.humanizedColumns[col] !== undefined &&
        origRow.humanizedColumns[col].trim().length > 0;

      const origVal = origRow.rawRecord[col] !== undefined ? origRow.rawRecord[col] : '';
      const expVal = expRecord[col] !== undefined ? expRecord[col] : '';

      if (!wasExplicitlyRewritten) {
        if (origVal !== expVal) {
          preservedNonHumanizedValues = false;
          errors.push(
            `Data integrity failure at row ${idx + 1}, column '${col}': Original value '${origVal.substring(0, 15)}...' differs from exported '${expVal.substring(0, 15)}...'.`
          );
        }
      }
    });

    // Verify humanized_content mapping
    if (expRecord['humanized_content'] === undefined) {
      correctRowMapping = false;
      errors.push(`Row ${idx + 1} is missing the required 'humanized_content' column.`);
    }
  });

  const isValid =
    errors.length === 0 &&
    preservedRowCount &&
    preservedOriginalColumns &&
    preservedOriginalOrder &&
    preservedNonHumanizedValues &&
    correctRowMapping;

  return {
    isValid,
    originalColumnCount: originalHeaders.length,
    exportedColumnCount: exportedHeaders.length,
    originalHeaders,
    exportedHeaders,
    originalRowCount: rows.length,
    exportedRowCount: exportedData.length,
    preservedOriginalColumns,
    preservedOriginalOrder,
    preservedRowCount,
    preservedNonHumanizedValues,
    correctRowMapping,
    errors,
    warnings,
    validatedAt: new Date().toISOString()
  };
}

/**
 * Helper to download string content as a file
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string = 'text/csv') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

