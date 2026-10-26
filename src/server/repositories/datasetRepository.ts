import { Dataset, ProcessingRow } from '../types/models.js';
import { getLocalDb } from '../db/database.js';

export interface IDatasetRepository {
  create(dataset: Dataset): Promise<Dataset>;
  findById(id: string): Promise<Dataset | null>;
  findAll(): Promise<Dataset[]>;
  update(id: string, updates: Partial<Dataset>): Promise<Dataset | null>;
  delete(id: string): Promise<boolean>;
  saveRows(datasetId: string, rows: ProcessingRow[]): Promise<void>;
  appendRows(datasetId: string, rows: ProcessingRow[]): Promise<void>;
  getRows(datasetId: string, limit?: number, offset?: number): Promise<ProcessingRow[]>;
  getRowCount(datasetId: string): Promise<number>;
  getRowByNumber(datasetId: string, rowNumber: number): Promise<ProcessingRow | null>;
  updateRow(rowId: string, updates: Partial<ProcessingRow>): Promise<void>;
}

export class LocalDatasetRepository implements IDatasetRepository {
  private static instance: LocalDatasetRepository;
  private datasets: Map<string, Dataset> = new Map();
  private rowsByDataset: Map<string, ProcessingRow[]> = new Map();

  private constructor() {
    this.hydrateFromDb();
  }

  public static getInstance(): LocalDatasetRepository {
    if (!LocalDatasetRepository.instance) {
      LocalDatasetRepository.instance = new LocalDatasetRepository();
    }
    return LocalDatasetRepository.instance;
  }

  private hydrateFromDb(): void {
    const db = getLocalDb();
    const uploads = db.listUploads();
    for (const u of uploads) {
      this.datasets.set(u.id, {
        id: u.id,
        fileName: u.filename,
        originalFileName: u.filename,
        fileSize: 0,
        totalRows: u.totalRows || 0,
        totalColumns: u.headers?.length || 0,
        columns: (u.headers || []).map((h: string, idx: number) => ({
          name: h,
          originalName: h,
          index: idx,
          inferredType: 'STRING',
          totalValues: u.totalRows || 0,
          nonEmptyValues: u.totalRows || 0,
          emptyValues: 0,
          emptyPercentage: 0,
          averageLength: 50,
          maxLength: 100,
          sampleValues: [],
          contentScore: 0.5,
          recommendedForProcessing: true,
          reason: 'Initial uploaded column',
          dataType: 'STRING',
          nonEmptyCount: u.totalRows || 0,
          emptyCount: 0,
          suggestedContentType: 'generic_text',
          isPotentialContent: true,
          isLocked: false
        })),
        originalHeaders: u.headers || [],
        status: 'READY',
        createdAt: u.createdAt || new Date().toISOString(),
        updatedAt: u.createdAt || new Date().toISOString()
      });
    }
  }

  public async create(dataset: Dataset): Promise<Dataset> {
    this.datasets.set(dataset.id, dataset);
    const db = getLocalDb();
    db.saveUpload(dataset.id, {
      filename: dataset.originalFileName,
      originalPath: dataset.fileName,
      headers: dataset.originalHeaders,
      totalRows: dataset.totalRows
    });
    return dataset;
  }

  public async findById(id: string): Promise<Dataset | null> {
    return this.datasets.get(id) || null;
  }

  public async findAll(): Promise<Dataset[]> {
    return Array.from(this.datasets.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public async update(id: string, updates: Partial<Dataset>): Promise<Dataset | null> {
    const existing = this.datasets.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.datasets.set(id, updated);
    return updated;
  }

  public async delete(id: string): Promise<boolean> {
    this.rowsByDataset.delete(id);
    return this.datasets.delete(id);
  }

  public async saveRows(datasetId: string, rows: ProcessingRow[]): Promise<void> {
    this.rowsByDataset.set(datasetId, rows);
  }

  public async appendRows(datasetId: string, rows: ProcessingRow[]): Promise<void> {
    const existing = this.rowsByDataset.get(datasetId) || [];
    existing.push(...rows);
    this.rowsByDataset.set(datasetId, existing);
  }

  public async getRows(datasetId: string, limit = 100, offset = 0): Promise<ProcessingRow[]> {
    const rows = this.rowsByDataset.get(datasetId) || [];
    return rows.slice(offset, offset + limit);
  }

  public async getRowCount(datasetId: string): Promise<number> {
    const rows = this.rowsByDataset.get(datasetId) || [];
    return rows.length;
  }

  public async getRowByNumber(datasetId: string, rowNumber: number): Promise<ProcessingRow | null> {
    const rows = this.rowsByDataset.get(datasetId) || [];
    return rows.find((r) => r.rowNumber === rowNumber) || null;
  }

  public async updateRow(rowId: string, updates: Partial<ProcessingRow>): Promise<void> {
    for (const [_, rows] of this.rowsByDataset.entries()) {
      const idx = rows.findIndex((r) => r.id === rowId);
      if (idx !== -1) {
        rows[idx] = { ...rows[idx], ...updates };
        break;
      }
    }
  }
}

export const getDatasetRepository = () => LocalDatasetRepository.getInstance();
