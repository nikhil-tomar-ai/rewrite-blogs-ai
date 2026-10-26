import fs from 'fs';
import { parse } from 'csv-parse';
import { ColumnAnalysis } from '../types/models.js';
import { getColumnAnalyzerService, RawColumnDataSample } from './columnAnalyzerService.js';

export interface ParsedHeaderInfo {
  originalHeaders: string[];
  internalHeaders: string[];
  duplicateCount: number;
  emptyHeaderCount: number;
}

export interface StreamingParseResult {
  originalHeaders: string[];
  internalHeaders: string[];
  totalRows: number;
  columns: ColumnAnalysis[];
  rows: Array<{
    rowNumber: number;
    originalData: Record<string, string>;
  }>;
}

export class CsvParserService {
  private static instance: CsvParserService;

  public static getInstance(): CsvParserService {
    if (!CsvParserService.instance) {
      CsvParserService.instance = new CsvParserService();
    }
    return CsvParserService.instance;
  }

  /**
   * Section 12, 13, 14: Resolves headers into deterministic unique internal keys
   * while preserving exact original header names for CSV export.
   */
  public resolveHeaders(rawHeaders: string[]): ParsedHeaderInfo {
    const originalHeaders: string[] = [];
    const internalHeaders: string[] = [];
    const seenNames = new Map<string, number>();
    let duplicateCount = 0;
    let emptyHeaderCount = 0;

    for (let i = 0; i < rawHeaders.length; i++) {
      const raw = rawHeaders[i];
      // Keep exact raw header, even if empty
      const orig = raw === undefined || raw === null ? '' : String(raw);
      originalHeaders.push(orig);

      let internalKey = orig;
      // Section 14: Handle Empty Header Names
      if (!orig || orig.trim() === '') {
        emptyHeaderCount++;
        internalKey = `__unnamed_${i + 1}`;
      }

      // Section 13: Handle Duplicate Column Names
      const count = seenNames.get(internalKey) || 0;
      if (count > 0) {
        duplicateCount++;
        const resolvedKey = `${internalKey}__${count + 1}`;
        seenNames.set(internalKey, count + 1);
        internalHeaders.push(resolvedKey);
      } else {
        seenNames.set(internalKey, 1);
        internalHeaders.push(internalKey);
      }
    }

    return {
      originalHeaders,
      internalHeaders,
      duplicateCount,
      emptyHeaderCount
    };
  }

  /**
   * Section 4 & 19: Streaming-oriented CSV ingestion with Node.js Readable Stream.
   * Handles BOM, quotes, multiline fields, commas inside cells, and Unicode.
   */
  public async parseFile(
    filePath: string,
    onRowBatch?: (batch: Array<{ rowNumber: number; originalData: Record<string, string> }>) => Promise<void>,
    batchSize = 500
  ): Promise<StreamingParseResult> {
    return new Promise((resolve, reject) => {
      let headerInfo: ParsedHeaderInfo | null = null;
      let totalRows = 0;
      let currentBatch: Array<{ rowNumber: number; originalData: Record<string, string> }> = [];
      const allRowsForReturn: Array<{ rowNumber: number; originalData: Record<string, string> }> = [];

      // Collect sample values per column for dynamic analysis (first 1000 rows max to conserve RAM)
      const columnSamples: Map<number, string[]> = new Map();

      const parser = parse({
        bom: true, // Section 10: Automatic UTF-8 BOM removal
        relax_column_count: true, // Section 46: Row/column mismatch handling
        skip_empty_lines: false,
        cast: false, // Section 23: Cell must remain verbatim string without implicit conversion
        trim: false // Section 12: Do not trim internal or cell spaces automatically
      });

      const fileStream = fs.createReadStream(filePath);

      let isFirstRow = true;
      let isPaused = false;

      parser.on('readable', async () => {
        let record: any;
        while ((record = parser.read()) !== null) {
          // 1. Process Header Row
          if (isFirstRow) {
            isFirstRow = false;
            headerInfo = this.resolveHeaders(record);
            for (let i = 0; i < headerInfo.internalHeaders.length; i++) {
              columnSamples.set(i, []);
            }
            continue;
          }

          if (!headerInfo) continue;

          // 2. Process Data Row
          const rowObj: Record<string, string> = {};
          const colCount = headerInfo.internalHeaders.length;

          for (let colIdx = 0; colIdx < colCount; colIdx++) {
            const key = headerInfo.internalHeaders[colIdx];
            // Section 46: If row has fewer fields, default to empty string
            const val = record[colIdx] !== undefined && record[colIdx] !== null ? String(record[colIdx]) : '';
            rowObj[key] = val;

            // Collect samples for analysis (first 500 rows)
            if (totalRows < 500) {
              const samples = columnSamples.get(colIdx);
              if (samples && samples.length < 50 && val.trim().length > 0) {
                samples.push(val);
              }
            }
          }

          // Section 46: If row has extra unexpected columns, store them under extra columns
          if (record.length > colCount) {
            for (let extraIdx = colCount; extraIdx < record.length; extraIdx++) {
              rowObj[`__extra_${extraIdx + 1}`] = String(record[extraIdx]);
            }
          }

          const parsedRow = {
            rowNumber: totalRows,
            originalData: rowObj
          };

          totalRows++;
          currentBatch.push(parsedRow);
          // Keep a preview window of rows
          if (allRowsForReturn.length < 200) {
            allRowsForReturn.push(parsedRow);
          }

          // Trigger streaming batch insertion if callback provided
          if (onRowBatch && currentBatch.length >= batchSize) {
            const batchToFlush = [...currentBatch];
            currentBatch = [];
            parser.pause();
            isPaused = true;
            try {
              await onRowBatch(batchToFlush);
            } catch (batchErr) {
              parser.destroy(batchErr as Error);
              return;
            } finally {
              if (isPaused) {
                isPaused = false;
                parser.resume();
              }
            }
          }
        }
      });

      parser.on('error', (err) => {
        reject(err);
      });

      parser.on('end', async () => {
        try {
          // Flush remaining batch
          if (onRowBatch && currentBatch.length > 0) {
            await onRowBatch(currentBatch);
          }

          if (!headerInfo || headerInfo.originalHeaders.length === 0) {
            return reject(new Error('CSV file contains no headers or is empty.'));
          }

          // Perform Column Analysis
          const analyzer = getColumnAnalyzerService();
          const columns: ColumnAnalysis[] = [];

          for (let i = 0; i < headerInfo.internalHeaders.length; i++) {
            const internalName = headerInfo.internalHeaders[i];
            const originalName = headerInfo.originalHeaders[i];
            const samples = columnSamples.get(i) || [];

            const colSample: RawColumnDataSample = {
              index: i,
              internalName,
              originalName,
              values: samples,
              totalRows
            };

            columns.push(analyzer.analyzeColumn(colSample));
          }

          resolve({
            originalHeaders: headerInfo.originalHeaders,
            internalHeaders: headerInfo.internalHeaders,
            totalRows,
            columns,
            rows: allRowsForReturn
          });
        } catch (postErr) {
          reject(postErr);
        }
      });

      fileStream.pipe(parser);
    });
  }
}

export const getCsvParserService = () => CsvParserService.getInstance();
