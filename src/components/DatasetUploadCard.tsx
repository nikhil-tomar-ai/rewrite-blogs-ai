import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { api, UploadDatasetResult } from '../services/api';

interface DatasetUploadCardProps {
  onUploadSuccess: (result: UploadDatasetResult) => void;
  maxFileSizeMb?: number;
}

export const DatasetUploadCard: React.FC<DatasetUploadCardProps> = ({
  onUploadSuccess,
  maxFileSizeMb = 500
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUploaded, setLastUploaded] = useState<UploadDatasetResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (file: File) => {
    setErrorMessage(null);
    setLastUploaded(null);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv') {
      setErrorMessage('Invalid file format. Please upload a standard CSV (.csv) file.');
      setSelectedFile(null);
      return;
    }

    const maxBytes = maxFileSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMessage(`File size (${formatBytes(file.size)}) exceeds the maximum limit of ${maxFileSizeMb} MB.`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage(null);

    try {
      const result = await api.uploadDataset(selectedFile, (progress) => {
        setUploadProgress(progress);
      });

      setLastUploaded(result);
      setSelectedFile(null);
      onUploadSuccess(result);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMessage(err.message || 'CSV streaming failed. Verify that your file is formatted correctly.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#15181e] border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Upload & Ingest CSV Dataset
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Streaming parser preserves 100% of original headers, row order, and multiline content.
          </p>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 w-fit">
          Max {maxFileSizeMb} MB · UTF-8
        </span>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
            : selectedFile
            ? 'border-indigo-400 dark:border-indigo-600 bg-neutral-50 dark:bg-[#1a1e27]'
            : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 bg-neutral-50/50 dark:bg-[#13161c]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center">
            <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-2" />
            <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 font-mono">
              {selectedFile.name}
            </p>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-500 font-mono">
              <span>{formatBytes(selectedFile.size)}</span>
              <span>·</span>
              <span>CSV detected</span>
              <span>·</span>
              <span>UTF-8 encoding</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-2">Click or drag another file to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <UploadCloud className="w-8 h-8 text-neutral-400 dark:text-neutral-500 mb-2" />
            <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Drag & drop your CSV file here, or{' '}
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                browse files
              </span>
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">
              Supports multiline blog paragraphs, quoted commas, and Unicode content.
            </p>
          </div>
        )}
      </div>

      {/* Upload Progress Bar */}
      {isUploading && (
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              Streaming and analyzing dataset...
            </span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1">
            <p className="font-semibold">Ingestion Error</p>
            <p className="mt-0.5 text-rose-600 dark:text-rose-400">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {lastUploaded && (
        <div className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
          <div className="flex-1">
            <p className="font-semibold">Dataset Ingestion Complete</p>
            <p className="mt-0.5 text-emerald-700 dark:text-emerald-400 font-mono">
              {(lastUploaded.totalRows || 0).toLocaleString()} rows and {lastUploaded.totalColumns || 0} columns ready for processing.
            </p>
          </div>
        </div>
      )}

      {/* Upload Action Button */}
      {selectedFile && !isUploading && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleUpload}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs"
          >
            <span>Upload Dataset</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
