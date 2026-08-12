import React from 'react';
import {
  Coffee,
  Zap,
  Briefcase,
  BookOpen,
  Flame,
  Smile,
  GraduationCap,
  SlidersHorizontal,
  Play,
  ShieldCheck,
  Tag,
  CheckCircle
} from 'lucide-react';
import { HumanizerConfig, TonePreset } from '../types';
import { TONE_OPTIONS } from '../data/sampleBlogs';

interface ConfigPanelProps {
  config: HumanizerConfig;
  onChangeConfig: (newConfig: HumanizerConfig) => void;
  onStartBatch: (selectedOnly: boolean) => void;
  selectedCount: number;
  totalCount: number;
  isProcessing: boolean;
  allHeaders?: string[];
}

const ICON_MAP: Record<string, React.ElementType> = {
  Coffee,
  Zap,
  Briefcase,
  BookOpen,
  Flame,
  Smile,
  GraduationCap,
  SlidersHorizontal
};

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  onChangeConfig,
  onStartBatch,
  selectedCount,
  totalCount,
  isProcessing,
  allHeaders = []
}) => {
  const handleToneChange = (tone: TonePreset) => {
    onChangeConfig({ ...config, tone });
  };

  const handleKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const kw = e.target.value
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    onChangeConfig({ ...config, preserveKeywords: kw });
  };

  const isAllColumnsSelected =
    !config.targetColumns ||
    config.targetColumns.includes('*') ||
    (allHeaders.length > 0 && config.targetColumns.length === allHeaders.length);

  const handleToggleColumn = (colHeader: string) => {
    let currentCols = config.targetColumns.includes('*') ? [...allHeaders] : [...config.targetColumns];

    if (currentCols.includes(colHeader)) {
      currentCols = currentCols.filter(c => c !== colHeader);
    } else {
      currentCols.push(colHeader);
    }

    if (currentCols.length === allHeaders.length) {
      onChangeConfig({ ...config, targetColumns: ['*'] });
    } else {
      onChangeConfig({ ...config, targetColumns: currentCols });
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E8DFD1] rounded-[24px] p-6 shadow-sm mb-6 text-[#341306]">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#E8DFD1]">
        <div className="flex items-center space-x-2.5">
          <SlidersHorizontal className="w-5 h-5 text-[#c96529]" />
          <h2 className="font-serif text-lg font-bold text-[#341306] tracking-tight">
            AI Agent Editorial Directives
          </h2>
        </div>
        <span className="text-xs text-[#945c3c] font-mono font-medium">Local & Open Source LLM Engine</span>
      </div>

      {/* Target Columns Selection Bar */}
      {allHeaders.length > 0 && (
        <div className="mb-6 p-4 bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <label className="block text-xs font-bold text-[#341306]">
                Target CSV Columns to Humanize / Rewrite:
              </label>
              <p className="text-[10px] text-[#945c3c]">
                Choose whether to rewrite all columns or select specific columns from your dataset.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => onChangeConfig({ ...config, targetColumns: ['*'] })}
                className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors ${
                  isAllColumnsSelected
                    ? 'bg-[#c96529] text-white border-[#c96529] shadow-2xs'
                    : 'bg-[#FFFFFF] text-[#945c3c] border-[#E8DFD1] hover:bg-[#F2EAE0] hover:text-[#341306]'
                }`}
              >
                ✨ Select All Columns ({allHeaders.length})
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E8DFD1]/80">
            {allHeaders.map(colHeader => {
              const isChecked =
                isAllColumnsSelected || config.targetColumns.includes(colHeader);

              return (
                <button
                  key={colHeader}
                  type="button"
                  onClick={() => handleToggleColumn(colHeader)}
                  className={`px-3 py-1 text-xs font-medium rounded-full border flex items-center gap-1.5 transition-all ${
                    isChecked
                      ? 'bg-[#c96529]/10 border-[#c96529] text-[#341306] font-semibold'
                      : 'bg-[#FFFFFF] border-[#E8DFD1] text-[#945c3c] hover:text-[#341306]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isChecked ? 'bg-[#c96529]' : 'bg-[#E8DFD1]'}`} />
                  <span>{colHeader}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tone Selection Grid */}
      <div className="mb-6">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#945c3c] mb-3">
          Select Tone & Style Persona:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TONE_OPTIONS.map(opt => {
            const IconComp = ICON_MAP[opt.iconName] || Coffee;
            const isSelected = config.tone === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleToneChange(opt.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                  isSelected
                    ? 'bg-[#FAF7F2] border-2 border-[#c96529] text-[#341306] shadow-sm'
                    : 'bg-[#FFFFFF] hover:bg-[#FAF7F2]/60 border-[#E8DFD1] text-[#341306]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-[#c96529] text-white' : 'bg-[#FAF7F2] text-[#945c3c]'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                  {isSelected && <CheckCircle className="w-4 h-4 text-[#c96529]" />}
                </div>
                <div className="text-xs font-bold leading-tight">{opt.name}</div>
                <div className="text-[10px] text-[#945c3c] mt-1 line-clamp-2 leading-snug">
                  {opt.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Prompt Textarea (if Custom tone selected) */}
      {config.tone === 'custom' && (
        <div className="mb-6 bg-[#FAF7F2] p-4 border border-[#E8DFD1] rounded-2xl">
          <label className="block text-xs font-bold text-[#341306] mb-1.5">
            Custom Style Directives / Persona Instructions:
          </label>
          <textarea
            value={config.customPrompt}
            onChange={e => onChangeConfig({ ...config, customPrompt: e.target.value })}
            placeholder="e.g. Write like an experienced investigative tech journalist for Wired. Use punchy subheadings and subtle humor."
            rows={2}
            className="w-full bg-[#FFFFFF] border border-[#E8DFD1] rounded-xl p-3 text-xs text-[#341306] placeholder-[#945c3c]/50 focus:outline-none focus:ring-2 focus:ring-[#c96529]"
          />
        </div>
      )}

      {/* Fine-Tuning Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6 p-4 bg-[#FAF7F2]/80 border border-[#E8DFD1] rounded-2xl">
        {/* Temperature / Creativity Slider */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-[#341306] mb-1.5">
            <span className="flex items-center gap-1">
              Creativity (Temperature):
            </span>
            <span className="font-mono text-[#c96529]">{config.temperature.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={config.temperature}
            onChange={e => onChangeConfig({ ...config, temperature: parseFloat(e.target.value) })}
            className="w-full accent-[#c96529] h-1.5 bg-[#E8DFD1] rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#945c3c] mt-1 font-medium">
            <span>Deterministic (0.1)</span>
            <span>Balanced (0.7)</span>
            <span>Creative (1.0)</span>
          </div>
        </div>

        {/* AI Critic Loop Toggle */}
        <div className="flex flex-col justify-center">
          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enableCritic}
              onChange={e => onChangeConfig({ ...config, enableCritic: e.target.checked })}
              className="w-4 h-4 text-[#c96529] rounded border-[#E8DFD1] bg-[#FFFFFF] focus:ring-[#c96529]"
            />
            <div>
              <span className="text-xs font-bold text-[#341306] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#c96529]" /> Auto AI Critic & Refine Loop
              </span>
              <p className="text-[10px] text-[#945c3c]">
                Evaluates human-likeness score (0-100%). Rewrites if score &lt; 75%.
              </p>
            </div>
          </label>
        </div>

        {/* Preserve Keywords Input */}
        <div>
          <label className="block text-xs font-bold text-[#341306] mb-1 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-[#c96529]" /> Preserve Keywords:
          </label>
          <input
            type="text"
            value={config.preserveKeywords.join(', ')}
            onChange={handleKeywordsChange}
            placeholder="e.g. SaaS, ROI, Growth, React"
            className="w-full bg-[#FFFFFF] border border-[#E8DFD1] rounded-xl px-3 py-1.5 text-xs text-[#341306] placeholder-[#945c3c]/50 focus:outline-none focus:ring-2 focus:ring-[#c96529]"
          />
          <span className="text-[10px] text-[#945c3c] mt-1 block">Comma separated words to preserve verbatim.</span>
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E8DFD1]">
        <div className="text-xs text-[#945c3c] font-medium">
          Ready to process <span className="font-bold text-[#341306]">{totalCount}</span> total rows
          {selectedCount > 0 && (
            <span> (<span className="text-[#c96529] font-bold">{selectedCount}</span> selected)</span>
          )}
        </div>

        <div className="flex items-center space-x-2.5">
          {selectedCount > 0 && (
            <button
              id="humanize-selected-btn"
              onClick={() => onStartBatch(true)}
              disabled={isProcessing}
              className="px-5 py-2.5 bg-[#FAF7F2] hover:bg-[#F2EAE0] border border-[#E8DFD1] disabled:opacity-50 text-[#341306] text-xs font-bold uppercase tracking-widest rounded-full flex items-center gap-2 transition-all shadow-2xs"
            >
              <Play className="w-3.5 h-3.5 fill-current text-[#c96529]" />
              <span>Humanize {selectedCount} Selected</span>
            </button>
          )}

          <button
            id="humanize-all-btn"
            onClick={() => onStartBatch(false)}
            disabled={isProcessing || totalCount === 0}
            className="px-6 py-2.5 bg-[#c96529] hover:bg-[#b3551d] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-widest rounded-full flex items-center gap-2 transition-all shadow-md shadow-[#c96529]/20"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Humanize All {totalCount} Rows</span>
          </button>
        </div>
      </div>
    </div>
  );
};
