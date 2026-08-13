import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Upload, FileSpreadsheet, Sparkles, ArrowRight, Table } from 'lucide-react';
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
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onLoadRows,
  fileInputRef
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Column Mapping Modal State
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
        setRewriteAllColumns(true);
        setSelectedTargetCols(headers);
      } catch (err: any) {
        setParseError(`Failed to parse CSV: ${err.message || 'Syntax error'}`);
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processCSVFile(e.dataTransfer.files[0]);
    }
  };

  const handleToggleColumnSelection = (col: string) => {
    setSelectedTargetCols(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const handleConfirmMapping = () => {
    if (!pendingParsedData || !selectedContentCol) {
      setParseError('Please select a Content column.');
      return;
    }

    const targetCols = rewriteAllColumns ? ['*'] : selectedTargetCols;

    onLoadRows(
      pendingParsedData.records,
      pendingParsedData.filename,
      selectedContentCol,
      selectedTitleCol,
      selectedAuthorCol,
      targetCols
    );

    setPendingParsedData(null);
  };

  const handleSelectSampleDataset = (datasetId: string) => {
    const dataset = SAMPLE_DATASETS.find(d => d.id === datasetId);
    if (!dataset) return;

    onLoadRows(
      dataset.data,
      dataset.filename,
      dataset.contentColumn,
      dataset.titleColumn,
      dataset.authorColumn,
      ['*']
    );
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E8DFD1] rounded-[28px] p-8 shadow-sm mb-8 text-[#341306]">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Column Mapping Modal rendered via portal so it escapes any parent display:none */}
      {pendingParsedData && createPortal(
        <div className="fixed inset-0 bg-[#341306]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#E8DFD1] rounded-3xl max-w-lg w-full p-6 shadow-2xl text-[#341306]">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#c96529] text-white flex items-center justify-center shadow-md">
                <Table className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-[#341306]">Map CSV Columns</h3>
                <p className="text-xs text-[#945c3c]">
                  {pendingParsedData.filename} ({pendingParsedData.records.length} rows loaded)
                </p>
              </div>
            </div>

            <p className="text-xs text-[#341306] mb-4 leading-relaxed font-medium">
              Choose which columns to humanize/rewrite and map the primary display fields:
            </p>

            <div className="space-y-4 mb-6">
              {/* Target Columns to Rewrite / Humanize */}
              <div className="bg-[#FAF7F2] p-3.5 border border-[#E8DFD1] rounded-2xl">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#c96529] mb-2 flex items-center justify-between">
                  <span>Columns to Humanize / Rewrite</span>
                  <span className="text-[10px] text-[#945c3c] font-semibold">
                    {rewriteAllColumns ? `All ${pendingParsedData.headers.length} Columns` : `${selectedTargetCols.length} Selected`}
                  </span>
                </label>

                <div className="flex items-center gap-3 mb-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setRewriteAllColumns(true);
                      setSelectedTargetCols(pendingParsedData.headers);
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors ${
                      rewriteAllColumns
                        ? 'bg-[#c96529] text-white border-[#c96529]'
                        : 'bg-[#FFFFFF] text-[#945c3c] border-[#E8DFD1] hover:bg-[#F2EAE0]'
                    }`}
                  >
                    ✨ All Columns ({pendingParsedData.headers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRewriteAllColumns(false)}
                    className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors ${
                      !rewriteAllColumns
                        ? 'bg-[#c96529] text-white border-[#c96529]'
                        : 'bg-[#FFFFFF] text-[#945c3c] border-[#E8DFD1] hover:bg-[#F2EAE0]'
                    }`}
                  >
                    Select Specific Columns
                  </button>
                </div>

                {!rewriteAllColumns && (
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#E8DFD1] max-h-36 overflow-y-auto">
                    {pendingParsedData.headers.map(h => (
                      <label key={h} className="flex items-center space-x-2 text-xs text-[#341306] cursor-pointer hover:bg-[#FAF7F2] p-1 rounded-lg">
                        <input
                          type="checkbox"
                          checked={selectedTargetCols.includes(h)}
                          onChange={() => handleToggleColumnSelection(h)}
                          className="w-3.5 h-3.5 text-[#c96529] rounded border-[#E8DFD1] bg-[#FAF7F2] focus:ring-[#c96529]"
                        />
                        <span className="truncate">{h}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Primary Content Column */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#945c3c] mb-1.5 flex items-center justify-between">
                  <span>Primary Content / Body Column <span className="text-[#c96529]">*</span></span>
                  <span className="text-[10px] text-[#945444] font-normal">Primary text field</span>
                </label>
                <select
                  value={selectedContentCol}
                  onChange={(e) => setSelectedContentCol(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E8DFD1] text-[#341306] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96529]"
                >
                  <option value="">-- Select Content Column --</option>
                  {pendingParsedData.headers.map(h => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title Column (Optional) */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#945c3c] mb-1.5 flex items-center justify-between">
                  <span>Display Title Column</span>
                  <span className="text-[10px] text-[#945444] font-normal">For table title display</span>
                </label>
                <select
                  value={selectedTitleCol}
                  onChange={(e) => setSelectedTitleCol(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E8DFD1] text-[#341306] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96529]"
                >
                  <option value="">-- None (Untitled) --</option>
                  {pendingParsedData.headers.map(h => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Author Column (Optional) */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#945c3c] mb-1.5 flex items-center justify-between">
                  <span>Author Column</span>
                  <span className="text-[10px] text-[#945444] font-normal">Optional</span>
                </label>
                <select
                  value={selectedAuthorCol}
                  onChange={(e) => setSelectedAuthorCol(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E8DFD1] text-[#341306] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c96529]"
                >
                  <option value="">-- None --</option>
                  {pendingParsedData.headers.map(h => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setPendingParsedData(null)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#945c3c] hover:text-[#341306] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMapping}
                disabled={!selectedContentCol}
                className="px-6 py-2.5 bg-[#c96529] hover:bg-[#b3551d] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-widest rounded-full flex items-center gap-2 transition-all shadow-md shadow-[#c96529]/20"
              >
                <span>Import Dataset</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Primary Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
          dragOver
            ? 'border-[#c96529] bg-[#c96529]/10 scale-[0.99]'
            : 'border-[#E8DFD1] hover:border-[#c96529] bg-[#FAF7F2]/80 hover:bg-[#F2EAE0]'
        }`}
      >
        <div className="w-16 h-16 rounded-2xl bg-[#FAF7F2] text-[#c96529] border border-[#E8DFD1] mx-auto flex items-center justify-center mb-4 shadow-xs">
          <Upload className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#341306] mb-1">
          Upload Blog CSV File
        </h2>
        <p className="text-xs text-[#945c3c] max-w-md mx-auto mb-5 leading-relaxed font-medium">
          Drag & drop your CSV file here, or click to browse. Supports files with titles, content body, author, tags, and custom metadata columns.
        </p>

        <button
          type="button"
          className="px-6 py-2.5 bg-[#c96529] hover:bg-[#b3551d] text-white font-bold uppercase tracking-widest text-xs rounded-full shadow-md shadow-[#c96529]/20 transition-all inline-flex items-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Select CSV File</span>
        </button>

        {parseError && (
          <p className="text-xs text-rose-800 mt-4 font-semibold bg-rose-50 border border-rose-200 rounded-xl py-2 px-4 max-w-sm mx-auto">
            {parseError}
          </p>
        )}
      </div>

      {/* Preset Demo Datasets Quick Bar */}
      <div className="mt-8 pt-6 border-t border-[#E8DFD1]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-bold text-[#945c3c] uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#c96529]" /> Or try a pre-loaded sample blog CSV:
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {SAMPLE_DATASETS.map((ds) => (
            <div
              key={ds.id}
              onClick={() => handleSelectSampleDataset(ds.id)}
              className="group p-4 bg-[#FAF7F2] hover:bg-[#F2EAE0] border border-[#E8DFD1] rounded-2xl cursor-pointer transition-all flex items-start justify-between shadow-2xs"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-serif font-bold text-sm text-[#341306] group-hover:text-[#c96529] transition-colors">
                    {ds.name}
                  </h4>
                  <span className="text-[10px] bg-white text-[#945c3c] px-2 py-0.5 rounded-full font-mono border border-[#E8DFD1]">
                    {ds.rowsCount} items
                  </span>
                </div>
                <p className="text-[11px] text-[#945444] mt-1 leading-snug">
                  {ds.description}
                </p>
              </div>

              <span className="text-[#c96529] opacity-0 group-hover:opacity-100 transition-opacity pl-2 pt-1">
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
