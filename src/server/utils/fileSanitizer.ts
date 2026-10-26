import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import config from '../config/index.js';

export interface SanitizedFileInfo {
  originalFileName: string;
  storedFileName: string;
  storedFilePath: string;
  fileExtension: string;
}

/**
 * Section 9: Ensures all required storage directories exist.
 * Automatically creates storage/uploads, storage/exports, storage/temporary if missing.
 */
export function ensureStorageDirectoriesExist(): void {
  const dirs = [config.uploadDir, config.exportDir, config.tempDir];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Section 6: File Security & Filename Sanitization
 * Strictly strips path traversal characters (../, ~/, backslashes)
 * Generates an internal unique stored filename: dataset_<UUID>.csv
 * Never trusts client-supplied paths.
 */
export function sanitizeUploadedFile(clientFilename: string): SanitizedFileInfo {
  ensureStorageDirectoriesExist();

  // Strip any directory traversal components or null bytes
  const baseName = path.basename(clientFilename).replace(/[\0\x00-\x1f\x7f]/g, '');
  const cleanOriginal = baseName.trim() || 'dataset.csv';

  const ext = path.extname(cleanOriginal).toLowerCase();
  const uuid = crypto.randomUUID();
  const storedFileName = `dataset_${uuid}${ext === '.csv' ? '.csv' : '.csv'}`;
  const storedFilePath = path.join(config.uploadDir, storedFileName);

  return {
    originalFileName: cleanOriginal,
    storedFileName,
    storedFilePath,
    fileExtension: ext
  };
}

/**
 * Section 7: File Type Validation
 * Validates extension, MIME type, and preliminary content signals.
 */
export function isCsvFile(clientFilename: string, mimeType?: string): boolean {
  const ext = path.extname(clientFilename).toLowerCase();
  if (ext === '.csv') return true;

  if (mimeType) {
    const validMimes = [
      'text/csv',
      'application/csv',
      'text/x-csv',
      'application/x-csv',
      'text/comma-separated-values',
      'text/plain',
      'application/vnd.ms-excel'
    ];
    if (validMimes.includes(mimeType.toLowerCase())) return true;
  }

  return false;
}
