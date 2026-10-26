import { ColumnAnalysis, DatasetStatus, ProcessingRow } from '../server/types/models';

export interface DatasetSummary {
  id: string;
  fileName: string;
  fileSize: number;
  totalRows: number;
  totalColumns: number;
  status: DatasetStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UploadDatasetResult {
  datasetId: string;
  fileName: string;
  totalRows: number;
  totalColumns: number;
  status: DatasetStatus;
}

export interface PaginatedRowsResult {
  rows: ProcessingRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalRows: number;
    totalPages: number;
  };
}

export interface DatasetDetailsResult extends DatasetSummary {
  originalFileName: string;
  storedFileName: string;
  errorMessage?: string;
}

export interface ColumnAnalysisResult {
  datasetId: string;
  totalColumns: number;
  columns: ColumnAnalysis[];
}

/**
 * Section 42: Centralized API Client
 * Encapsulates all backend HTTP communication, status validation, and error normalization.
 */
class ApiClient {
  private baseUrl = '/api';

  private async handleResponse<T>(res: Response): Promise<T> {
    const json = await res.json();
    if (!res.ok || json.success === false) {
      const err = json.error || {
        code: 'REQUEST_FAILED',
        message: json.message || `Request failed with status ${res.status}`
      };
      const errorObj: any = new Error(err.message);
      errorObj.code = err.code;
      errorObj.details = err.details;
      throw errorObj;
    }
    return json.data as T;
  }

  /**
   * Section 5: Multipart File Upload with native XMLHttpRequest for progress tracking
   */
  public async uploadDataset(
    file: File,
    onProgress?: (progressPercent: number) => void
  ): Promise<UploadDatasetResult> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${this.baseUrl}/datasets/upload`);

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && json.success) {
            resolve(json.data);
          } else {
            const err = json.error || {
              code: 'UPLOAD_FAILED',
              message: json.message || `Upload failed with status ${xhr.status}`
            };
            const errorObj: any = new Error(err.message);
            errorObj.code = err.code;
            errorObj.details = err.details;
            reject(errorObj);
          }
        } catch {
          reject(new Error(`Invalid response from server (Status ${xhr.status})`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error occurred during upload.'));
      };

      const formData = new FormData();
      formData.append('file', file);
      xhr.send(formData);
    });
  }

  public async getDatasets(page = 1, pageSize = 20): Promise<{
    datasets: DatasetSummary[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  }> {
    const res = await fetch(`${this.baseUrl}/datasets?page=${page}&pageSize=${pageSize}`);
    return this.handleResponse(res);
  }

  public async getDataset(datasetId: string): Promise<DatasetDetailsResult> {
    const res = await fetch(`${this.baseUrl}/datasets/${datasetId}`);
    return this.handleResponse(res);
  }

  public async getDatasetColumns(datasetId: string): Promise<ColumnAnalysisResult> {
    const res = await fetch(`${this.baseUrl}/datasets/${datasetId}/columns`);
    return this.handleResponse(res);
  }

  public async getDatasetRows(
    datasetId: string,
    page = 1,
    pageSize = 50
  ): Promise<PaginatedRowsResult> {
    const res = await fetch(
      `${this.baseUrl}/datasets/${datasetId}/rows?page=${page}&pageSize=${pageSize}`
    );
    return this.handleResponse(res);
  }

  public async humanizeDocument(params: {
    title: string;
    content: string;
    tone?: string;
    customPrompt?: string;
    intensity?: 'light' | 'balanced' | 'deep';
    temperature?: number;
    preserveKeywords?: string[];
  }): Promise<{
    success: boolean;
    title: string;
    humanizedMarkdown: string;
    modelUsed: string;
    providerUsed: string;
    timestamp: string;
  }> {
    const res = await fetch(`${this.baseUrl}/humanize-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Document humanization failed with status ${res.status}`);
    }
    return res.json();
  }

  public async humanizeDocumentSection(params: {
    sectionHeading: string;
    sectionLevel: number;
    content: string;
    documentTitle: string;
    tone?: string;
    customPrompt?: string;
    intensity?: 'light' | 'balanced' | 'deep';
    temperature?: number;
    preserveKeywords?: string[];
  }): Promise<{
    success: boolean;
    sectionHeading: string;
    humanizedContent: string;
    modelUsed: string;
    providerUsed: string;
  }> {
    const res = await fetch(`${this.baseUrl}/humanize-document-section`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Section humanization failed with status ${res.status}`);
    }
    return res.json();
  }
}

export const api = new ApiClient();

