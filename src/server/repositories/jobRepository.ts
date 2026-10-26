import { ProcessingJob, JobStatus } from '../types/models.js';
import { getLocalDb, LocalJobRecord } from '../db/database.js';

export interface IJobRepository {
  create(job: ProcessingJob): Promise<ProcessingJob>;
  findById(id: string): Promise<ProcessingJob | null>;
  findByDatasetId(datasetId: string): Promise<ProcessingJob[]>;
  findAll(): Promise<ProcessingJob[]>;
  update(id: string, updates: Partial<ProcessingJob>): Promise<ProcessingJob | null>;
  updateStatus(id: string, status: JobStatus, errorMessage?: string): Promise<void>;
  updateProgress(id: string, completedRows: number, successfulRows: number, failedRows: number, currentBatch: number): Promise<void>;
}

export class LocalJobRepository implements IJobRepository {
  private static instance: LocalJobRepository;
  private jobs: Map<string, ProcessingJob> = new Map();

  private constructor() {
    this.hydrateFromDb();
  }

  public static getInstance(): LocalJobRepository {
    if (!LocalJobRepository.instance) {
      LocalJobRepository.instance = new LocalJobRepository();
    }
    return LocalJobRepository.instance;
  }

  private hydrateFromDb(): void {
    const db = getLocalDb();
    const records = db.listJobs();
    for (const r of records) {
      this.jobs.set(r.id, {
        id: r.id,
        datasetId: r.filename,
        status: (r.status.toUpperCase() as JobStatus) || 'CREATED',
        totalRows: r.totalRows || 0,
        completedRows: r.completedRows || 0,
        successfulRows: r.successfulRows || 0,
        failedRows: r.failedRows || 0,
        currentBatch: 0,
        totalBatches: Math.ceil((r.totalRows || 1) / 10),
        config: r.config as any,
        startedAt: r.createdAt,
        completedAt: r.status === 'completed' ? r.updatedAt : undefined,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      });
    }
  }

  public async create(job: ProcessingJob): Promise<ProcessingJob> {
    this.jobs.set(job.id, job);
    const db = getLocalDb();
    const record: LocalJobRecord = {
      id: job.id,
      filename: job.datasetId,
      status: job.status.toLowerCase() as any,
      totalRows: job.totalRows,
      completedRows: job.completedRows,
      successfulRows: job.successfulRows,
      failedRows: job.failedRows,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      config: job.config,
      rows: [],
      auditLogs: []
    };
    db.createJob(record);
    return job;
  }

  public async findById(id: string): Promise<ProcessingJob | null> {
    return this.jobs.get(id) || null;
  }

  public async findByDatasetId(datasetId: string): Promise<ProcessingJob[]> {
    return Array.from(this.jobs.values()).filter((j) => j.datasetId === datasetId);
  }

  public async findAll(): Promise<ProcessingJob[]> {
    return Array.from(this.jobs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public async update(id: string, updates: Partial<ProcessingJob>): Promise<ProcessingJob | null> {
    const existing = this.jobs.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.jobs.set(id, updated);
    return updated;
  }

  public async updateStatus(id: string, status: JobStatus, errorMessage?: string): Promise<void> {
    const job = this.jobs.get(id);
    if (job) {
      job.status = status;
      if (errorMessage) job.errorMessage = errorMessage;
      job.updatedAt = new Date().toISOString();
      if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
        job.completedAt = job.updatedAt;
      }
      this.jobs.set(id, job);

      const db = getLocalDb();
      db.updateJob(id, { status: status.toLowerCase() as any });
    }
  }

  public async updateProgress(
    id: string,
    completedRows: number,
    successfulRows: number,
    failedRows: number,
    currentBatch: number
  ): Promise<void> {
    const job = this.jobs.get(id);
    if (job) {
      job.completedRows = completedRows;
      job.successfulRows = successfulRows;
      job.failedRows = failedRows;
      job.currentBatch = currentBatch;
      job.updatedAt = new Date().toISOString();
      this.jobs.set(id, job);

      const db = getLocalDb();
      db.updateJob(id, { completedRows, successfulRows, failedRows });
    }
  }
}

export const getJobRepository = () => LocalJobRepository.getInstance();
