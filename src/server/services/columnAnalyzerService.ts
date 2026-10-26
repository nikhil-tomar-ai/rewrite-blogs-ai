import { ColumnAnalysis, ColumnDataType } from '../types/models.js';

export interface RawColumnDataSample {
  index: number;
  internalName: string;
  originalName: string;
  values: string[];
  totalRows: number;
}

export class ColumnAnalyzerService {
  private static instance: ColumnAnalyzerService;

  public static getInstance(): ColumnAnalyzerService {
    if (!ColumnAnalyzerService.instance) {
      ColumnAnalyzerService.instance = new ColumnAnalyzerService();
    }
    return ColumnAnalyzerService.instance;
  }

  /**
   * Section 24: URL Detection
   */
  public isUrl(val: string): boolean {
    const trimmed = val.trim();
    if (!trimmed) return false;
    return /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(trimmed);
  }

  /**
   * Section 25: Identifier Detection
   */
  public isIdentifier(name: string, sampleValues: string[]): boolean {
    const lowerName = name.toLowerCase().trim();
    // Common ID column names
    const idPatterns = [
      /^id$/,
      /_id$/,
      /^id_/,
      /^identifier$/,
      /^record_?id$/,
      /^blog_?id$/,
      /^post_?id$/,
      /^uuid$/,
      /^guid$/,
      /^sku$/,
      /^key$/
    ];
    if (idPatterns.some((p) => p.test(lowerName))) return true;

    // Check if samples look like UUIDs or strictly sequential short IDs
    const nonEmpty = sampleValues.filter((v) => v && v.trim().length > 0);
    if (nonEmpty.length > 0) {
      const isAllUuid = nonEmpty.every((v) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.trim())
      );
      if (isAllUuid) return true;
    }

    return false;
  }

  /**
   * Section 26: Date Detection
   */
  public isDate(val: string): boolean {
    const trimmed = val.trim();
    if (!trimmed || trimmed.length < 6) return false;
    // Common date patterns
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/;
    const slashDatePattern = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;
    if (isoDatePattern.test(trimmed) || slashDatePattern.test(trimmed)) {
      const d = Date.parse(trimmed);
      return !isNaN(d);
    }
    return false;
  }

  /**
   * Section 23: Data Type Detection
   */
  public inferDataType(name: string, values: string[]): ColumnDataType {
    const nonEmpty = values.filter((v) => v !== null && v !== undefined && v.trim().length > 0);
    if (nonEmpty.length === 0) return 'UNKNOWN';

    // 1. URL Check
    const urlCount = nonEmpty.filter((v) => this.isUrl(v)).length;
    if (urlCount / nonEmpty.length >= 0.7) {
      return 'URL';
    }

    // 2. Boolean Check
    const isBool = nonEmpty.every((v) => {
      const l = v.trim().toLowerCase();
      return l === 'true' || l === 'false' || l === 'yes' || l === 'no' || l === '1' || l === '0';
    });
    if (isBool && nonEmpty.length > 0) return 'BOOLEAN';

    // 3. Integer Check
    const isInt = nonEmpty.every((v) => /^-?\d+$/.test(v.trim()));
    if (isInt) return 'INTEGER';

    // 4. Decimal Check
    const isDec = nonEmpty.every((v) => /^-?\d*\.\d+$/.test(v.trim()));
    if (isDec) return 'DECIMAL';

    // 5. Date Check
    const dateCount = nonEmpty.filter((v) => this.isDate(v)).length;
    if (dateCount / nonEmpty.length >= 0.7) {
      return 'DATE';
    }

    // 6. JSON Check
    const isJson = nonEmpty.every((v) => {
      const t = v.trim();
      if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
        try {
          JSON.parse(t);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    });
    if (isJson) return 'JSON';

    // 7. Long Text Check
    const totalChars = nonEmpty.reduce((acc, v) => acc + v.length, 0);
    const avgLen = totalChars / nonEmpty.length;
    const hasMultilines = nonEmpty.some((v) => v.includes('\n'));
    if (avgLen > 150 || (avgLen > 60 && hasMultilines)) {
      return 'LONG_TEXT';
    }

    return 'STRING';
  }

  /**
   * Section 28 & 29: Deterministic Content Scoring & Human-Readable Reason
   */
  public calculateContentScore(
    name: string,
    inferredType: ColumnDataType,
    avgLength: number,
    maxLength: number,
    sampleValues: string[],
    isId: boolean
  ): { score: number; recommended: boolean; reason: string } {
    const lowerName = name.toLowerCase().trim();

    // Exclude Identifiers
    if (isId) {
      return {
        score: 0.01,
        recommended: false,
        reason: 'Detected as identifier or ID column; excluded from AI processing to preserve data integrity.'
      };
    }

    // Exclude URLs
    if (inferredType === 'URL' || /url|link|permalink|href|website|domain/i.test(lowerName)) {
      return {
        score: 0.02,
        recommended: false,
        reason: 'Detected as URL or hyperlink column; excluded from AI processing by default.'
      };
    }

    // Exclude Dates & Booleans
    if (inferredType === 'DATE' || inferredType === 'DATETIME') {
      return {
        score: 0.03,
        recommended: false,
        reason: 'Detected as date/timestamp column; excluded from editorial rewriting.'
      };
    }
    if (inferredType === 'BOOLEAN') {
      return {
        score: 0.02,
        recommended: false,
        reason: 'Detected as boolean flag column; excluded from editorial rewriting.'
      };
    }
    if (inferredType === 'INTEGER' || inferredType === 'DECIMAL' || inferredType === 'NUMBER') {
      return {
        score: 0.05,
        recommended: false,
        reason: 'Detected as numeric data; excluded from editorial rewriting.'
      };
    }

    // Known metadata names to exclude
    if (/status|slug|author|created|updated|published|category|tags?|locale|lang/i.test(lowerName)) {
      return {
        score: 0.15,
        recommended: false,
        reason: `Detected as metadata (${lowerName}); excluded from primary article rewriting by default.`
      };
    }

    let score = 0.4; // Base score for strings

    // Header Signal Boost
    if (/content|body|article|main_?content|post_?content|text|entry/i.test(lowerName)) {
      score += 0.35;
    } else if (/title|heading|headline|subject/i.test(lowerName)) {
      score += 0.3;
    } else if (/description|summary|excerpt|intro|conclusion|overview/i.test(lowerName)) {
      score += 0.25;
    }

    // Length Boost
    if (avgLength > 200) {
      score += 0.2;
    } else if (avgLength > 60) {
      score += 0.1;
    } else if (avgLength < 15 && maxLength < 30) {
      score -= 0.2;
    }

    // Multiline / Paragraph Density
    const hasNewlines = sampleValues.some((v) => v && v.includes('\n'));
    if (hasNewlines) {
      score += 0.1;
    }

    // Clamp score between 0.0 and 1.0
    const clampedScore = Math.max(0.01, Math.min(0.99, Math.round(score * 100) / 100));
    const recommended = clampedScore >= 0.55;

    let reason = '';
    if (inferredType === 'LONG_TEXT' && hasNewlines) {
      reason = 'Long-form text with multiple paragraphs; prime candidate for article humanization.';
    } else if (inferredType === 'LONG_TEXT') {
      reason = 'Substantial textual content; recommended for humanization and editorial polish.';
    } else if (/title|headline/i.test(lowerName)) {
      reason = 'Identified as title/headline; recommended for catchy humanized refinement.';
    } else if (/description|summary|excerpt/i.test(lowerName)) {
      reason = 'Identified as description or excerpt; recommended for conversational polish.';
    } else if (recommended) {
      reason = 'Text content with good sentence structure; suitable for processing.';
    } else {
      reason = 'Short text or secondary field; not recommended for primary processing.';
    }

    return { score: clampedScore, recommended, reason };
  }

  /**
   * Section 22: Analyzes raw column sample data and produces full ColumnAnalysis
   */
  public analyzeColumn(sample: RawColumnDataSample): ColumnAnalysis {
    const { index, internalName, originalName, values, totalRows } = sample;

    const totalValues = totalRows;
    const nonEmptyValues = values.filter((v) => v !== null && v !== undefined && String(v).trim().length > 0).length;
    const emptyValues = totalValues - nonEmptyValues;
    const emptyPercentage = totalValues > 0 ? Math.round((emptyValues / totalValues) * 1000) / 10 : 0;

    const stringValues = values.map((v) => (v !== null && v !== undefined ? String(v) : ''));
    const lengths = stringValues.map((v) => v.length);
    const totalChars = lengths.reduce((acc, l) => acc + l, 0);
    const averageLength = nonEmptyValues > 0 ? Math.round(totalChars / nonEmptyValues) : 0;
    const maxLength = lengths.length > 0 ? Math.max(...lengths) : 0;

    // Up to 5 representative samples
    const sampleValues = stringValues
      .filter((v) => v.trim().length > 0)
      .slice(0, 5);

    const inferredType = this.inferDataType(originalName, stringValues);
    const isId = this.isIdentifier(originalName, stringValues);

    const { score, recommended, reason } = this.calculateContentScore(
      originalName,
      inferredType,
      averageLength,
      maxLength,
      sampleValues,
      isId
    );

    return {
      index,
      name: internalName,
      originalName,
      inferredType,
      totalValues,
      nonEmptyValues,
      emptyValues,
      emptyPercentage,
      averageLength,
      maxLength,
      sampleValues,
      contentScore: score,
      recommendedForProcessing: recommended,
      reason,
      // Backward compatibility fields
      dataType: inferredType,
      nonEmptyCount: nonEmptyValues,
      emptyCount: emptyValues,
      suggestedContentType: recommended
        ? averageLength > 200
          ? 'main_content'
          : /title/i.test(originalName)
          ? 'blog_title'
          : 'generic_text'
        : 'metadata_skip',
      isLocked: isId || inferredType === 'URL',
      isPotentialContent: recommended
    };
  }
}

export const getColumnAnalyzerService = () => ColumnAnalyzerService.getInstance();
