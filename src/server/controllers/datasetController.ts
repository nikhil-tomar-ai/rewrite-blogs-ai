import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import config from '../config/index.js';
import { getDatasetService } from '../services/datasetService.js';
import { isCsvFile, ensureStorageDirectoriesExist } from '../utils/fileSanitizer.js';

const router = Router();

ensureStorageDirectoriesExist();

// Section 8: File Size Limit via Multer configuration reading config.maxFileSizeMb
const maxBytes = config.maxFileSizeMb * 1024 * 1024;

const upload = multer({
  dest: config.tempDir,
  limits: {
    fileSize: maxBytes
  },
  fileFilter: (_req, file, cb) => {
    if (isCsvFile(file.originalname, file.mimetype)) {
      cb(null, true);
    } else {
      const err: any = new Error('Only CSV files are accepted.');
      err.code = 'INVALID_FILE_TYPE';
      cb(err, false);
    }
  }
});

/**
 * Custom Multer Error Handling Middleware
 */
function handleUploadErrors(err: any, _req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `The uploaded file exceeds the configured maximum size of ${config.maxFileSizeMb}MB.`,
          details: {
            maxSizeMb: config.maxFileSizeMb
          }
        }
      });
    }
    return res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: err.message
      }
    });
  }

  if (err && err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: 'Only CSV files (.csv) are accepted.'
      }
    });
  }

  if (err) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err.message
      }
    });
  }

  next();
}

/**
 * POST /api/datasets/upload
 * Section 5: Multipart CSV file ingestion with streaming parser and column analysis.
 */
router.post(
  '/upload',
  upload.single('file'),
  handleUploadErrors,
  async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMPTY_FILE',
          message: 'No CSV file was uploaded. Please provide a file under the "file" form field.'
        }
      });
    }

    try {
      const datasetService = getDatasetService();
      const dataset = await datasetService.ingestCsvFile({
        clientFilename: file.originalname,
        tempFilePath: file.path,
        fileSize: file.size
      });

      // Clean up temporary upload chunk
      if (fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch {
          // Ignore temp cleanup error
        }
      }

      // Section 36: Standard Upload API response
      return res.status(201).json({
        success: true,
        data: {
          datasetId: dataset.id,
          fileName: dataset.originalFileName,
          totalRows: dataset.totalRows,
          totalColumns: dataset.totalColumns,
          status: dataset.status
        }
      });
    } catch (error: any) {
      // Clean up temp file
      if (file && file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch {}
      }

      console.error('Dataset ingestion failed:', error);
      return res.status(400).json({
        success: false,
        error: {
          code: 'DATASET_INGESTION_FAILED',
          message: error.message || 'Failed to ingest and parse CSV dataset.'
        }
      });
    }
  }
);

/**
 * GET /api/datasets
 * Section 35: Dataset list API with pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 20;

    const datasetService = getDatasetService();
    const allDatasets = await datasetService.listDatasets();

    const total = allDatasets.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const offset = (page - 1) * pageSize;
    const paginated = allDatasets.slice(offset, offset + pageSize);

    return res.json({
      success: true,
      data: {
        datasets: paginated.map((d) => ({
          id: d.id,
          fileName: d.originalFileName,
          fileSize: d.fileSize,
          totalRows: d.totalRows,
          totalColumns: d.totalColumns,
          status: d.status,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt
        })),
        pagination: {
          page,
          pageSize,
          total,
          totalPages
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/datasets/:datasetId
 * Section 34: Dataset Details API
 */
router.get('/:datasetId', async (req: Request, res: Response) => {
  try {
    const { datasetId } = req.params;
    const datasetService = getDatasetService();
    const dataset = await datasetService.getDataset(datasetId);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DATASET_NOT_FOUND',
          message: `Dataset with ID ${datasetId} was not found.`
        }
      });
    }

    return res.json({
      success: true,
      data: {
        id: dataset.id,
        originalFileName: dataset.originalFileName,
        storedFileName: dataset.fileName,
        fileSize: dataset.fileSize,
        totalRows: dataset.totalRows,
        totalColumns: dataset.totalColumns,
        status: dataset.status,
        errorMessage: dataset.errorMessage,
        createdAt: dataset.createdAt,
        updatedAt: dataset.updatedAt
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/datasets/:datasetId/columns
 * Section 33: Column Metadata API
 */
router.get('/:datasetId/columns', async (req: Request, res: Response) => {
  try {
    const { datasetId } = req.params;
    const datasetService = getDatasetService();
    const dataset = await datasetService.getDataset(datasetId);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DATASET_NOT_FOUND',
          message: `Dataset with ID ${datasetId} was not found.`
        }
      });
    }

    return res.json({
      success: true,
      data: {
        datasetId: dataset.id,
        totalColumns: dataset.totalColumns,
        columns: dataset.columns
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/datasets/:datasetId/rows
 * Section 32: Dataset Preview API with pagination (default 50 rows)
 */
router.get('/:datasetId/rows', async (req: Request, res: Response) => {
  try {
    const { datasetId } = req.params;
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 50;

    const datasetService = getDatasetService();
    const result = await datasetService.getDatasetRows(datasetId, page, pageSize);

    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DATASET_NOT_FOUND',
          message: error.message
        }
      });
    }
    return res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error.message
      }
    });
  }
});

export default router;
