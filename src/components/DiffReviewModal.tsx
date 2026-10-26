import React, { useState } from 'react';
import {
  X,
  Sparkles,
  RefreshCw,
  Check,
  Award,
  BookOpen,
  Send,
  Wand2,
  FileCheck,
  Layers,
  ChevronDown
} from 'lucide-react';
import { BlogRow, AlternativeVariation } from '../types';

interface DiffReviewModalProps {
  row: BlogRow | null;
  onClose: () => void;
  onSaveHumanizedContent: (rowId: string, updatedContent: string, updatedColumns?: Record<string, string>) => void;
  onSingleRowRewrite: (row: BlogRow, customPromptOverride?: string) => Promise<void>;
}

export const DiffReviewModal: React.FC<DiffReviewModalProps> = ({
  row,
  onClose,
  onSaveHumanizedContent,
  onSingleRowRewrite
}) => {
  if (!row) return null;

  const rewrittenCols = row.humanizedColumns && Object.keys(row.humanizedColumns).length > 0
    ? Object.keys(row.humanizedColumns)
    : [];

  const [activeCol, setActiveCol] = useState<string>(rewrittenCols[0] || 'primary');
  const [editedContent, setEditedContent] = useState<string>(row.humanizedContent || row.originalContent);
  const [editedColumns, setEditedColumns] = useState<Record<string, string>>(row.humanizedColumns || {});
  const [quickPrompt, setQuickPrompt] = useState<string>('');
  const [isApplyingAiEdit, setIsApplyingAiEdit] = useState<boolean>(false);
  const [alternatives, setAlternatives] = useState<AlternativeVariation[]>([]);
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState<boolean>(false);
  const [showAlternatives, setShowAlternatives] = useState<boolean>(false);

  React.useEffect(() => {
    setEditedContent(row.humanizedContent || row.originalContent);
    setEditedColumns(row.humanizedColumns || {});
    setAlternatives([]);
    setShowAlternatives(false);
    if (row.humanizedColumns && Object.keys(row.humanizedColumns).length > 0) {
      setActiveCol(Object.keys(row.humanizedColumns)[0]);
    } else {
      setActiveCol('primary');
    }
  }, [row]);

  const currentOriginalText = activeCol === 'primary' || !row.rawRecord?.[activeCol]
    ? row.originalContent
    : row.rawRecord[activeCol];

  const currentEditedText = activeCol === 'primary'
    ? editedContent
    : (editedColumns[activeCol] !== undefined ? editedColumns[activeCol] : (row.humanizedColumns?.[activeCol] || ''));

  const handleTextChange = (val: string) => {
    if (activeCol === 'primary') {
      setEditedContent(val);
    } else {
      setEditedColumns((prev) => ({ ...prev, [activeCol]: val }));
    }
  };

  const handleQuickAiInstruction = async (instruction: string) => {
    if (!currentEditedText || isApplyingAiEdit) return;
    setIsApplyingAiEdit(true);

    try {
      const response = await fetch('/api/quick-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentText: currentEditedText,
          instruction
        })
      });

      const data = await response.json();
      if (data.success && data.updatedText) {
        handleTextChange(data.updatedText);
        setQuickPrompt('');
      }
    } catch (err) {
      console.error('Failed to apply quick AI edit:', err);
    } finally {
      setIsApplyingAiEdit(false);
    }
  };

  const handleDiscoverAlternatives = async () => {
    setIsLoadingAlternatives(true);
    setShowAlternatives(true);
    try {
      const response = await fetch('/api/alternatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: currentOriginalText,
          title: row.title,
          author: row.author
        })
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.variations)) {
        setAlternatives(data.variations);
      }
    } catch (err) {
      console.error('Failed to discover alternatives:', err);
    } finally {
      setIsLoadingAlternatives(false);
    }
  };

  const handleSelectAlternative = (alt: AlternativeVariation) => {
    handleTextChange(alt.text);
    setShowAlternatives(false);
  };

  const handleFullReRun = async () => {
    setIsApplyingAiEdit(true);
    await onSingleRowRewrite(row, quickPrompt);
    setIsApplyingAiEdit(false);
  };

  const handleApproveAndSave = () => {
    onSaveHumanizedContent(row.id, editedContent, editedColumns);
    onClose();
  };

  const originalWords = currentOriginalText.trim().split(/\s+/).filter(Boolean).length;
  const transformedWords = currentEditedText.trim().split(/\s+/).filter(Boolean).length;
  const wordDelta = transformedWords - originalWords;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#15181e] border border-neutral-200 dark:border-neutral-800 rounded-xl max-w-5xl w-full p-5 shadow-2xl flex flex-col my-8 max-h-[90vh] text-neutral-900 dark:text-neutral-100 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Editorial Review & Diff
              </h3>
              {row.criticResult && (
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 rounded">
                  {row.criticResult.score}% Authenticity
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">
              Row #{row.originalIndex + 1}: <span className="font-semibold text-neutral-800 dark:text-neutral-200">{row.title || 'Untitled'}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Directives Bar */}
        <div className="py-2.5 px-3 bg-neutral-50 dark:bg-[#12151b] border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
            <Wand2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Quick Directives:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={handleDiscoverAlternatives}
              disabled={isLoadingAlternatives}
              className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-md border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1 shadow-2xs"
            >
              <Sparkles className={`w-3 h-3 text-indigo-500 ${isLoadingAlternatives ? 'animate-spin' : ''}`} />
              <span>{isLoadingAlternatives ? 'Exploring...' : 'Discover 3 Alternatives'}</span>
            </button>
            <button
              onClick={() => handleQuickAiInstruction('Make this 20% shorter and punchier')}
              disabled={isApplyingAiEdit}
              className="px-2.5 py-1 bg-white dark:bg-[#181c24] hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium rounded-md border border-neutral-200 dark:border-neutral-700 transition-colors"
            >
              Shorten & punchy
            </button>
            <button
              onClick={() => handleQuickAiInstruction('Add an engaging conversational hook at the beginning')}
              disabled={isApplyingAiEdit}
              className="px-2.5 py-1 bg-white dark:bg-[#181c24] hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium rounded-md border border-neutral-200 dark:border-neutral-700 transition-colors"
            >
              Engaging hook
            </button>
            <button
              onClick={() => handleQuickAiInstruction('Make the tone more casual with natural contractions')}
              disabled={isApplyingAiEdit}
              className="px-2.5 py-1 bg-white dark:bg-[#181c24] hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium rounded-md border border-neutral-200 dark:border-neutral-700 transition-colors"
            >
              More conversational
            </button>
          </div>
        </div>

        {/* Alternatives Discovery Panel */}
        {showAlternatives && (
          <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/20 border-b border-indigo-200 dark:border-indigo-900/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-950 dark:text-indigo-200">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Discovered Stylistic Alternatives</span>
              </div>
              <button
                onClick={() => setShowAlternatives(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-xs font-mono"
              >
                Close
              </button>
            </div>
            {isLoadingAlternatives ? (
              <div className="py-5 text-center text-xs text-neutral-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>Crafting 3 distinctive humanized variations...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {alternatives.map((alt) => (
                  <div
                    key={alt.id}
                    className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#181c24] flex flex-col justify-between space-y-2 hover:border-indigo-400 transition-all shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                          {alt.label}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">{alt.wordCount} words</span>
                      </div>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                        {alt.highlight}
                      </p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-3 mt-1.5 leading-relaxed font-sans">
                        {alt.text}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSelectAlternative(alt)}
                      className="w-full py-1 text-center bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 text-[11px] font-semibold rounded transition-colors"
                    >
                      Use this variation
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Multi-Column Selector Tabs */}
        {rewrittenCols.length > 0 && (
          <div className="py-2 px-3 bg-neutral-50/50 dark:bg-[#12151b]/50 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-1.5 text-xs font-mono">
            <span className="text-neutral-400">Column:</span>
            {rewrittenCols.map((col) => (
              <button
                key={col}
                onClick={() => setActiveCol(col)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeCol === col
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {col}
              </button>
            ))}
          </div>
        )}

        {/* Side-by-Side Content Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 overflow-y-auto min-h-[320px] max-h-[500px]">
          {/* Original Column */}
          <div className="flex flex-col border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-neutral-50/30 dark:bg-[#12151b]/30">
            <div className="p-2.5 bg-neutral-100 dark:bg-[#181c24] border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                Original Text
              </span>
              <span className="text-neutral-400">{originalWords} words</span>
            </div>
            <div className="p-3 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300 font-sans whitespace-pre-wrap overflow-y-auto">
              {currentOriginalText}
            </div>
          </div>

          {/* Humanized Column */}
          <div className="flex flex-col border border-indigo-200 dark:border-indigo-900/60 rounded-lg overflow-hidden bg-white dark:bg-[#15181e]">
            <div className="p-2.5 bg-indigo-50/40 dark:bg-indigo-950/20 border-b border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                <span>Humanized Text</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-500">{transformedWords} words</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  ({wordDelta >= 0 ? `+${wordDelta}` : wordDelta})
                </span>
              </div>
            </div>
            <textarea
              value={currentEditedText}
              onChange={(e) => handleTextChange(e.target.value)}
              className="flex-1 p-3 bg-transparent resize-none focus:outline-none text-xs leading-relaxed text-neutral-900 dark:text-neutral-100 font-sans min-h-[260px] overflow-y-auto"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 max-w-sm w-full">
            <input
              type="text"
              value={quickPrompt}
              onChange={(e) => setQuickPrompt(e.target.value)}
              placeholder="Custom AI prompt instructions..."
              className="flex-1 bg-neutral-50 dark:bg-[#181c24] border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleFullReRun}
              disabled={isApplyingAiEdit}
              className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isApplyingAiEdit ? 'animate-spin' : ''}`} />
              <span>Rerun</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              Discard Changes
            </button>
            <button
              onClick={handleApproveAndSave}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve & Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
