import React, { useState, useMemo } from 'react';
import {
  GitCompare,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Sliders,
  Send,
  SlidersHorizontal,
  ThumbsUp
} from 'lucide-react';
import { BlogRow } from '../../types';

interface SplitComparisonViewProps {
  rows: BlogRow[];
  onSaveRow: (rowId: string, updatedContent: string, updatedColumns?: Record<string, string>) => void;
  onSingleRowRewrite: (row: BlogRow, promptOverride?: string) => Promise<void>;
  onNavigateToWorkspace: () => void;
}

export const SplitComparisonView: React.FC<SplitComparisonViewProps> = ({
  rows,
  onSaveRow,
  onSingleRowRewrite,
  onNavigateToWorkspace
}) => {
  // Filter rows that have been processed or edited
  const processedRows = useMemo(() => {
    return rows.filter((r) => r.status === 'humanized' || r.status === 'edited');
  }, [rows]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [quickPrompt, setQuickPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentRow = processedRows[currentIndex] || null;

  const rewrittenCols = currentRow?.humanizedColumns ? Object.keys(currentRow.humanizedColumns) : [];
  const [activeCol, setActiveCol] = useState<string>(rewrittenCols[0] || 'primary');
  const [editedText, setEditedText] = useState<string>('');

  React.useEffect(() => {
    if (currentRow) {
      const cols = currentRow.humanizedColumns ? Object.keys(currentRow.humanizedColumns) : [];
      const col = cols[0] || 'primary';
      setActiveCol(col);
      const initialText =
        col === 'primary'
          ? currentRow.humanizedContent || currentRow.originalContent
          : currentRow.humanizedColumns?.[col] || '';
      setEditedText(initialText);
    }
  }, [currentRow]);

  if (processedRows.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl bg-white/50 dark:bg-[#15181e]/50">
        <GitCompare className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          No Transformed Records to Compare
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-md mx-auto">
          Process one or more rows in the AI Workspace to inspect side-by-side original and humanized diffs, word count metrics, and sentence flow.
        </p>
        <button
          onClick={onNavigateToWorkspace}
          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
        >
          <span>Open AI Workspace</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const originalText =
    activeCol === 'primary' || !currentRow?.rawRecord?.[activeCol]
      ? currentRow?.originalContent || ''
      : currentRow?.rawRecord[activeCol] || '';

  const originalWords = originalText.trim().split(/\s+/).filter(Boolean).length;
  const transformedWords = editedText.trim().split(/\s+/).filter(Boolean).length;
  const wordDelta = transformedWords - originalWords;

  const handleRegenerate = async () => {
    if (!currentRow) return;
    setIsProcessing(true);
    try {
      await onSingleRowRewrite(currentRow, quickPrompt);
      setQuickPrompt('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = () => {
    if (!currentRow) return;
    if (activeCol === 'primary') {
      onSaveRow(currentRow.id, editedText, currentRow.humanizedColumns);
    } else {
      const updated = { ...(currentRow.humanizedColumns || {}), [activeCol]: editedText };
      onSaveRow(currentRow.id, currentRow.humanizedContent || currentRow.originalContent, updated);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-[#15181e] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <GitCompare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span>{currentRow?.title || `Row #${currentRow?.id}`}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 uppercase">
                {currentRow?.status}
              </span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
              Viewing record {currentIndex + 1} of {processedRows.length} humanized rows
            </p>
          </div>
        </div>

        {/* Navigation & Column Switcher */}
        <div className="flex items-center gap-2.5">
          {rewrittenCols.length > 1 && (
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg text-xs font-mono">
              {rewrittenCols.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setActiveCol(c);
                    setEditedText(currentRow?.humanizedColumns?.[c] || '');
                  }}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    activeCol === c
                      ? 'bg-white dark:bg-[#1a1e27] text-neutral-900 dark:text-neutral-100 shadow-xs font-semibold'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-[#15181e]">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 text-neutral-600 dark:text-neutral-300"
              title="Previous transformed record"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 text-xs font-mono text-neutral-600 dark:text-neutral-300 border-x border-neutral-200 dark:border-neutral-800">
              {currentIndex + 1} / {processedRows.length}
            </span>
            <button
              onClick={() => setCurrentIndex((prev) => Math.min(processedRows.length - 1, prev + 1))}
              disabled={currentIndex >= processedRows.length - 1}
              className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 text-neutral-600 dark:text-neutral-300"
              title="Next transformed record"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Split Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Original Content */}
        <div className="flex flex-col bg-white dark:bg-[#15181e] border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
          <div className="px-4 py-2.5 bg-neutral-50 dark:bg-[#12151b] border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs font-mono">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider text-[11px]">
              Original Source Content
            </span>
            <span className="text-neutral-500">{(originalWords || 0).toLocaleString()} words</span>
          </div>
          <div className="p-4 overflow-y-auto max-h-[460px] text-xs leading-relaxed text-neutral-800 dark:text-neutral-200 font-sans whitespace-pre-wrap selection:bg-neutral-200">
            {originalText}
          </div>
          <div className="p-3 bg-neutral-50/50 dark:bg-[#12151b]/50 border-t border-neutral-200 dark:border-neutral-800 text-[11px] font-mono text-neutral-400 flex items-center justify-between">
            <span>Flesch Score: {currentRow?.fleschScoreOriginal ?? 45}</span>
            <span>Fluff: {currentRow?.aiFluffReduction ?? 25}%</span>
          </div>
        </div>

        {/* Right: Humanized Revision */}
        <div className="flex flex-col bg-white dark:bg-[#15181e] border border-indigo-200 dark:border-indigo-900/60 rounded-xl overflow-hidden shadow-xs">
          <div className="px-4 py-2.5 bg-indigo-50/40 dark:bg-indigo-950/20 border-b border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between text-xs font-mono">
            <span className="font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Humanized Output</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">{(transformedWords || 0).toLocaleString()} words</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  wordDelta >= 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                }`}
              >
                {wordDelta >= 0 ? `+${wordDelta}` : wordDelta} words
              </span>
            </div>
          </div>
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="flex-1 p-4 bg-transparent resize-none focus:outline-none text-xs leading-relaxed text-neutral-900 dark:text-neutral-100 font-sans min-h-[380px] max-h-[460px] overflow-y-auto"
            placeholder="Humanized content will appear here..."
          />
          <div className="p-3 bg-neutral-50/50 dark:bg-[#12151b]/50 border-t border-neutral-200 dark:border-neutral-800 text-[11px] font-mono text-neutral-400 flex items-center justify-between">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              Flesch Score: {currentRow?.fleschScoreHumanized ?? 78} (+{Math.max(0, (currentRow?.fleschScoreHumanized ?? 78) - (currentRow?.fleschScoreOriginal ?? 45))})
            </span>
            <span className="text-indigo-600 dark:text-indigo-400">
              Fluff: {Math.max(0, Math.round((currentRow?.aiFluffReduction ?? 25) * 0.2))}%
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer & Prompt Refinement */}
      <div className="p-4 bg-white dark:bg-[#15181e] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:max-w-md">
          <input
            type="text"
            value={quickPrompt}
            onChange={(e) => setQuickPrompt(e.target.value)}
            placeholder="Directive override (e.g. 'Make more conversational', 'Shorten intro')"
            className="flex-1 bg-neutral-50 dark:bg-[#181c24] border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleRegenerate}
            disabled={isProcessing}
            className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleApprove}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Approve & Save Revision</span>
          </button>
        </div>
      </div>
    </div>
  );
};
