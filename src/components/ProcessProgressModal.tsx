import React from 'react';
import { Loader2, Pause, Play, XCircle, CheckCircle2, Sparkles, Terminal } from 'lucide-react';
import { BatchProcessingStats } from '../types';

interface ProcessProgressModalProps {
  stats: BatchProcessingStats;
  currentTitle: string;
  logs: string[];
  onPauseToggle: () => void;
  onCancel: () => void;
  onClose: () => void;
}

export const ProcessProgressModal: React.FC<ProcessProgressModalProps> = ({
  stats,
  currentTitle,
  logs,
  onPauseToggle,
  onCancel,
  onClose
}) => {
  if (!stats.isProcessing && stats.completedRows === 0) return null;

  const percent = stats.totalRows > 0 ? Math.round((stats.completedRows / stats.totalRows) * 100) : 0;
  const isFinished = !stats.isProcessing && stats.completedRows > 0;

  return (
    <div className="fixed inset-0 bg-[#341306]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#FFFFFF] border border-[#E8DFD1] rounded-[28px] max-w-xl w-full p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#341306]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8DFD1]">
          <div className="flex items-center space-x-3.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isFinished
                  ? 'bg-[#c96529] text-white shadow-md'
                  : 'bg-[#FAF7F2] text-[#341306] border border-[#E8DFD1]'
              }`}
            >
              {isFinished ? (
                <CheckCircle2 className="w-6 h-6 text-white" />
              ) : (
                <Loader2 className="w-6 h-6 animate-spin text-[#c96529]" />
              )}
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-[#341306]">
                {isFinished ? 'Batch Humanization Complete!' : stats.isPaused ? 'Processing Paused' : 'Humanizing Blog CSV Batch'}
              </h3>
              <p className="text-xs text-[#945c3c] font-medium">
                {stats.completedRows} of {stats.totalRows} rows processed
              </p>
            </div>
          </div>

          {isFinished && (
            <button
              onClick={onClose}
              className="p-2 text-[#945c3c] hover:text-[#341306] hover:bg-[#FAF7F2] rounded-full transition-colors border border-[#E8DFD1]"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress Bar & Status */}
        <div className="py-5">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
            <span className="text-[#945c3c]">Batch Progress</span>
            <span className="text-[#c96529] font-mono font-bold">{percent}%</span>
          </div>

          <div className="w-full bg-[#FAF7F2] h-3 rounded-full overflow-hidden p-0.5 border border-[#E8DFD1]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isFinished
                  ? 'bg-[#c96529]'
                  : 'bg-[#c96529]'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>

          {/* Current Row Item Indicator */}
          {!isFinished && (
            <div className="mt-3.5 bg-[#FAF7F2] p-3.5 border border-[#E8DFD1] rounded-2xl flex items-center gap-2.5 text-xs shadow-2xs">
              <Sparkles className="w-4 h-4 text-[#c96529] shrink-0 animate-pulse" />
              <div className="truncate text-[#341306] font-medium">
                <span className="text-[#945c3c] mr-1 font-semibold">Current:</span>
                {currentTitle || 'Processing next row...'}
              </div>
            </div>
          )}
        </div>

        {/* Live Agent Terminal Logs */}
        <div className="flex-1 bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl p-3.5 font-mono text-[11px] overflow-y-auto max-h-48 mb-5 space-y-1.5 text-[#341306] shadow-inner">
          <div className="text-[#945c3c] font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 pb-2 border-b border-[#E8DFD1] sticky top-0 bg-[#FAF7F2] z-10">
            <Terminal className="w-3.5 h-3.5 text-[#c96529]" />
            <span>Agent Processing Stream</span>
          </div>
          {logs.map((log, idx) => (
            <div key={idx} className="leading-snug">
              {log.includes('✓') ? (
                <span className="text-emerald-700 font-semibold">{log}</span>
              ) : log.includes('✕') ? (
                <span className="text-rose-700 font-semibold">{log}</span>
              ) : (
                <span>{log}</span>
              )}
            </div>
          ))}
        </div>

        {/* Modal Action Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E8DFD1]">
          {!isFinished ? (
            <>
              <button
                onClick={onCancel}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-full flex items-center gap-1.5 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel Processing</span>
              </button>

              <button
                onClick={onPauseToggle}
                className="px-5 py-2 bg-[#FAF7F2] hover:bg-[#F2EAE0] text-[#341306] text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5 transition-colors border border-[#E8DFD1]"
              >
                {stats.isPaused ? (
                  <>
                    <Play className="w-4 h-4 text-[#c96529]" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 text-[#945c3c]" />
                    <span>Pause</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3 bg-[#c96529] hover:bg-[#b3551d] text-white font-bold uppercase tracking-widest text-xs rounded-full transition-all shadow-md shadow-[#c96529]/20"
            >
              Close & View Results
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
