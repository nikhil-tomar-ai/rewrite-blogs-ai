import React from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Search,
  Upload,
  Download,
  ChevronRight,
  Database,
  RotateCcw
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ViewTab } from './Sidebar';

interface HeaderProps {
  activeTab: ViewTab;
  datasetName?: string | null;
  activeDatasetName?: string | null;
  datasetList: Array<{ id: string; fileName: string; totalRows: number }>;
  selectedDatasetId: string | null;
  onSelectDataset: (id: string) => void;
  onUploadClick?: () => void;
  onTriggerUpload?: () => void;
  onExportCSV?: () => void;
  onExportCsv?: () => void;
  onResetWorkspace?: () => void;
  hasWorkspaceRows?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  datasetName,
  activeDatasetName,
  datasetList,
  selectedDatasetId,
  onSelectDataset,
  onUploadClick,
  onTriggerUpload,
  onExportCSV,
  onExportCsv,
  onResetWorkspace,
  hasWorkspaceRows = false
}) => {
  const { theme, setTheme } = useTheme();

  const handleUpload = onUploadClick || onTriggerUpload;
  const handleExport = onExportCSV || onExportCsv;
  const currentDatasetName = datasetName || activeDatasetName;

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const breadcrumbTitles: Record<ViewTab, string> = {
    dashboard: 'Dashboard',
    document: 'Document Humanizer',
    datasets: 'Datasets & CSVs',
    workspace: 'AI Workspace',
    diff: 'Diff & Review',
    audit: 'Audit Log',
    settings: 'Settings'
  };

  return (
    <header className="h-14 px-5 border-b bg-white dark:bg-[#12151b] border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4 sticky top-0 z-20 transition-colors">
      {/* Left Breadcrumbs & Dataset Quick Switcher */}
      <div className="flex items-center gap-2 text-xs min-w-0">
        <span className="text-neutral-400 dark:text-neutral-500 font-mono">sparky</span>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600 shrink-0" />
        <span className="text-neutral-600 dark:text-neutral-400 font-medium">
          {breadcrumbTitles[activeTab]}
        </span>

        {currentDatasetName && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600 shrink-0" />
            <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-xs font-mono">
              {currentDatasetName}
            </span>
          </>
        )}
      </div>

      {/* Center Search Bar */}
      <div className="hidden md:flex items-center max-w-xs w-full">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search rows or commands..."
            className="w-full bg-neutral-50 dark:bg-[#181c24] border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 text-xs rounded-lg pl-8 pr-10 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400 bg-neutral-200/50 dark:bg-neutral-800 px-1 py-0.5 rounded font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {hasWorkspaceRows && onResetWorkspace && (
          <button
            onClick={onResetWorkspace}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Clear active workspace data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {handleUpload && (
          <button
            onClick={handleUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload CSV</span>
          </button>
        )}

        {handleExport && (
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={cycleTheme}
          className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          title={`Theme: ${theme}`}
        >
          {theme === 'light' ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : theme === 'dark' ? (
            <Moon className="w-4 h-4 text-indigo-400" />
          ) : (
            <Laptop className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
};
