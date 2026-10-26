import React from 'react';
import {
  SlidersHorizontal,
  Play,
  ShieldCheck,
  Tag,
  CheckCircle,
  Cpu,
  Sparkles,
  Clock,
  Timer
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
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    onChangeConfig({ ...config, preserveKeywords: kw });
  };

  const isAllColumnsSelected =
    !config.targetColumns ||
    config.targetColumns.includes('*') ||
    (allHeaders.length > 0 && config.targetColumns.length === allHeaders.length);

  const handleToggleColumn = (colHeader: string) => {
    let currentCols = config.targetColumns.includes('*') ? [...allHeaders] : [...config.targetColumns];

    if (currentCols.includes(colHeader)) {
      currentCols = currentCols.filter((c) => c !== colHeader);
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
    <div className="bg-white dark:bg-[#15181e] border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs mb-5 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            AI Processing Directives
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Ollama / Gemini Flash Ready</span>
        </div>
      </div>

      {/* Target Column Selectors */}
      {allHeaders.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-neutral-50 dark:bg-[#11141a] border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Columns to Rewrite:
            </span>
            <button
              type="button"
              onClick={() =>
                onChangeConfig({
                  ...config,
                  targetColumns: isAllColumnsSelected
                    ? [config.contentColumn || allHeaders[0]]
                    : ['*']
                })
              }
              className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {isAllColumnsSelected ? 'Select primary only' : 'Select all columns'}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {allHeaders.map((hdr) => {
              const isSelected =
                config.targetColumns?.includes('*') || config.targetColumns?.includes(hdr);
              return (
                <button
                  key={hdr}
                  type="button"
                  onClick={() => handleToggleColumn(hdr)}
                  className={`text-[11px] font-mono px-2.5 py-1 rounded-md border transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60 font-semibold'
                      : 'bg-white dark:bg-[#181c24] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-indigo-600' : 'bg-neutral-300'}`} />
                  <span>{hdr}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tone & Style Segmented Control */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
          Writing Voice & Cadence:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TONE_OPTIONS.map((opt) => {
            const isSelected = config.tone === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleToneChange(opt.id)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#14171d] text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <p className="text-xs font-semibold">{opt.name}</p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders & Keywords Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-4">
        {/* Keywords Input */}
        <div>
          <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5">
            Preserve Specific Keywords:
          </label>
          <input
            type="text"
            placeholder="e.g. SEO, AI Studio, LLM"
            value={config.preserveKeywords.join(', ')}
            onChange={handleKeywordsChange}
            className="w-full bg-neutral-50 dark:bg-[#181c24] border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Creativity Slider */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Creativity (Temperature):
            </span>
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {config.temperature}
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="1.0"
            step="0.05"
            value={config.temperature}
            onChange={(e) => onChangeConfig({ ...config, temperature: parseFloat(e.target.value) })}
            className="w-full accent-indigo-600"
          />
        </div>

        {/* Concurrency Slider */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Batch Concurrency:
            </span>
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {config.batchConcurrency} parallel workers
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={config.batchConcurrency}
            onChange={(e) => onChangeConfig({ ...config, batchConcurrency: parseInt(e.target.value) })}
            className="w-full accent-indigo-600"
          />
        </div>
      </div>

      {/* RPM Rate Limiter & Request Wait Function */}
      <div className="mb-4 p-3.5 rounded-lg bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              RPM Rate Limit Pacing & Waiting Function:
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800/40">
              Auto Rate Guard Active
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-neutral-500">Wait interval:</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {((config.batchDelayMs ?? 250) / 1000).toFixed(1)}s per request
            </span>
            <span className="text-neutral-400">
              (~{config.batchDelayMs ? Math.round(60 / Math.max(0.1, config.batchDelayMs / 1000)) : '∞'} RPM)
            </span>
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              onChangeConfig({
                ...config,
                batchDelayMs: 12000,
                rateLimitRpm: 5,
                batchConcurrency: 1
              })
            }
            className={`px-2.5 py-1 text-xs rounded-md border font-mono transition-colors ${
              config.batchDelayMs === 12000
                ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-xs'
                : 'bg-white dark:bg-[#181c24] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100'
            }`}
          >
            🐢 Free Tier Safe (5 RPM · 12s wait)
          </button>
          <button
            type="button"
            onClick={() =>
              onChangeConfig({
                ...config,
                batchDelayMs: 4000,
                rateLimitRpm: 15,
                batchConcurrency: 1
              })
            }
            className={`px-2.5 py-1 text-xs rounded-md border font-mono transition-colors ${
              config.batchDelayMs === 4000
                ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-xs'
                : 'bg-white dark:bg-[#181c24] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100'
            }`}
          >
            ⚡ Standard Tier (15 RPM · 4s wait)
          </button>
          <button
            type="button"
            onClick={() =>
              onChangeConfig({
                ...config,
                batchDelayMs: 2000,
                rateLimitRpm: 30,
                batchConcurrency: 2
              })
            }
            className={`px-2.5 py-1 text-xs rounded-md border font-mono transition-colors ${
              config.batchDelayMs === 2000
                ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-xs'
                : 'bg-white dark:bg-[#181c24] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100'
            }`}
          >
            🚀 Fast Pacing (30 RPM · 2s wait)
          </button>
          <button
            type="button"
            onClick={() =>
              onChangeConfig({
                ...config,
                batchDelayMs: 0,
                rateLimitRpm: 0
              })
            }
            className={`px-2.5 py-1 text-xs rounded-md border font-mono transition-colors ${
              config.batchDelayMs === 0
                ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-xs'
                : 'bg-white dark:bg-[#181c24] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100'
            }`}
          >
            ⚡ No Wait (0s delay)
          </button>
        </div>

        {/* Custom Seconds Slider */}
        <div className="mt-2.5 pt-2 border-t border-indigo-100 dark:border-indigo-900/30 flex items-center gap-3">
          <span className="text-[11px] text-neutral-500 font-mono shrink-0">Custom Wait Duration:</span>
          <input
            type="range"
            min="0"
            max="20"
            step="1"
            value={Math.round((config.batchDelayMs ?? 250) / 1000)}
            onChange={(e) => {
              const sec = parseInt(e.target.value);
              const ms = sec * 1000;
              const rpm = sec > 0 ? Math.round(60 / sec) : 0;
              onChangeConfig({ ...config, batchDelayMs: ms, rateLimitRpm: rpm });
            }}
            className="flex-1 accent-indigo-600"
          />
          <span className="text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200 w-12 text-right">
            {Math.round((config.batchDelayMs ?? 250) / 1000)}s
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
          <span>{(totalCount || 0).toLocaleString()} total rows</span>
          {(selectedCount || 0) > 0 && <span>· {(selectedCount || 0).toLocaleString()} selected</span>}
        </div>

        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <button
              onClick={() => onStartBatch(true)}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Process Selected ({selectedCount})</span>
            </button>
          )}

          <button
            onClick={() => onStartBatch(false)}
            disabled={isProcessing || totalCount === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Full Batch ({totalCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
