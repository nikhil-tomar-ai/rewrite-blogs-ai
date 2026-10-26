import React from 'react';
import {
  Loader2,
  Pause,
  Play,
  X,
  CheckCircle2,
  Sparkles,
  Terminal,
  Clock,
  Zap,
  AlertCircle
} from 'lucide-react';
import { BatchProcessingStats } from '../types';

interface ProcessProgressModalProps {
  stats: BatchProcessingStats;
  currentTitle: string;
  logs: string[];
  onPauseToggle: () => void;
  onCancel: () => void;
  onClose: () => void;
  onRetryFailed?: () => void;
}

export const ProcessProgressModal: React.FC<ProcessProgressModalProps> = ({
  stats,
  currentTitle,
  logs,
  onPauseToggle,
  onCancel,
  onClose,
  onRetryFailed
}) => {
  if (!stats.isProcessing && stats.completedRows === 0) return null;

  const percent = stats.totalRows > 0 ? Math.round((stats.completedRows / stats.totalRows) * 100) : 0;
  const isFinished = !stats.isProcessing && stats.completedRows > 0;
  const remaining = Math.max(0, stats.totalRows - stats.completedRows);

  // Compute operational timing
  const elapsedSeconds = stats.startTime
    ? Math.max(1, Math.round(((stats.endTime || Date.now()) - stats.startTime) / 1000))
    : 1;
  const rowsPerSec = stats.completedRows > 0 ? (stats.completedRows / elapsedSeconds).toFixed(1) : '0.0';
  const remainingSeconds =
    stats.completedRows > 0 && remaining > 0
      ? Math.round(remaining / (stats.completedRows / elapsedSeconds))
      : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#15181e] border border-neutral-200 dark:border-neutral-800 rounded-xl max-w-xl w-full p-5 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-neutral-900 dark:text-neutral-100 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isFinished
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
              }`}
            >
              {isFinished ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold">
                {isFinished
                  ? 'Batch Humanization Complete'
                  : stats.isPaused
                  ? 'Processing Paused'
                  : 'Humanizing Content Records'}
              </h3>
              <p className="text-[11px] text-neutral-500 font-mono">
                {(stats?.completedRows || 0).toLocaleString()} / {(stats?.totalRows || 0).toLocaleString()} rows processed
              </p>
            </div>
          </div>

          {isFinished && (
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Progress Bar & Status */}
        <div className="py-4 space-y-2.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-neutral-500">Progress</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {percent}%
            </span>
          </div>

          <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>

          {/* Operational Metrics Grid */}
          <div className="grid grid-cols-4 gap-2 pt-2 text-center font-mono">
            <div className="p-2 rounded-lg bg-neutral-50 dark:bg-[#12151b] border border-neutral-200 dark:border-neutral-800">
              <p className="text-[10px] text-neutral-400">Completed</p>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {stats.successfulRows}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-neutral-50 dark:bg-[#12151b] border border-neutral-200 dark:border-neutral-800">
              <p className="text-[10px] text-neutral-400">Failed</p>
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                {stats.failedRows}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-neutral-50 dark:bg-[#12151b] border border-neutral-200 dark:border-neutral-800">
              <p className="text-[10px] text-neutral-400">Throughput</p>
              <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300 tabular-nums">
                {rowsPerSec}/s
              </p>
            </div>
            <div className="p-2 rounded-lg bg-neutral-50 dark:bg-[#12151b] border border-neutral-200 dark:border-neutral-800">
              <p className="text-[10px] text-neutral-400">Est. Left</p>
              <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300 tabular-nums">
                {remainingSeconds > 0 ? `${remainingSeconds}s` : isFinished ? '0s' : '--'}
              </p>
            </div>
          </div>

          {/* Current Row Indicator */}
          {!isFinished && (
            <div className="p-2.5 bg-neutral-50 dark:bg-[#12151b] border border-neutral-200 dark:border-neutral-800 rounded-lg flex items-center gap-2 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0 animate-pulse" />
              <div className="truncate font-mono text-[11px] text-neutral-600 dark:text-neutral-300">
                <span className="text-neutral-400 mr-1">Active:</span>
                {currentTitle || 'Preparing model execution...'}
              </div>
            </div>
          )}

          {/* RPM Rate Limit Cooldown Waiting Indicator */}
          {!isFinished && stats.waitingCountdownSeconds && stats.waitingCountdownSeconds > 0 && (
            <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg flex items-center justify-between text-xs animate-pulse shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin" />
                </div>
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <span>RPM Quota Guard Pacing</span>
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 font-mono">
                    {stats.waitingReason || 'Waiting between requests to avoid exceeding model rate limit'}
                  </p>
                </div>
              </div>
              <div className="text-right pl-3 font-mono">
                <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                  {stats.waitingCountdownSeconds}s
                </span>
                <span className="block text-[9px] text-amber-600/80 dark:text-amber-400/80 uppercase font-semibold">
                  cooling down
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Live Terminal Logs */}
        <div className="flex-1 bg-neutral-900 text-neutral-200 border border-neutral-800 rounded-lg p-3 font-mono text-[11px] overflow-y-auto max-h-44 mb-4 space-y-1">
          <div className="text-neutral-500 font-bold uppercase text-[10px] flex items-center gap-1.5 pb-1 border-b border-neutral-800 sticky top-0 bg-neutral-900">
            <Terminal className="w-3 h-3 text-indigo-400" />
            <span>Execution Terminal</span>
          </div>
          {logs.length === 0 ? (
            <p className="text-neutral-500 italic">Initializing runner...</p>
          ) : (
            logs.map((line, idx) => (
              <div key={idx} className="leading-tight break-all font-mono">
                {line}
              </div>
            ))
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-200 dark:border-neutral-800">
          {!isFinished ? (
            <>
              <button
                onClick={onPauseToggle}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                {stats.isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </>
                )}
              </button>

              <button
                onClick={onCancel}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                Cancel Batch
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 w-full">
              {stats.failedRows > 0 && onRetryFailed && (
                <button
                  onClick={onRetryFailed}
                  className="flex-1 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Retry Failed ({stats.failedRows})</span>
                </button>
              )}
              <button
                onClick={onClose}
                className={`${
                  stats.failedRows > 0 ? 'flex-1' : 'w-full'
                } py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs`}
              >
                Review Results in Workspace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
