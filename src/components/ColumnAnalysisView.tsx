import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Info, Sparkles, Filter, ShieldCheck, Tag } from 'lucide-react';
import { ColumnAnalysis } from '../server/types/models';

interface ColumnAnalysisViewProps {
  columns: ColumnAnalysis[];
  datasetName: string;
  totalRows: number;
}

export const ColumnAnalysisView: React.FC<ColumnAnalysisViewProps> = ({
  columns,
  datasetName,
  totalRows
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'RECOMMENDED' | 'EXCLUDED'>('ALL');
  const [selectedColumn, setSelectedColumn] = useState<ColumnAnalysis | null>(null);

  const recommendedCount = columns.filter((c) => c.recommendedForProcessing).length;
  const excludedCount = columns.length - recommendedCount;

  const filteredColumns = columns.filter((c) => {
    if (filterType === 'RECOMMENDED') return c.recommendedForProcessing;
    if (filterType === 'EXCLUDED') return !c.recommendedForProcessing;
    return true;
  });

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'LONG_TEXT':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
      case 'STRING':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50';
      case 'URL':
        return 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50';
      case 'DATE':
      case 'DATETIME':
        return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/50';
      case 'INTEGER':
      case 'DECIMAL':
      case 'NUMBER':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Metric summary banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 bg-white dark:bg-[#15181e] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Analyzed Columns</span>
            <Tag className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
            {columns.length}
          </p>
          <p className="text-[11px] text-neutral-400 mt-0.5 font-mono">
            {(totalRows || 0).toLocaleString()} rows in {datasetName}
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-[#15181e] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Recommended for AI</span>
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
            {recommendedCount}
          </p>
          <p className="text-[11px] text-neutral-400 mt-0.5">Articles, blog body, headlines, drafts</p>
        </div>

        <div className="p-4 bg-white dark:bg-[#15181e] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>Excluded Metadata</span>
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
            {excludedCount}
          </p>
          <p className="text-[11px] text-neutral-400 mt-0.5">URLs, IDs, timestamps locked verbatim</p>
        </div>
      </div>

      {/* Main Analysis Table Card */}
      <div className="bg-white dark:bg-[#15181e] border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
        {/* Filter Toolbar */}
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-[#12151b]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Filter:</span>
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  filterType === 'ALL'
                    ? 'bg-white dark:bg-[#1c212a] text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                All ({columns.length})
              </button>
              <button
                onClick={() => setFilterType('RECOMMENDED')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  filterType === 'RECOMMENDED'
                    ? 'bg-white dark:bg-[#1c212a] text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                Recommended ({recommendedCount})
              </button>
              <button
                onClick={() => setFilterType('EXCLUDED')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  filterType === 'EXCLUDED'
                    ? 'bg-white dark:bg-[#1c212a] text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                Excluded ({excludedCount})
              </button>
            </div>
          </div>
          <span className="text-[11px] text-neutral-400 font-mono">
            {filteredColumns.length} columns displayed
          </span>
        </div>

        {/* Columns Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-100 dark:bg-[#181c24] text-neutral-600 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-800 font-mono text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Column Name</th>
                <th className="py-2.5 px-3">Inferred Type</th>
                <th className="py-2.5 px-3">Content Score</th>
                <th className="py-2.5 px-3">Empty %</th>
                <th className="py-2.5 px-3">Avg Length</th>
                <th className="py-2.5 px-3">Recommendation</th>
                <th className="py-2.5 px-3">Heuristic Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-mono text-xs">
              {filteredColumns.map((col) => {
                const scorePct = Math.round(col.contentScore * 100);
                return (
                  <tr
                    key={col.name}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-900/60 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-semibold text-neutral-900 dark:text-neutral-100">
                      {col.originalName}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getTypeBadgeClass(
                          col.inferredType
                        )}`}
                      >
                        {col.inferredType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              scorePct >= 70
                                ? 'bg-indigo-600'
                                : scorePct >= 40
                                ? 'bg-amber-500'
                                : 'bg-neutral-400'
                            }`}
                            style={{ width: `${scorePct}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-neutral-600 dark:text-neutral-400">
                          {scorePct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-400">
                      {col.emptyPercentage.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-400">
                      {col.avgLength} chars
                    </td>
                    <td className="py-2.5 px-3">
                      {col.recommendedForProcessing ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                          <CheckCircle className="w-3 h-3" />
                          Recommended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700">
                          Locked
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-neutral-500 dark:text-neutral-400 max-w-xs truncate text-[11px]">
                      {col.reason}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
