import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Database,
  FileSpreadsheet,
  Search,
  Copy,
  Check
} from 'lucide-react';
import { ProcessingRow, ColumnAnalysis } from '../server/types/models';

interface DatasetPreviewTableProps {
  datasetName: string;
  totalRows: number;
  totalColumns: number;
  columns: ColumnAnalysis[];
  rows: ProcessingRow[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  onPageChange: (newPage: number) => void;
}

export const DatasetPreviewTable: React.FC<DatasetPreviewTableProps> = ({
  datasetName,
  totalRows,
  totalColumns,
  columns,
  rows,
  currentPage,
  pageSize,
  totalPages,
  isLoading,
  onPageChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [expandedCell, setExpandedCell] = useState<{
    columnName: string;
    rowNumber: number;
    value: string;
  } | null>(null);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter((r) =>
      Object.values(r.originalData).some((val) =>
        String(val || '').toLowerCase().includes(q)
      )
    );
  }, [rows, searchQuery]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-[#15181e] border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs flex flex-col transition-colors">
      {/* Table Toolbar */}
      <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 bg-neutral-50/50 dark:bg-[#12151b]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter current page rows..."
              className="bg-white dark:bg-[#181c24] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-indigo-500 w-56"
            />
          </div>
          {searchQuery && (
            <span className="text-[11px] text-neutral-500 font-mono">
              {filteredRows.length} matching rows
            </span>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-2.5 text-xs">
          <span className="text-neutral-500 dark:text-neutral-400 font-mono hidden sm:inline text-[11px]">
            Rows {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, totalRows || 0)} of {(totalRows || 0).toLocaleString()}
          </span>
          <div className="flex items-center border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-[#15181e]">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent text-neutral-700 dark:text-neutral-300 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2.5 text-xs font-mono font-medium text-neutral-700 dark:text-neutral-300 border-x border-neutral-200 dark:border-neutral-800">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
              className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent text-neutral-700 dark:text-neutral-300 transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* High-density Data Grid */}
      <div className="relative overflow-x-auto min-h-[380px] max-h-[580px]">
        {isLoading ? (
          <div className="absolute inset-0 bg-white/70 dark:bg-[#15181e]/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-10">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300 font-mono">
              Loading dataset rows...
            </p>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-neutral-400">
            <Database className="w-8 h-8 mb-2 opacity-50 text-neutral-400" />
            <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              No rows to display
            </p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Upload a CSV dataset to inspect records.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-neutral-100 dark:bg-[#181c24] text-neutral-600 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-800 font-mono text-[11px]">
              <tr>
                <th className="py-2 px-3 w-12 text-center bg-neutral-100 dark:bg-[#181c24] border-r border-neutral-200 dark:border-neutral-800 sticky left-0 z-20">
                  #
                </th>
                {columns.map((col) => (
                  <th
                    key={col.name}
                    className="py-2 px-3 font-medium whitespace-nowrap min-w-[160px] max-w-[260px] border-r border-neutral-200 dark:border-neutral-800"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="truncate text-neutral-900 dark:text-neutral-100">
                        {col.originalName}
                      </span>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-800 text-neutral-500 font-mono shrink-0">
                        {col.inferredType}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-neutral-700 dark:text-neutral-300 font-mono text-xs">
              {filteredRows.map((row, index) => {
                const globalRowNumber = (currentPage - 1) * pageSize + index + 1;
                return (
                  <tr
                    key={row.id || index}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-900/60 transition-colors group"
                  >
                    <td className="py-2 px-3 text-center text-neutral-400 bg-neutral-50/50 dark:bg-[#15181e] border-r border-neutral-200 dark:border-neutral-800 sticky left-0 z-10 text-[11px] tabular-nums">
                      {globalRowNumber}
                    </td>
                    {columns.map((col) => {
                      const cellValue = row.originalData[col.originalName] ?? row.originalData[col.name] ?? '';
                      const isLong = String(cellValue).length > 70;

                      return (
                        <td
                          key={col.name}
                          className="py-2 px-3 min-w-[160px] max-w-[260px] border-r border-neutral-100 dark:border-neutral-800/60 align-top relative group/cell"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="line-clamp-2 leading-relaxed break-words font-sans text-xs">
                              {cellValue !== '' ? (
                                String(cellValue)
                              ) : (
                                <span className="text-neutral-300 dark:text-neutral-600 italic">null</span>
                              )}
                            </span>
                            {isLong && (
                              <button
                                onClick={() =>
                                  setExpandedCell({
                                    columnName: col.originalName,
                                    rowNumber: globalRowNumber,
                                    value: String(cellValue)
                                  })
                                }
                                className="opacity-0 group-hover/cell:opacity-100 p-1 text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-opacity shrink-0"
                                title="Expand cell content"
                              >
                                <Maximize2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Expandable Cell Inspector Modal */}
      {expandedCell && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#15181e] border border-neutral-200 dark:border-neutral-800 rounded-xl max-w-2xl w-full p-5 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 font-mono">
                  {expandedCell.columnName}
                </h4>
                <p className="text-[11px] text-neutral-500 font-mono">Row #{expandedCell.rowNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(expandedCell.value)}
                  className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors text-xs flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => setExpandedCell(null)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto my-4 p-3.5 rounded-lg bg-neutral-50 dark:bg-[#12151b] border border-neutral-200 dark:border-neutral-800 font-sans text-xs leading-relaxed whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">
              {expandedCell.value}
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <span>{(expandedCell.value?.length || 0).toLocaleString()} characters</span>
              <span>
                {(expandedCell.value?.trim().split(/\s+/).filter(Boolean).length || 0).toLocaleString()} words
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
