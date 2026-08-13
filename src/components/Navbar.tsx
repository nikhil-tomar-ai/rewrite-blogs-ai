import React from 'react';
import { FileSpreadsheet, Download, RotateCcw, Upload, FileCheck, ShieldCheck, Cpu, RefreshCw, FolderOpen } from 'lucide-react';
import { SAMPLE_DATASETS } from '../data/sampleBlogs';

interface NavbarProps {
  activeFileName: string | null;
  totalRows: number;
  processedRows: number;
  onSelectSample: (datasetId: string) => void;
  onExportCSV: () => void;
  onReset: () => void;
  onTriggerUploadClick: () => void;
  onApproveAll?: () => void;
  isApprovingAll?: boolean;
  activeTab: 'data' | 'audit';
  setActiveTab: (tab: 'data' | 'audit') => void;
  auditCount: number;
  onOpenLocalAiSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeFileName,
  totalRows,
  processedRows,
  onSelectSample,
  onExportCSV,
  onReset,
  onTriggerUploadClick,
  onApproveAll,
  isApprovingAll,
  activeTab,
  setActiveTab,
  auditCount,
  onOpenLocalAiSettings
}) => {
  return (
    <header id="app-navbar" className="bg-[#FFFDF9] border-b border-[#E8DFD1] text-[#341306] sticky top-0 z-30 shadow-xs w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Left branding - Clickable to return to root CSV selection */}
        <div
          onClick={onReset}
          className="flex items-center space-x-3.5 cursor-pointer group"
          title="Return to Root CSV Selection Page"
        >
          <div className="h-10 w-10 rounded-2xl bg-[#c96529] flex items-center justify-center shadow-md shadow-[#c96529]/20 border border-white group-hover:scale-105 transition-transform">
            <span className="font-serif italic text-white text-xl font-bold">h</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-serif text-2xl font-bold tracking-tight text-[#341306] group-hover:text-[#c96529] transition-colors">sparky AI</h1>
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full bg-[#FAF7F2] text-[#945c3c] border border-[#E8DFD1] flex items-center gap-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c96529] animate-pulse" />
                100% Local & Offline
              </span>
            </div>
            <p className="text-[11px] text-[#945444] font-medium tracking-wide hidden sm:block">Local Open Source LLM CSV Content Humanizer</p>
          </div>
        </div>

        {/* Center Tabs */}
        <div className="flex items-center gap-6 text-xs font-semibold uppercase tracking-widest text-[#945c3c]">
          <button
            id="tab-data-table-btn"
            onClick={() => setActiveTab('data')}
            className={`py-2 px-1 transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'data'
                ? 'border-[#c96529] text-[#341306] font-bold'
                : 'border-transparent text-[#945c3c]/70 hover:text-[#341306]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-[#c96529]" />
            <span>Vibe Workspace</span>
            {totalRows > 0 && (
              <span className="px-2 py-0.5 bg-[#FAF7F2] text-[#341306] text-[10px] font-mono rounded-full border border-[#E8DFD1]">
                {processedRows}/{totalRows}
              </span>
            )}
          </button>
          
          <button
            id="tab-audit-log-btn"
            onClick={() => setActiveTab('audit')}
            className={`py-2 px-1 transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'audit'
                ? 'border-[#c96529] text-[#341306] font-bold'
                : 'border-transparent text-[#945c3c]/70 hover:text-[#341306]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#c96529]" />
            <span>Audit Log</span>
            {auditCount > 0 && (
              <span className="px-2 py-0.5 bg-[#FAF7F2] text-[#341306] text-[10px] font-mono rounded-full border border-[#E8DFD1]">
                {auditCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2.5">
          {/* Root CSV Selection Button */}
          {totalRows > 0 && (
            <button
              id="root-csv-selection-btn"
              onClick={onReset}
              className="px-4 py-2.5 bg-[#FAF7F2] hover:bg-[#F2EAE0] border border-[#E8DFD1] text-[#341306] rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-2xs"
              title="Go to Root CSV Selection & Upload Page"
            >
              <FolderOpen className="w-4 h-4 text-[#c96529]" />
              <span className="hidden md:inline">Root CSV Selection</span>
            </button>
          )}

          {/* Local AI Settings Button */}
          {onOpenLocalAiSettings && (
            <button
              onClick={onOpenLocalAiSettings}
              className="px-3.5 py-2 bg-[#FAF7F2] hover:bg-[#F2EAE0] border border-[#E8DFD1] text-[#341306] rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-2xs"
              title="Configure Local LLM & Ollama Provider"
            >
              <Cpu className="w-4 h-4 text-[#c96529]" />
              <span className="hidden lg:inline">Local AI Config</span>
            </button>
          )}

          {/* Sample Loader Dropdown */}
          <div className="relative group">
            <button
              id="sample-loader-dropdown-btn"
              className="px-3.5 py-2 bg-[#FAF7F2] hover:bg-[#F2EAE0] border border-[#E8DFD1] text-[#341306] rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <FileCheck className="w-4 h-4 text-[#c96529]" />
              <span className="hidden md:inline">Demo CSVs</span>
            </button>
            <div className="absolute right-0 mt-1.5 w-72 bg-white border border-[#E8DFD1] rounded-2xl shadow-xl p-2 hidden group-hover:block z-50">
              <div className="text-[10px] font-bold text-[#945c3c] uppercase tracking-widest px-3 py-1.5 border-b border-[#FAF7F2]">
                Select Sample Dataset
              </div>
              {SAMPLE_DATASETS.map(dataset => (
                <button
                  key={dataset.id}
                  onClick={() => onSelectSample(dataset.id)}
                  className="w-full text-left px-3 py-2.5 hover:bg-[#FAF7F2] rounded-xl text-xs transition-colors flex flex-col gap-0.5 mt-1"
                >
                  <span className="font-semibold text-[#341306]">{dataset.name}</span>
                  <span className="text-[10px] text-[#945444]">{dataset.rowsCount} blog drafts included</span>
                </button>
              ))}
            </div>
          </div>

          {totalRows > 0 ? (
            <>
              <button
                id="export-csv-top-btn"
                onClick={onExportCSV}
                className="px-5 py-2.5 bg-[#c96529] hover:bg-[#b3551d] text-white rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-md shadow-[#c96529]/20"
                title="Download Humanized CSV"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>

              <button
                id="approve-all-top-btn"
                onClick={onApproveAll}
                disabled={isApprovingAll || !onApproveAll}
                className={`px-4 py-2.5 bg-[#FAF7F2] hover:bg-[#F7F3EE] text-[#341306] rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all border border-[#E8DFD1] ${isApprovingAll ? 'opacity-60 cursor-wait' : ''}`}
                title="Approve and save all humanized rows"
              >
                {isApprovingAll ? (
                  <RefreshCw className="w-4 h-4 text-[#c96529] animate-spin" />
                ) : (
                  <FileCheck className="w-4 h-4 text-[#c96529]" />
                )}
                <span className="hidden sm:inline">{isApprovingAll ? 'Approving...' : 'Approve All'}</span>
              </button>

              <button
                id="reset-workspace-btn"
                onClick={onReset}
                className="p-2 text-[#945c3c] hover:text-[#341306] hover:bg-[#FAF7F2] rounded-full transition-colors border border-[#E8DFD1]"
                title="Clear current dataset & return to Root CSV Selection"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              id="top-upload-btn"
              onClick={onTriggerUploadClick}
              className="px-5 py-2.5 bg-[#c96529] hover:bg-[#b3551d] text-white rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-md shadow-[#c96529]/20"
            >
              <Upload className="w-4 h-4" />
              <span>Upload CSV</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};

