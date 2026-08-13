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
  FileCheck
} from 'lucide-react';
import { BlogRow } from '../types';

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

  const [activeCol, setActiveCol] = useState<string>('primary');
  const [editedContent, setEditedContent] = useState<string>(row.humanizedContent || row.originalContent);
  const [editedColumns, setEditedColumns] = useState<Record<string, string>>(row.humanizedColumns || {});
  const [quickPrompt, setQuickPrompt] = useState<string>('');
  const [isApplyingAiEdit, setIsApplyingAiEdit] = useState<boolean>(false);

  // Sync state if row changes
  React.useEffect(() => {
    setEditedContent(row.humanizedContent || row.originalContent);
    setEditedColumns(row.humanizedColumns || {});
    setActiveCol('primary');
  }, [row]);

  const currentOriginalText = activeCol === 'primary' || !row.rawRecord?.[activeCol]
    ? row.originalContent
    : row.rawRecord[activeCol];

  const currentEditedText = activeCol === 'primary'
    ? editedContent
    : (editedColumns[activeCol] !== undefined && editedColumns[activeCol].trim().length > 0
        ? editedColumns[activeCol]
        : (row.humanizedColumns?.[activeCol] || editedContent));

  const handleTextChange = (val: string) => {
    if (activeCol === 'primary') {
      setEditedContent(val);
    } else {
      setEditedColumns(prev => ({ ...prev, [activeCol]: val }));
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

  const handleFullReRun = async () => {
    setIsApplyingAiEdit(true);
    await onSingleRowRewrite(row, quickPrompt);
    setIsApplyingAiEdit(false);
  };

  const handleApproveAndSave = () => {
    onSaveHumanizedContent(row.id, editedContent, editedColumns);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#341306]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FFFFFF] border border-[#E8DFD1] rounded-[28px] max-w-5xl w-full p-6 shadow-2xl flex flex-col my-8 max-h-[90vh] text-[#341306]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8DFD1]">
          <div>
            <div className="flex items-center space-x-2.5">
              <h3 className="font-serif text-xl font-bold text-[#341306]">Human-In-The-Loop Editorial Review</h3>
              {row.criticResult && (
                <span className="px-3 py-0.5 text-xs bg-[#c96529] text-white rounded-full font-bold flex items-center gap-1 uppercase tracking-wider shadow-2xs">
                  <Award className="w-3.5 h-3.5 text-white" /> {row.criticResult.score}% Authenticity
                </span>
              )}
            </div>
            <p className="text-xs text-[#945c3c] mt-0.5 font-medium">
              Row #{row.originalIndex + 1}: <span className="text-[#341306] font-semibold">{row.title || 'Untitled'}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#945c3c] hover:text-[#341306] hover:bg-[#FAF7F2] rounded-full transition-colors border border-[#E8DFD1]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick AI Refinement Shortcuts Bar */}
        <div className="py-3 px-4 bg-[#FAF7F2] border-b border-[#E8DFD1] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5 text-xs text-[#945c3c] font-bold uppercase tracking-wider">
            <Wand2 className="w-4 h-4 text-[#c96529]" />
            <span>Quick AI Tweaks:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleQuickAiInstruction('Make this 20% shorter and punchier')}
              disabled={isApplyingAiEdit}
              className="px-3 py-1 bg-white hover:bg-[#F2EAE0] text-[#341306] text-xs font-semibold rounded-full border border-[#E8DFD1] transition-colors"
            >
              ✂️ Shorten & Punchy
            </button>
            <button
              onClick={() => handleQuickAiInstruction('Add an engaging conversational hook at the beginning')}
              disabled={isApplyingAiEdit}
              className="px-3 py-1 bg-white hover:bg-[#F2EAE0] text-[#341306] text-xs font-semibold rounded-full border border-[#E8DFD1] transition-colors"
            >
              🎣 Better Opening Hook
            </button>
            <button
              onClick={() => handleQuickAiInstruction('Make the tone more casual with natural contractions')}
              disabled={isApplyingAiEdit}
              className="px-3 py-1 bg-white hover:bg-[#F2EAE0] text-[#341306] text-xs font-semibold rounded-full border border-[#E8DFD1] transition-colors"
            >
              ☕ More Casual Tone
            </button>
          </div>
        </div>

        {/* Multi-Column Selector Tabs (if multi-column rewrite active) */}
        {rewrittenCols.length > 0 && (
          <div className="py-2 px-4 bg-[#FAF7F2]/60 border-b border-[#E8DFD1] flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#945c3c] mr-2 uppercase tracking-wider">Select Column:</span>
            <button
              onClick={() => setActiveCol('primary')}
              className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${
                activeCol === 'primary'
                  ? 'bg-[#c96529] text-white border-[#c96529] shadow-2xs'
                  : 'bg-white text-[#945c3c] border-[#E8DFD1] hover:bg-[#FAF7F2]'
              }`}
            >
              Primary Body Content
            </button>
            {rewrittenCols.map(col => (
              <button
                key={col}
                onClick={() => setActiveCol(col)}
                className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${
                  activeCol === col
                    ? 'bg-[#c96529] text-white border-[#c96529] shadow-2xs'
                    : 'bg-white text-[#945c3c] border-[#E8DFD1] hover:bg-[#FAF7F2]'
                }`}
              >
                {col}
              </button>
            ))}
          </div>
        )}

        {/* Side-by-Side Content Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 flex-1 overflow-y-auto">
          {/* Left Column: Original Draft */}
          <div className="flex flex-col bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E8DFD1] text-xs font-bold text-[#945c3c]">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <BookOpen className="w-4 h-4 text-[#945c3c]" /> Original {activeCol === 'primary' ? 'Draft' : `[${activeCol}]`}
              </span>
              <span className="font-mono text-[11px] text-[#945444] font-medium">
                {currentOriginalText.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <div className="text-xs text-[#341306] leading-relaxed whitespace-pre-wrap font-sans overflow-y-auto flex-1 p-1 select-text">
              {currentOriginalText}
            </div>
          </div>

          {/* Right Column: Humanized Version (Editable) */}
          <div className="flex flex-col bg-white border-2 border-[#c96529] rounded-2xl p-4 shadow-md">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E8DFD1] text-xs font-bold text-[#c96529]">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#c96529]" /> Humanized {activeCol === 'primary' ? 'Content' : `[${activeCol}]`}
              </span>
              <span className="font-mono text-[11px] text-[#c96529] font-semibold">
                {currentEditedText.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            <textarea
              value={currentEditedText}
              onChange={e => handleTextChange(e.target.value)}
              disabled={isApplyingAiEdit}
              rows={12}
              className="w-full flex-1 bg-[#FAF7F2] border border-[#E8DFD1] text-[#341306] rounded-xl p-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#c96529] font-sans resize-none"
            />
          </div>
        </div>

        {/* Custom AI Instruction Bar */}
        <div className="mb-4">
          <div className="flex items-center space-x-2.5">
            <input
              type="text"
              value={quickPrompt}
              onChange={e => setQuickPrompt(e.target.value)}
              placeholder="Type custom instruction (e.g. 'Add a humorous anecdote about remote meetings')..."
              className="flex-1 bg-[#FAF7F2] border border-[#E8DFD1] text-[#341306] placeholder-[#945c3c]/50 text-xs rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#c96529]"
            />
            <button
              onClick={() => handleQuickAiInstruction(quickPrompt)}
              disabled={!quickPrompt.trim() || isApplyingAiEdit}
              className="px-5 py-2.5 bg-[#c96529] hover:bg-[#b3551d] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-widest rounded-full flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              {isApplyingAiEdit ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4" />}
              <span>Apply Instruction</span>
            </button>
            <button
              onClick={handleFullReRun}
              disabled={isApplyingAiEdit}
              className="px-4 py-2.5 bg-[#FAF7F2] hover:bg-[#F2EAE0] text-[#341306] text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5 border border-[#E8DFD1] transition-colors"
              title="Full AI Agent Re-humanize"
            >
              <RefreshCw className={`w-4 h-4 text-[#c96529] ${isApplyingAiEdit ? 'animate-spin' : ''}`} />
              <span>Full Re-run</span>
            </button>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E8DFD1]">
          <div className="text-xs text-[#945c3c] flex items-center gap-1.5 font-medium">
            <FileCheck className="w-4 h-4 text-[#c96529]" />
            <span>Manual inline edits are automatically included when approving.</span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#945c3c] hover:text-[#341306] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApproveAndSave}
              className="px-6 py-2.5 bg-[#c96529] hover:bg-[#b3551d] text-white text-xs font-bold uppercase tracking-widest rounded-full flex items-center gap-2 transition-all shadow-md shadow-[#c96529]/20"
            >
              <Check className="w-4 h-4" />
              <span>Approve & Save Changes</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
