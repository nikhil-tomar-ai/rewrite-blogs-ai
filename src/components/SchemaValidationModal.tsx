import React from 'react';
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  X,
  Layers
} from 'lucide-react';
import { ValidationReport } from '../utils/csvUtils';

interface SchemaValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ValidationReport | null;
  onConfirmDownload?: () => void;
  filename?: string;
}

export const SchemaValidationModal: React.FC<SchemaValidationModalProps> = ({
  isOpen,
  onClose,
  report,
  onConfirmDownload,
  filename = 'export.csv'
}) => {
  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#15181e] border border-neutral-200 dark:border-neutral-800 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 text-neutral-900 dark:text-neutral-100 transition-colors">
        {/* Header */}
        <div className="p-5 bg-neutral-50/50 dark:bg-[#12151b] border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                report.isValid
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40'
              }`}
            >
              {report.isValid ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                CSV Export Schema Validation
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                Verifying dataset schema & data integrity for <span className="font-semibold text-neutral-800 dark:text-neutral-200">{filename}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5">
          {/* Status Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              report.isValid
                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-300'
                : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 text-rose-900 dark:text-rose-300'
            }`}
          >
            {report.isValid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-xs font-semibold">
                {report.isValid
                  ? '100% Original Schema Preserved'
                  : 'Data Integrity Discrepancy Detected'}
              </div>
              <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed font-sans">
                {report.isValid
                  ? `All ${report.originalColumnCount} original columns, exact column order, and ${report.originalRowCount} rows are fully preserved. AI humanized content appended safely in 'humanized_content'.`
                  : 'The exported CSV failed schema validation checks. Download blocked to protect data integrity.'}
              </p>
            </div>
          </div>

          {/* Validation Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-neutral-50 dark:bg-[#12151b] p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg text-center font-mono">
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Original Columns</div>
              <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">{report.originalColumnCount}</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">100% Included</div>
            </div>

            <div className="bg-neutral-50 dark:bg-[#12151b] p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg text-center font-mono">
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Export Columns</div>
              <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">{report.exportedColumnCount}</div>
              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">+{report.exportedColumnCount - report.originalColumnCount} Appended</div>
            </div>

            <div className="bg-neutral-50 dark:bg-[#12151b] p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg text-center font-mono">
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Total Rows</div>
              <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">{report.originalRowCount}</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Count Verified</div>
            </div>

            <div className="bg-neutral-50 dark:bg-[#12151b] p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg text-center font-mono">
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Original Data</div>
              <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">100%</div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Zero Loss</div>
            </div>
          </div>

          {/* Column Structure Comparison Table */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-[#15181e]">
            <div className="px-3.5 py-2.5 bg-neutral-50 dark:bg-[#12151b] border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Column Order & Mapping Audit
                </span>
              </div>
              <span className="text-[11px] font-mono text-neutral-400">
                {report.exportedColumnCount} Total Export Columns
              </span>
            </div>

            <div className="max-h-52 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 dark:bg-[#181c24] text-neutral-600 dark:text-neutral-300 text-[11px] font-mono border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="p-2 w-10 text-center">#</th>
                    <th className="p-2">Original Header</th>
                    <th className="p-2">Export Header</th>
                    <th className="p-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono text-[11px]">
                  {report.exportedHeaders.map((colName, idx) => {
                    const isOriginal = idx < report.originalColumnCount;
                    const origHeader = report.originalHeaders[idx] || '—';
                    const isMatch = isOriginal && origHeader === colName;

                    return (
                      <tr key={idx} className={isOriginal ? 'hover:bg-neutral-50 dark:hover:bg-neutral-900/50' : 'bg-neutral-50/40 dark:bg-neutral-900/20'}>
                        <td className="p-2 text-center text-neutral-400">{idx + 1}</td>
                        <td className="p-2 text-neutral-800 dark:text-neutral-200">
                          {isOriginal ? (
                            <span className="font-medium text-emerald-700 dark:text-emerald-400">{origHeader}</span>
                          ) : (
                            <span className="text-neutral-400 italic">None (Appended)</span>
                          )}
                        </td>
                        <td className="p-2 font-medium text-neutral-900 dark:text-neutral-100">
                          <span className={isOriginal ? 'text-neutral-800 dark:text-neutral-200' : 'text-indigo-600 dark:text-indigo-400 font-semibold'}>
                            {colName}
                          </span>
                        </td>
                        <td className="p-2 text-right">
                          {isMatch ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-sans font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Preserved
                            </span>
                          ) : !isOriginal ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-sans font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/40">
                              + AI Generated
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-sans font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800/40">
                              Mismatch
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Validation Errors List (if any) */}
          {report.errors.length > 0 && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-lg p-3 text-xs text-rose-800 dark:text-rose-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5" /> Validation Discrepancies:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] opacity-90 pl-1">
                {report.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-neutral-50/50 dark:bg-[#12151b] border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 font-mono">
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
            <span>Ready to download complete dataset</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-white dark:bg-[#181c24] hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-semibold transition-colors"
            >
              Close
            </button>

            {report.isValid && onConfirmDownload && (
              <button
                onClick={() => {
                  onConfirmDownload();
                  onClose();
                }}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Verified CSV</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
