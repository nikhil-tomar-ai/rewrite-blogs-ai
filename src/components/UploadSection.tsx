import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, Sparkles, ArrowRight, Table, X } from 'lucide-react';
import { SAMPLE_DATASETS } from '../data/sampleBlogs';
import { parseCSVString, autoDetectColumns } from '../utils/csvUtils';

interface UploadSectionProps {
  onLoadRows: (
    records: Record<string, string>[],
    filename: string,
    contentCol: string,
    titleCol: string,
    authorCol: string,
    targetCols?: string[]
  ) => void;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onLoadRows,
  fileInputRef
}) => {
  const localInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const [pendingParsedData, setPendingParsedData] = useState<{
    records: Record<string, string>[];
    headers: string[];
    filename: string;
  } | null>(null);

  const [selectedContentCol, setSelectedContentCol] = useState<string>('');
  const [selectedTitleCol, setSelectedTitleCol] = useState<string>('');
  const [selectedAuthorCol, setSelectedAuthorCol] = useState<string>('');
  const [rewriteAllColumns, setRewriteAllColumns] = useState<boolean>(true);
  const [selectedTargetCols, setSelectedTargetCols] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processCSVFile(files[0]);
    }
    e.target.value = '';
  };

  const processCSVFile = (file: File) => {
    setParseError(null);
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      setParseError('Please upload a valid .csv file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text || text.trim().length === 0) {
        setParseError('The uploaded CSV file is empty.');
        return;
      }

      try {
        const records = parseCSVString(text);
        if (records.length === 0) {
          setParseError('Could not parse any rows from the CSV file.');
          return;
        }

        const headers = Object.keys(records[0] || {});
        const detected = autoDetectColumns(headers);

        setPendingParsedData({
          records,
          headers,
          filename: file.name
        });

        setSelectedContentCol(detected.contentColumn);
        setSelectedTitleCol(detected.titleColumn);
        setSelectedAuthorCol(detected.authorColumn);
        setSelectedTargetCols(['*']);
      } catch (err: any) {
        setParseError(`CSV parsing error: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processCSVFile(files[0]);
    }
  };

  const handleSelectSampleDataset = (sampleId: string) => {
    const sample = SAMPLE_DATASETS.find((s) => s.id === sampleId);
    if (sample) {
      onLoadRows(
        sample.data,
        sample.filename,
        sample.contentColumn,
        sample.titleColumn,
        sample.authorColumn,
        sample.targetColumns || ['*']
      );
    }
  };

  const handleConfirmMapping = () => {
    if (!pendingParsedData || !selectedContentCol) return;

    onLoadRows(
      pendingParsedData.records,
      pendingParsedData.filename,
      selectedContentCol,
      selectedTitleCol,
      selectedAuthorCol,
      rewriteAllColumns ? ['*'] : selectedTargetCols
    );

    setPendingParsedData(null);
  };

  return (
    <div className="w-full">
      <input
        ref={localInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Column Mapping Dialog */}
      {pendingParsedData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#15181e] border border-neutral-200 dark:border-neutral-800 rounded-xl max-w-xl w-full p-5 shadow-2xl transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Confirm Column Mapping
                </h3>
                <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                  {pendingParsedData.filename} · {(pendingParsedData.records?.length || 0).toLocaleString()} rows detected
                </p>
              </div>
              <button
                onClick={() => setPendingParsedData(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 py-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                  Primary Blog Body / Content Column: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedContentCol}
                  onChange={(e) => setSelectedContentCol(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-[#181c24] border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 font-mono"
                >
                  <option value="">Select column...</option>
                  {pendingParsedData.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                  Blog Title Column (Optional):
                </label>
                <select
                  value={selectedTitleCol}
                  onChange={(e) => setSelectedTitleCol(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-[#181c24] border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 font-mono"
                >
                  <option value="">None / Not specified</option>
                  {pendingParsedData.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                  Author Column (Optional):
                </label>
                <select
                  value={selectedAuthorCol}
                  onChange={(e) => setSelectedAuthorCol(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-[#181c24] border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 font-mono"
                >
                  <option value="">None / Not specified</option>
                  {pendingParsedData.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setPendingParsedData(null)}
                className="px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMapping}
                disabled={!selectedContentCol}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Import Dataset</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => localInputRef.current?.click()}
        className={`border border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
            : 'border-neutral-300 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 bg-white dark:bg-[#15181e]'
        }`}
      >
        <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 mx-auto flex items-center justify-center mb-3">
          <Upload className="w-6 h-6" />
        </div>
        <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
          Upload Blog CSV File
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mb-4 leading-relaxed">
          Drag & drop your CSV file here, or click to browse. Supports files with titles, content body, author, tags, and custom metadata columns.
        </p>

        <button
          type="button"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors inline-flex items-center gap-2"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Select CSV File</span>
        </button>

        {parseError && (
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-3 font-medium bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-lg py-2 px-3 max-w-sm mx-auto">
            {parseError}
          </p>
        )}
      </div>

      {/* Sample Datasets Bar */}
      <div className="mt-6 pt-5 border-t border-neutral-200 dark:border-neutral-800">
        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Or load a pre-configured sample dataset:
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SAMPLE_DATASETS.map((ds) => (
            <div
              key={ds.id}
              onClick={() => handleSelectSampleDataset(ds.id)}
              className="p-3 bg-white dark:bg-[#15181e] hover:bg-neutral-50 dark:hover:bg-[#181c24] border border-neutral-200 dark:border-neutral-800 rounded-xl cursor-pointer transition-all flex items-start justify-between shadow-xs group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {ds.name}
                  </h4>
                  <span className="text-[10px] font-mono text-neutral-400">
                    {ds.rowsCount} rows
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                  {ds.description}
                </p>
              </div>

              <span className="text-neutral-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity pl-2 pt-0.5">
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
