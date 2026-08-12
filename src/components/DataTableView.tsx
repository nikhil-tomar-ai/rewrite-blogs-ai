import React, { useState } from 'react';
import {
  Search,
  Eye,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Award,
  Filter,
  CheckSquare,
  Square,
  ShieldCheck
} from 'lucide-react';
import { BlogRow } from '../types';

interface DataTableViewProps {
  rows: BlogRow[];
  selectedRowIds: Set<string>;
  onToggleSelectRow: (id: string) => void;
  onToggleSelectAll: () => void;
  onOpenDiffModal: (row: BlogRow) => void;
  onSingleRowRewrite: (row: BlogRow) => void;
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
  processingRowId,
  onInspectSchema
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'humanized' | 'failed'>('all');

  // Filter rows
  const filteredRows = rows.filter(row => {
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

  const isAllSelected = filteredRows.length > 0 && filteredRows.every(r => selectedRowIds.has(r.id));

  return (
    <div className="bg-[#FFFFFF] border border-[#E8DFD1] rounded-[24px] overflow-hidden shadow-sm mb-8 text-[#341306]">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-[#E8DFD1] bg-[#FAF7F2] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <h3 className="font-serif text-lg font-bold text-[#341306]">CSV Blog Rows</h3>
          <span className="px-2.5 py-0.5 text-xs bg-white text-[#341306] rounded-full font-mono border border-[#E8DFD1] font-medium">
            {filteredRows.length} of {rows.length} rows
          </span>
          {onInspectSchema && rows.length > 0 && (
            <button
              onClick={onInspectSchema}
              className="px-2.5 py-1 text-[10px] bg-[#FAF7F2] hover:bg-[#c96529] text-[#945c3c] hover:text-white border border-[#E8DFD1] rounded-full font-bold uppercase tracking-wider flex items-center gap-1 transition-colors shadow-2xs"
              title="Inspect Original CSV Schema Preservation Report"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#c96529]" />
              <span className="hidden sm:inline">100% Schema Preserved</span>
            </button>
          )}
        </div>

        {/* Search & Filter */}
        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-[#945c3c] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search title or text..."
              className="w-full bg-[#FFFFFF] border border-[#E8DFD1] rounded-full pl-9 pr-3.5 py-1.5 text-xs text-[#341306] placeholder-[#945c3c]/50 focus:outline-none focus:ring-2 focus:ring-[#c96529]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-[#FFFFFF] p-1 rounded-full border border-[#E8DFD1] text-xs">
            <Filter className="w-3.5 h-3.5 text-[#945c3c] ml-1.5" />
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                statusFilter === 'all' ? 'bg-[#c96529] text-white' : 'text-[#945c3c] hover:text-[#341306]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                statusFilter === 'pending' ? 'bg-[#c96529] text-white' : 'text-[#945c3c] hover:text-[#341306]'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('humanized')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                statusFilter === 'humanized' ? 'bg-[#c96529] text-white' : 'text-[#945c3c] hover:text-[#341306]'
              }`}
            >
              Humanized
            </button>
          </div>
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#341306]">
          <thead className="bg-[#FAF7F2] text-[#945c3c] uppercase font-bold text-[10px] tracking-widest border-b border-[#E8DFD1]">
            <tr>
              <th className="p-3.5 w-10 text-center">
                <button
                  onClick={onToggleSelectAll}
                  className="text-[#945c3c] hover:text-[#341306] transition-colors"
                  title="Select All Filtered"
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-4 h-4 text-[#c96529]" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="p-3.5 w-12 text-center">#</th>
              <th className="p-3.5">Title & Author</th>
              <th className="p-3.5">Original Content Preview</th>
              <th className="p-3.5">Humanized Preview</th>
              <th className="p-3.5 text-center">Status & Score</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8DFD1]/60">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[#945c3c] text-xs font-medium">
                  No matching CSV rows found.
                </td>
              </tr>
            ) : (
              filteredRows.map(row => {
                const isSelected = selectedRowIds.has(row.id);
                const isItemProcessing = processingRowId === row.id || row.status === 'processing';

                return (
                  <tr
                    key={row.id}
                    className={`hover:bg-[#FAF7F2]/80 transition-colors ${
                      isSelected ? 'bg-[#FAF7F2]' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => onToggleSelectRow(row.id)}
                        className="text-[#945c3c] hover:text-[#341306] transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#c96529]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Row Index */}
                    <td className="p-3.5 text-center font-mono text-[#945c3c] text-[11px]">
                      {row.originalIndex + 1}
                    </td>

                    {/* Title & Author */}
                    <td className="p-3.5 max-w-[180px]">
                      <div className="font-serif font-bold text-[#341306] line-clamp-1 text-sm" title={row.title}>
                        {row.title || 'Untitled Article'}
                      </div>
                      {row.author && (
                        <div className="text-[10px] text-[#945444] font-medium line-clamp-1">
                          By {row.author}
                        </div>
                      )}
                    </td>

                    {/* Original Content Preview */}
                    <td className="p-3.5 max-w-[220px]">
                      <p className="line-clamp-2 text-[#945c3c] text-[11px] leading-relaxed">
                        {row.originalContent}
                      </p>
                      <span className="text-[10px] text-[#945444] font-mono mt-1 block">
                        {row.wordCountOriginal} words
                      </span>
                    </td>

                    {/* Humanized Preview */}
                    <td className="p-3.5 max-w-[260px]">
                      {row.humanizedContent ? (
                        <div>
                          <p className="line-clamp-2 text-[#341306] text-[11px] font-medium leading-relaxed">
                            {row.humanizedContent}
                          </p>
                          <span className="text-[10px] text-[#c96529] font-mono mt-1 block font-semibold">
                            {row.wordCountHumanized} words (Flesch: {row.fleschScoreHumanized})
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#945c3c]/50 text-[11px] italic">Not yet processed</span>
                      )}
                    </td>

                    {/* Status Badge & Score */}
                    <td className="p-3.5 text-center">
                      {isItemProcessing ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#FAF7F2] text-[#341306] rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse border border-[#c96529]">
                          <RefreshCw className="w-3 h-3 animate-spin text-[#c96529]" /> Rewriting...
                        </span>
                      ) : row.status === 'humanized' || row.status === 'edited' ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#c96529] text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-2xs">
                            <CheckCircle2 className="w-3 h-3 text-white" /> Humanized
                          </span>
                          {row.criticResult && (
                            <span className="text-[10px] font-mono text-[#c96529] font-bold flex items-center gap-0.5">
                              <Award className="w-3 h-3" /> {row.criticResult.score}% human
                            </span>
                          )}
                        </div>
                      ) : row.status === 'failed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-800 rounded-full text-[10px] font-bold border border-rose-200 uppercase tracking-wider">
                          <AlertCircle className="w-3 h-3" /> Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FAF7F2] text-[#945c3c] rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#E8DFD1]">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Review / Diff Modal */}
                        <button
                          onClick={() => onOpenDiffModal(row)}
                          className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#F2EAE0] text-[#341306] rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 border border-[#E8DFD1]"
                          title="Review Side-by-Side Diff"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#c96529]" />
                          <span className="hidden md:inline">Review</span>
                        </button>

                        {/* Single Row Rewrite Trigger */}
                        <button
                          onClick={() => onSingleRowRewrite(row)}
                          disabled={isItemProcessing}
                          className="p-1.5 bg-[#FAF7F2] hover:bg-[#c96529] text-[#945c3c] hover:text-white rounded-full transition-colors border border-[#E8DFD1]"
                          title="Run AI Humanizer on this row"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isItemProcessing ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
