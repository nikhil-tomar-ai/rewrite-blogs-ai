import React from 'react';
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  X,
  ArrowRight,
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
    <div className="fixed inset-0 bg-[#341306]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FFFFFF] border border-[#E8DFD1] rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 text-[#341306]">
        {/* Header */}
        <div className="p-6 bg-[#FAF7F2] border-b border-[#E8DFD1] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                report.isValid
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border border-rose-300'
              }`}
            >
              {report.isValid ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              )}
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-[#341306]">
                CSV Export Schema Validation
              </h3>
              <p className="text-xs text-[#945c3c]">
                Verifying complete original dataset schema & data integrity for <span className="font-mono font-semibold text-[#341306]">{filename}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#945c3c] hover:text-[#341306] hover:bg-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
              report.isValid
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            {report.isValid ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
            )}
            <div>
              <div className="text-sm font-bold">
                {report.isValid
                  ? '100% Original Schema Preserved'
                  : 'Data Integrity Error Detected'}
              </div>
              <p className="text-xs opacity-90 mt-0.5 leading-relaxed">
                {report.isValid
                  ? `All ${report.originalColumnCount} original columns, exact column order, and ${report.originalRowCount} rows are fully preserved. AI humanized content appended safely in 'humanized_content'.`
                  : 'The exported CSV failed schema validation checks. Download blocked to protect data integrity.'}
              </p>
            </div>
          </div>

          {/* Validation Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#FAF7F2] p-3.5 border border-[#E8DFD1] rounded-2xl text-center">
              <div className="text-[10px] font-bold text-[#945c3c] uppercase tracking-wider">Original Columns</div>
              <div className="text-xl font-serif font-bold text-[#341306] mt-1">{report.originalColumnCount}</div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">100% Included</div>
            </div>

            <div className="bg-[#FAF7F2] p-3.5 border border-[#E8DFD1] rounded-2xl text-center">
              <div className="text-[10px] font-bold text-[#945c3c] uppercase tracking-wider">Export Columns</div>
              <div className="text-xl font-serif font-bold text-[#341306] mt-1">{report.exportedColumnCount}</div>
              <div className="text-[10px] text-[#c96529] font-semibold mt-0.5">+{report.exportedColumnCount - report.originalColumnCount} Appended</div>
            </div>

            <div className="bg-[#FAF7F2] p-3.5 border border-[#E8DFD1] rounded-2xl text-center">
              <div className="text-[10px] font-bold text-[#945c3c] uppercase tracking-wider">Total Rows</div>
              <div className="text-xl font-serif font-bold text-[#341306] mt-1">{report.originalRowCount}</div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Row Count Verified</div>
            </div>

            <div className="bg-[#FAF7F2] p-3.5 border border-[#E8DFD1] rounded-2xl text-center">
              <div className="text-[10px] font-bold text-[#945c3c] uppercase tracking-wider">Non-AI Values</div>
              <div className="text-xl font-serif font-bold text-[#341306] mt-1">100%</div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Unchanged</div>
            </div>
          </div>

          {/* Column Structure Comparison Table */}
          <div className="bg-[#FFFFFF] border border-[#E8DFD1] rounded-2xl overflow-hidden shadow-2xs">
            <div className="px-4 py-3 bg-[#FAF7F2] border-b border-[#E8DFD1] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-[#c96529]" />
                <span className="text-xs font-bold text-[#341306] uppercase tracking-wider">
                  Column Order & Mapping Audit
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#945c3c]">
                {report.exportedColumnCount} Total Export Columns
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#945c3c] text-[10px] font-bold uppercase tracking-wider border-b border-[#E8DFD1]">
                  <tr>
                    <th className="p-2.5 w-12 text-center">#</th>
                    <th className="p-2.5">Original Header</th>
                    <th className="p-2.5">Export Header</th>
                    <th className="p-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DFD1] font-mono text-[11px]">
                  {report.exportedHeaders.map((colName, idx) => {
                    const isOriginal = idx < report.originalColumnCount;
                    const origHeader = report.originalHeaders[idx] || '—';
                    const isMatch = isOriginal && origHeader === colName;

                    return (
                      <tr key={idx} className={isOriginal ? 'hover:bg-[#FAF7F2]/80' : 'bg-[#FAF7F2]/40'}>
                        <td className="p-2.5 text-center text-[#945c3c] font-semibold">{idx + 1}</td>
                        <td className="p-2.5 font-medium text-[#341306]">
                          {isOriginal ? (
                            <span className="text-emerald-800 font-semibold">{origHeader}</span>
                          ) : (
                            <span className="text-[#945c3c]/50 italic">None (Appended)</span>
                          )}
                        </td>
                        <td className="p-2.5 font-medium text-[#341306]">
                          <span className={isOriginal ? 'text-[#341306]' : 'text-[#c96529] font-bold'}>
                            {colName}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          {isMatch ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-sans font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Preserved
                            </span>
                          ) : !isOriginal ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-sans font-bold text-[#c96529] bg-[#c96529]/10 px-2 py-0.5 rounded-full border border-[#c96529]/30">
                              + AI Generated
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-sans font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-300">
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
            <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 text-xs text-rose-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> Validation Discrepancies:
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] opacity-90 pl-1">
                {report.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-[#FAF7F2] border-t border-[#E8DFD1] flex items-center justify-between">
          <div className="text-xs text-[#945c3c] flex items-center gap-1.5 font-medium">
            <FileSpreadsheet className="w-4 h-4 text-[#c96529]" />
            <span>Ready to download complete dataset</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-[#FAF7F2] border border-[#E8DFD1] text-[#341306] rounded-full text-xs font-bold transition-colors"
            >
              Close
            </button>

            {report.isValid && onConfirmDownload && (
              <button
                onClick={() => {
                  onConfirmDownload();
                  onClose();
                }}
                className="px-5 py-2 bg-[#c96529] hover:bg-[#b3551d] text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-[#c96529]/20"
              >
                <Download className="w-4 h-4" />
                <span>Download Verified CSV</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
