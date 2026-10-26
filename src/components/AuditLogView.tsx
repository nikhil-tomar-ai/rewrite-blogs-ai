import React from 'react';
import { ShieldCheck, Download, Trash2, Award, Clock } from 'lucide-react';
import { AuditLogEntry } from '../types';
import { triggerFileDownload } from '../utils/csvUtils';
import Papa from 'papaparse';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
  onClearLogs: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs, onClearLogs }) => {
  const handleExportAuditCSV = () => {
    if (logs.length === 0) return;
    const csvContent = Papa.unparse(logs);
    triggerFileDownload(csvContent, `audit_log_checkpoints_${Date.now()}.csv`);
  };

  return (
    <div className="bg-white dark:bg-[#15181e] border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs mb-8 text-neutral-900 dark:text-neutral-100 transition-colors">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-4 mb-5 border-b border-neutral-200 dark:border-neutral-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Audit Checkpoint Trail</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
              Cryptographic and model execution records for quality control and compliance.
            </p>
          </div>
        </div>

        {logs.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAuditCSV}
              className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit CSV</span>
            </button>
            <button
              onClick={onClearLogs}
              className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors border border-rose-200 dark:border-rose-900/50"
              title="Clear Audit History"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#12151b] rounded-xl">
          <ShieldCheck className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            No Checkpoint Entries Yet
          </p>
          <p className="text-[11px] text-neutral-500 max-w-sm mx-auto mt-0.5">
            As you process rows with AI, completed humanized rewrites will log here with critic scores and timestamps.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-100 dark:bg-[#181c24] text-neutral-600 dark:text-neutral-300 font-mono text-[11px] border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Row ID</th>
                <th className="py-2.5 px-3">Blog Title</th>
                <th className="py-2.5 px-3">Tone / Style</th>
                <th className="py-2.5 px-3 text-right">Words (Orig → Rev)</th>
                <th className="py-2.5 px-3 text-center">Critic Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-mono text-xs">
              {logs.map((log) => {
                const origWords =
                  log.wordCountOriginal ??
                  (log.originalContent ? log.originalContent.trim().split(/\s+/).filter(Boolean).length : 0);
                const humanWords =
                  log.wordCountHumanized ??
                  (log.humanizedContent ? log.humanizedContent.trim().split(/\s+/).filter(Boolean).length : 0);

                return (
                  <tr
                    key={log.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-900/60 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-neutral-500 whitespace-nowrap text-[11px] tabular-nums">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-400 text-[11px]">#{log.rowIndex + 1}</td>
                    <td className="py-2.5 px-3 font-medium text-neutral-900 dark:text-neutral-100 max-w-xs truncate font-sans">
                      {log.title}
                    </td>
                    <td className="py-2.5 px-3 capitalize text-neutral-600 dark:text-neutral-400 text-[11px]">
                      {log.tone}
                    </td>
                    <td className="py-2.5 px-3 text-right text-neutral-600 dark:text-neutral-400 tabular-nums text-[11px]">
                      {origWords} → {humanWords}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                        {log.criticScore}/100
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
