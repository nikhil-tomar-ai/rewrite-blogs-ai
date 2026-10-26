import React, { useState } from 'react';
import {
  LayoutDashboard,
  Database,
  Wand2,
  GitCompare,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Server,
  Radio,
  FileSpreadsheet,
  FileText
} from 'lucide-react';

export type ViewTab = 'dashboard' | 'datasets' | 'workspace' | 'document' | 'diff' | 'audit' | 'settings';
export type NavTab = ViewTab;

interface SidebarProps {
  activeTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  datasetsCount?: number;
  loadedRowsCount?: number;
  processedRowsCount?: number;
  auditCount?: number;
  aiProviderStatus: {
    provider: string;
    model: string;
    status: 'connected' | 'connecting' | 'error';
  };
  onOpenSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed: controlledIsCollapsed,
  onToggleCollapse: controlledOnToggleCollapse,
  datasetsCount = 0,
  loadedRowsCount = 0,
  processedRowsCount = 0,
  auditCount = 0,
  aiProviderStatus,
  onOpenSettings
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledIsCollapsed !== undefined ? controlledIsCollapsed : internalCollapsed;
  const onToggleCollapse = controlledOnToggleCollapse || (() => setInternalCollapsed((prev) => !prev));

  const navItems = [
    {
      id: 'dashboard' as ViewTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'document' as ViewTab,
      label: 'Document Humanizer',
      icon: FileText,
      badge: 'New'
    },
    {
      id: 'datasets' as ViewTab,
      label: 'Datasets & CSVs',
      icon: Database,
      badge: datasetsCount > 0 ? String(datasetsCount) : null
    },
    {
      id: 'workspace' as ViewTab,
      label: 'Batch CSVs',
      icon: Wand2,
      badge: loadedRowsCount > 0 ? `${processedRowsCount}/${loadedRowsCount}` : null
    },
    {
      id: 'diff' as ViewTab,
      label: 'Diff & Review',
      icon: GitCompare,
      badge: processedRowsCount > 0 ? String(processedRowsCount) : null
    },
    {
      id: 'audit' as ViewTab,
      label: 'Audit Logs',
      icon: ShieldCheck,
      badge: auditCount > 0 ? String(auditCount) : null
    },
    {
      id: 'settings' as ViewTab,
      label: 'Settings',
      icon: Settings,
      badge: null
    }
  ];


  return (
    <aside
      className={`relative flex flex-col shrink-0 transition-all duration-200 border-r bg-white dark:bg-[#12151b] border-neutral-200 dark:border-neutral-800 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              <Radio className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-sm tracking-tight text-neutral-900 dark:text-neutral-100">
                SparkyAI
              </span>
              <p className="text-[10px] text-neutral-400 font-mono leading-none mt-0.5">
                Content Engine
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-7 h-7 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
            <Radio className="w-4 h-4" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-850 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-400 dark:text-neutral-500'
                }`}
              />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Provider Status Pill */}
      {!isCollapsed ? (
        <div className="p-3 m-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#161a22] text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-neutral-400" />
              <span>{aiProviderStatus.provider}</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  aiProviderStatus.status === 'connected'
                    ? 'bg-emerald-500 animate-pulse'
                    : aiProviderStatus.status === 'connecting'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-[11px] font-medium capitalize text-neutral-500 dark:text-neutral-400">
                {aiProviderStatus.status}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate font-mono">
            {aiProviderStatus.model}
          </p>
          <button
            onClick={() => {
              if (onOpenSettings) onOpenSettings();
              else onSelectTab('settings');
            }}
            className="mt-2 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium block"
          >
            Change Engine Settings →
          </button>
        </div>
      ) : (
        <div className="p-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-center">
          <button
            onClick={() => {
              if (onOpenSettings) onOpenSettings();
              else onSelectTab('settings');
            }}
            className={`w-2.5 h-2.5 rounded-full ${
              aiProviderStatus.status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            title={`${aiProviderStatus.provider}: ${aiProviderStatus.status}`}
          />
        </div>
      )}
    </aside>
  );
};
