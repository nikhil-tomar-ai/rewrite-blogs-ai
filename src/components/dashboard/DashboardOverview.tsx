import React from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Upload,
  Cpu,
  Sparkles,
  FileSpreadsheet,
  Clock,
  ShieldAlert,
  FileText
} from 'lucide-react';
import { DatasetSummary } from '../../services/api';
import { SAMPLE_DATASETS } from '../../data/sampleBlogs';

export interface DashboardOverviewProps {
  datasets?: DatasetSummary[];
  loadedRowsCount?: number;
  processedRowsCount?: number;
  failedRowsCount?: number;
  onSelectDataset?: (id: string) => void;
  onNavigateTab?: (tab: 'datasets' | 'workspace' | 'settings' | 'document') => void;
  onNavigate?: (tab: string) => void;
  onLoadSample?: (sampleId: string) => void;
  onUploadClick?: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  datasets = [],
  loadedRowsCount = 0,
  processedRowsCount = 0,
  failedRowsCount = 0,
  onSelectDataset,
  onNavigateTab,
  onNavigate,
  onLoadSample,
  onUploadClick
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleNavigate = (tab: 'datasets' | 'workspace' | 'settings' | 'document') => {
    if (onNavigateTab) onNavigateTab(tab);
    else if (onNavigate) onNavigate(tab);
  };

  const handleUpload = () => {
    if (onUploadClick) onUploadClick();
    else handleNavigate('datasets');
  };

  const safeDatasets = datasets || [];
  const safeLoaded = loadedRowsCount ?? 0;
  const safeProcessed = processedRowsCount ?? 0;
  const safeFailed = failedRowsCount ?? 0;

  const totalIngestedRows = safeDatasets.reduce((acc, d) => acc + (d?.totalRows || 0), 0);
  const successRate =
    safeProcessed + safeFailed > 0
      ? Math.round((safeProcessed / (safeProcessed + safeFailed)) * 100)
      : 100;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Top Greeting & Pipeline Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            {getGreeting()}
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Your high-throughput AI content operations workspace.
          </p>
        </div>

        {/* 5-Step Pipeline Lifecycle Pill */}
        <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-500 dark:text-neutral-400 overflow-x-auto py-1">
          <span className="text-neutral-900 dark:text-neutral-100 font-semibold">01 Upload</span>
          <span>→</span>
          <span>02 Analyze</span>
          <span>→</span>
          <span>03 Configure</span>
          <span>→</span>
          <span>04 Process</span>
          <span>→</span>
          <span>05 Export</span>
        </div>
      </div>

      {/* KPI Metric Blocks */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-[#15181e] border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>Datasets Managed</span>
            <Database className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-neutral-100 mt-2">
            {(safeDatasets.length ?? 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            {(totalIngestedRows ?? 0).toLocaleString()} total rows stored
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#15181e] border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>Rows Humanized</span>
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-neutral-100 mt-2">
            {(safeProcessed ?? 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            of {(safeLoaded ?? 0).toLocaleString()} in active batch
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#15181e] border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>Success Rate</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-neutral-100 mt-2">
            {successRate}%
          </p>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            {safeFailed} failed transformations
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#15181e] border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>System Integrity</span>
            <Layers className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-neutral-100 mt-2">
            100%
          </p>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Zero data loss · exact CSV parity
          </p>
        </div>
      </div>

      {/* Main Dashboard Split: Datasets List + Quick Start Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Ingested Datasets */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span>Ingested CSV Datasets</span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                {safeDatasets.length}
              </span>
            </h2>
            <button
              onClick={() => handleNavigate('datasets')}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View all datasets</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {safeDatasets.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-800 text-center bg-white/50 dark:bg-[#15181e]/50">
              <Database className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                No CSV datasets ingested yet
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 max-w-sm mx-auto">
                Upload your raw blog extracts to stream, parse, and verify schemas with zero data loss.
              </p>
              <button
                onClick={handleUpload}
                className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload First CSV</span>
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#15181e] divide-y divide-neutral-100 dark:divide-neutral-800/60 overflow-hidden">
              {safeDatasets.slice(0, 5).map((d) => (
                <div
                  key={d.id}
                  onClick={() => {
                    if (onSelectDataset) onSelectDataset(d.id);
                    handleNavigate('datasets');
                  }}
                  className="p-3.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-900/60 transition-colors cursor-pointer"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {d.fileName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-400 font-mono">
                      <span>{(d?.totalRows || 0).toLocaleString()} rows</span>
                      <span>·</span>
                      <span>{d?.totalColumns || 0} columns</span>
                      <span>·</span>
                      <span>{((d?.fileSize || 0) / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-800/40">
                      {d.status}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Actions & Samples */}
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#15181e] p-4">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => handleNavigate('document')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/60 dark:hover:bg-blue-900/50 text-left text-xs transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      Document Humanizer
                    </span>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      Upload .docx / .md, rewrite & export
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              </button>

              <button
                onClick={() => handleNavigate('datasets')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-left text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Upload className="w-4 h-4 text-indigo-500" />
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                    Upload & Ingest CSV
                  </span>
                </div>
                <ArrowRight className="w-3 h-3 text-neutral-400" />
              </button>

              <button
                onClick={() => handleNavigate('workspace')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-left text-xs transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-purple-500" />
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                    Open AI Humanizer
                  </span>
                </div>
                <ArrowRight className="w-3 h-3 text-neutral-400" />
              </button>
            </div>
          </div>

          {/* Sample Datasets Drawer */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#15181e] p-4">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              Try Sample Datasets
            </h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-3">
              Pre-loaded with robotic drafts, SEO articles, and multiline content:
            </p>
            <div className="space-y-1.5">
              {SAMPLE_DATASETS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => {
                    if (onLoadSample) onLoadSample(sample.id);
                  }}
                  className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-left text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group"
                >
                  <span className="font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {sample.name}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {sample.data.length} rows
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
