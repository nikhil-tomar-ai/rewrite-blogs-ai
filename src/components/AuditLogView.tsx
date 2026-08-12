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
    <div className="bg-[#FFFFFF] border border-[#E8DFD1] rounded-[24px] p-6 shadow-sm mb-8 text-[#341306]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b border-[#E8DFD1] gap-3">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#c96529] text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-[#341306]">Agent Audit Checkpoint Log</h3>
            <p className="text-xs text-[#945c3c] font-medium">
              Persistent checkpoint records for compliance, verification, and audit review.
            </p>
          </div>
        </div>

        {logs.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportAuditCSV}
              className="px-4 py-2 bg-[#FAF7F2] hover:bg-[#F2EAE0] text-[#341306] text-xs font-bold uppercase tracking-wider rounded-full border border-[#E8DFD1] flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Download className="w-4 h-4 text-[#c96529]" />
              <span>Export Audit CSV</span>
            </button>
            <button
              onClick={onClearLogs}
              className="p-2 text-rose-700 hover:bg-rose-50 rounded-full transition-colors border border-rose-200"
              title="Clear Audit History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[#E8DFD1] bg-[#FAF7F2]/60 rounded-2xl">
          <ShieldCheck className="w-12 h-12 text-[#945c3c]/40 mx-auto mb-3" />
          <h4 className="font-serif text-base font-bold text-[#341306]">No Checkpoint Audit Entries Yet</h4>
          <p className="text-xs text-[#945c3c] max-w-sm mx-auto mt-1 font-medium">
            As you process blog CSV rows, completed humanized rewrites will automatically register here with critic scores and timestamps.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#341306]">
            <thead className="bg-[#FAF7F2] text-[#945c3c] uppercase font-bold text-[10px] tracking-widest border-b border-[#E8DFD1]">
              <tr>
                <th className="p-3.5">Time</th>
                <th className="p-3.5">File / Row</th>
                <th className="p-3.5">Title</th>
                <th className="p-3.5">Tone Persona</th>
                <th className="p-3.5">Human Score</th>
                <th className="p-3.5">Humanized Text Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DFD1]/60">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#FAF7F2]/80 transition-colors">
                  <td className="p-3.5 font-mono text-[11px] text-[#945c3c] whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#945c3c]/60" />
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </td>

                  <td className="p-3.5 font-mono text-[11px] text-[#c96529] font-semibold">
                    Row #{log.rowIndex + 1}
                    <div className="text-[10px] text-[#945444] truncate max-w-[100px] font-normal">
                      {log.filename}
                    </div>
                  </td>

                  <td className="p-3.5 max-w-[160px] font-bold text-[#341306] truncate font-serif">
                    {log.title || 'Untitled'}
                  </td>

                  <td className="p-3.5 capitalize font-mono text-[#945c3c] text-[11px]">
                    {log.tone}
                  </td>

                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#c96529] text-white rounded-full text-[10px] font-bold shadow-2xs">
                      <Award className="w-3 h-3 text-white" /> {log.criticScore}%
                    </span>
                  </td>

                  <td className="p-3.5 max-w-[280px]">
                    <p className="line-clamp-2 text-[#341306] text-[11px]">
                      {log.humanizedContent}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
