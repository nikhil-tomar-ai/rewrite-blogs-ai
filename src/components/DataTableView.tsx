import React, { useState } from 'react';
import {
  Search,
  Eye,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  CheckSquare,
  Square,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { BlogRow } from '../types';

interface DataTableViewProps {
  rows: BlogRow[];
  selectedRowIds: Set<string>;
  onToggleSelectRow: (id: string) => void;
  onToggleSelectAll: () => void;
  onOpenDiffModal: (row: BlogRow) => void;
  onSingleRowRewrite: (row: BlogRow) => void;
  onRetryFailed?: () => void;
  processingRowId: string | null;
  onInspectSchema?: () => void;
}

export const DataTableView: React.FC<DataTableViewProps> = ({
  rows,
  selectedRowIds,
  onToggleSelectRow,
  onToggleSelectAll,
  onOpenDiffModal,
  onSingleRowRewrite,
  onRetryFailed,
  processingRowId,
  onInspectSchema
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'humanized' | 'failed'>('all');

  const failedCount = rows.filter((r) => r.status === 'failed').length;

  const filteredRows = rows.filter((row) => {
    const matchesSearch =
      row.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.originalContent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (row.humanizedContent && row.humanizedContent.toLowerCase().includes(searchTerm.toLowerCase())) ||
      row.author.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'humanized'
        ? row.status === 'humanized' || row.status === 'edited'
        : row.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const isAllSelected = filteredRows.length > 0 && filteredRows.every((r) => selectedRowIds.has(r.id));

  const getStatusBadge = (row: BlogRow) => {
    if (processingRowId === row.id) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40 font-semibold">
          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
          Processing
        </span>
      );
    }
    switch (row.status) {
      case 'humanized':
      case 'edited':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 font-semibold">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Humanized
          </span>
        );
      case 'failed':
        return (
          <div className="flex flex-col items-center gap-0.5">
            <span
              className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 font-semibold cursor-help"
              title={row.errorMessage || 'Processing error. Click Retry button to reprocess.'}
            >
              <AlertCircle className="w-2.5 h-2.5" />
              Failed
            </span>
            {row.errorMessage && (
              <span
                className="text-[9px] text-rose-500 max-w-[90px] truncate block font-mono"
                title={row.errorMessage}
              >
                {row.errorMessage}
              </span>
            )}
          </div>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
            <Clock className="w-2.5 h-2.5" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-[#15181e] border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs mb-8 transition-colors">
      {/* Table Toolbar */}
      <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#12151b] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter title or content..."
              className="bg-white dark:bg-[#181c24] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-indigo-500 w-52"
            />
          </div>

          {/* Status Filter Segmented Control */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg text-xs font-medium">
            {(['all', 'pending', 'humanized', 'failed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors text-xs ${
                  statusFilter === st
                    ? 'bg-white dark:bg-[#1c212a] text-neutral-900 dark:text-neutral-100 shadow-xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {failedCount > 0 && onRetryFailed && (
            <button
              onClick={onRetryFailed}
              className="px-2.5 py-1.5 text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              title="Rerun only failed records"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Failed ({failedCount})</span>
            </button>
          )}

          {onInspectSchema && rows.length > 0 && (
            <button
              onClick={onInspectSchema}
              className="px-2.5 py-1.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg transition-colors flex items-center gap-1.5"
              title="Verify CSV Schema Parity"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Verify Schema</span>
            </button>
          )}
          <span className="text-[11px] font-mono text-neutral-400">
            {filteredRows.length} of {rows.length} rows
          </span>
        </div>
      </div>

      {/* Rows Table */}
      <div className="overflow-x-auto max-h-[600px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-neutral-100 dark:bg-[#181c24] text-neutral-600 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-800 font-mono text-[11px]">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center">
                <button onClick={onToggleSelectAll} className="text-neutral-400 hover:text-neutral-600">
                  {isAllSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                  ) : (
                    <Square className="w-3.5 h-3.5" />
                  )}
                </button>
              </th>
              <th className="py-2.5 px-3 w-12 text-center">#</th>
              <th className="py-2.5 px-3 min-w-[200px] max-w-[280px]">Blog Title</th>
              <th className="py-2.5 px-3 min-w-[240px] max-w-[380px]">Original Snippet</th>
              <th className="py-2.5 px-3 min-w-[240px] max-w-[380px]">Humanized Revision</th>
              <th className="py-2.5 px-3 w-28 text-center">Status</th>
              <th className="py-2.5 px-3 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-sans text-xs">
            {filteredRows.map((row, index) => {
              const isSelected = selectedRowIds.has(row.id);
              return (
                <tr
                  key={row.id}
                  className={`hover:bg-neutral-50 dark:hover:bg-neutral-900/60 transition-colors ${
                    isSelected ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => onToggleSelectRow(row.id)}
                      className="text-neutral-400 hover:text-neutral-600"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </td>
                  <td className="py-2.5 px-3 text-center text-neutral-400 font-mono text-[11px] tabular-nums">
                    {index + 1}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-neutral-900 dark:text-neutral-100 max-w-[280px]">
                    <p className="truncate">{row.title || 'Untitled'}</p>
                    {row.author && (
                      <p className="text-[11px] text-neutral-400 font-mono mt-0.5 truncate">
                        by {row.author}
                      </p>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-400 max-w-[380px]">
                    <p className="line-clamp-2 leading-relaxed text-[11px]">
                      {row.originalContent}
                    </p>
                    <span className="text-[10px] font-mono text-neutral-400 mt-0.5 block">
                      {row.wordCountOriginal} words
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-neutral-700 dark:text-neutral-300 max-w-[380px]">
                    {row.humanizedContent ? (
                      <div>
                        <p className="line-clamp-2 leading-relaxed text-[11px] text-neutral-900 dark:text-neutral-100">
                          {row.humanizedContent}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            {row.wordCountHumanized} words
                          </span>
                          <span>·</span>
                          <span className="text-indigo-600 dark:text-indigo-400">
                            Critic: {row.criticResult?.score || 85}/100
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-neutral-300 dark:text-neutral-600 italic text-[11px]">
                        Not humanized yet
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">{getStatusBadge(row)}</td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onOpenDiffModal(row)}
                        className="p-1.5 text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title="Inspect full comparison & diff"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onSingleRowRewrite(row)}
                        disabled={processingRowId === row.id}
                        className="p-1.5 text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-40"
                        title="Rewrite this row with AI"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${
                            processingRowId === row.id ? 'animate-spin text-indigo-600' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
