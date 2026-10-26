import crypto from 'crypto';
import fs from 'fs';
import { Dataset, ProcessingRow } from '../types/models.js';
import { getDatasetRepository } from '../repositories/datasetRepository.js';
import { getCsvParserService } from './csvParserService.js';
import { sanitizeUploadedFile } from '../utils/fileSanitizer.js';

export interface IngestCsvInput {
  clientFilename: string;
  tempFilePath: string;
  fileSize: number;
}

export class DatasetService {
  private static instance: DatasetService;

  public static getInstance(): DatasetService {
    if (!DatasetService.instance) {
      DatasetService.instance = new DatasetService();
    }
    return DatasetService.instance;
  }

  /**
   * Section 5, 20, 21, 45: Complete transactional CSV ingestion and analysis pipeline
   */
  public async ingestCsvFile(input: IngestCsvInput): Promise<Dataset> {
    const { clientFilename, tempFilePath, fileSize } = input;
    const sanitized = sanitizeUploadedFile(clientFilename);
    const datasetId = `ds_${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`;
    const repository = getDatasetRepository();

    // 1. Move/Save the file to permanent storage location
    fs.copyFileSync(tempFilePath, sanitized.storedFilePath);

    // 2. Initialize dataset record in UPLOADING state
    const dataset: Dataset = {
      id: datasetId,
      fileName: sanitized.storedFileName,
      originalFileName: sanitized.originalFileName,
      fileSize,
      totalRows: 0,
      totalColumns: 0,
      columns: [],
      originalHeaders: [],
      status: 'UPLOADING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await repository.create(dataset);

    try {
      // 3. Update status to ANALYZING
      await repository.update(datasetId, { status: 'ANALYZING' });

      // 4. Stream and Parse CSV with batch inserts
      const parser = getCsvParserService();
      let insertedRowCount = 0;

      const parseResult = await parser.parseFile(
        sanitized.storedFilePath,
        async (batch) => {
          const rowRecords: ProcessingRow[] = batch.map((item) => ({
            id: `row_${datasetId}_${item.rowNumber}`,
            datasetId,
            rowNumber: item.rowNumber,
            originalData: item.originalData,
            status: 'PENDING',
            retryCount: 0,
            originalWordCount: Object.values(item.originalData)
              .join(' ')
              .trim()
              .split(/\s+/).length,
            transformedWordCount: 0,
            wordCountDiff: 0,
            processingTimeMs: 0
          }));

          await repository.appendRows(datasetId, rowRecords);
          insertedRowCount += rowRecords.length;
        },
        500 // Batch insert size
      );

      // 5. Section 45: Data Integrity Validation
      const totalStoredRows = await repository.getRowCount(datasetId);

      if (totalStoredRows !== parseResult.totalRows) {
        throw new Error(
          `Data integrity violation: parsed ${parseResult.totalRows} rows but stored ${totalStoredRows} rows.`
        );
      }

      if (parseResult.columns.length === 0) {
        throw new Error('Data integrity violation: dataset has 0 columns.');
      }

      // 6. Finalize Dataset in READY state
      const finalDataset = await repository.update(datasetId, {
        status: 'READY',
        totalRows: parseResult.totalRows,
        totalColumns: parseResult.columns.length,
        originalHeaders: parseResult.originalHeaders,
        columns: parseResult.columns
      });

      if (!finalDataset) {
        throw new Error('Failed to retrieve updated dataset.');
      }

      return finalDataset;
    } catch (err: any) {
      // Section 21: Mark FAILED on any parse or integrity error
      await repository.update(datasetId, {
        status: 'FAILED',
        errorMessage: err.message || 'Dataset ingestion failed'
      });
      throw err;
    }
  }

  public async getDataset(id: string): Promise<Dataset | null> {
    return getDatasetRepository().findById(id);
  }

  public async listDatasets(): Promise<Dataset[]> {
    return getDatasetRepository().findAll();
  }

  public async getDatasetRows(
    datasetId: string,
    page = 1,
    pageSize = 50
  ): Promise<{
    rows: ProcessingRow[];
    pagination: {
      page: number;
      pageSize: number;
      totalRows: number;
      totalPages: number;
    };
  }> {
    const repository = getDatasetRepository();
    const dataset = await repository.findById(datasetId);
    if (!dataset) {
      throw new Error(`Dataset not found: ${datasetId}`);
    }

    const totalRows = dataset.totalRows;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    const safePage = Math.max(1, Math.min(page, totalPages));
    const offset = (safePage - 1) * pageSize;

    const rows = await repository.getRows(datasetId, pageSize, offset);

    return {
      rows,
      pagination: {
        page: safePage,
        pageSize,
        totalRows,
        totalPages
      }
    };
  }
}

export const getDatasetService = () => DatasetService.getInstance();
