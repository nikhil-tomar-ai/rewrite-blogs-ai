import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { MetricsBar } from './components/MetricsBar';
import { UploadSection } from './components/UploadSection';
import { ConfigPanel } from './components/ConfigPanel';
import { DataTableView } from './components/DataTableView';
import { ProcessProgressModal } from './components/ProcessProgressModal';
import { DiffReviewModal } from './components/DiffReviewModal';
import { AuditLogView } from './components/AuditLogView';
import { LocalAiSettingsModal } from './components/LocalAiSettingsModal';
import { SchemaValidationModal } from './components/SchemaValidationModal';

import {
  BlogRow,
  HumanizerConfig,
  BatchProcessingStats,
  AuditLogEntry
} from './types';
import {
  calculateFleschScore,
  calculateFluffPercentage,
  exportRowsToCSV,
  validateExportedCSV,
  ValidationReport,
  triggerFileDownload,
  parseCSVString,
  autoDetectColumns
} from './utils/csvUtils';
import { SAMPLE_DATASETS } from './data/sampleBlogs';

export default function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // App Core State
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<BlogRow[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'data' | 'audit'>('data');

  // Humanizer Config
  const [config, setConfig] = useState<HumanizerConfig>({
    contentColumn: 'content',
    titleColumn: 'title',
    authorColumn: 'author',
    targetColumns: ['*'],
    tone: 'casual',
    customPrompt: '',
    temperature: 0.7,
    enableCritic: true,
    preserveKeywords: [],
    addContractions: true,
    removeAiFluff: true,
    batchConcurrency: 2
  });

  // Batch Processing State
  const [batchStats, setBatchStats] = useState<BatchProcessingStats>({
    totalRows: 0,
    completedRows: 0,
    successfulRows: 0,
    failedRows: 0,
    startTime: null,
    endTime: null,
    isProcessing: false,
    isPaused: false,
    currentProcessingId: null
  });

  const [currentProcessingTitle, setCurrentProcessingTitle] = useState<string>('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const processingRef = useRef<boolean>(false);
  const pausedRef = useRef<boolean>(false);

  // Review Modal & Schema Validation Modal State
  const [reviewRow, setReviewRow] = useState<BlogRow | null>(null);
  const [isLocalAiModalOpen, setIsLocalAiModalOpen] = useState<boolean>(false);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState<boolean>(false);

  // Persistent Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('humanizer_audit_checkpoint_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('humanizer_audit_checkpoint_logs', JSON.stringify(auditLogs));
    } catch (e) {
      console.warn('Could not save audit logs to localStorage:', e);
    }
  }, [auditLogs]);

  // Handle Loading Data into Workspace
  const handleLoadRows = (
    records: Record<string, string>[],
    filename: string,
    contentCol: string,
    titleCol: string,
    authorCol: string,
    targetCols?: string[]
  ) => {
    const formattedRows: BlogRow[] = records.map((rec, idx) => {
      const rawContent = rec[contentCol] || rec['content'] || '';
      const title = titleCol ? rec[titleCol] || `Post #${idx + 1}` : `Post #${idx + 1}`;
      const author = authorCol ? rec[authorCol] || 'Author' : '';

      return {
        id: `row-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
        originalIndex: idx,
        rawRecord: rec,
        title,
        author,
        originalContent: rawContent,
        humanizedContent: '',
        humanizedColumns: {},
        status: 'pending',
        wordCountOriginal: rawContent.split(/\s+/).filter(Boolean).length,
        wordCountHumanized: 0,
        fleschScoreOriginal: calculateFleschScore(rawContent),
        fleschScoreHumanized: 0,
        aiFluffReduction: calculateFluffPercentage(rawContent)
      };
    });

    setRows(formattedRows);
    setActiveFileName(filename);
    setSelectedRowIds(new Set());
    setConfig(prev => ({
      ...prev,
      contentColumn: contentCol,
      titleColumn: titleCol,
      authorColumn: authorCol,
      targetColumns: targetCols && targetCols.length > 0 ? targetCols : ['*']
    }));
    setActiveTab('data');
  };

  // Selection handlers
  const handleToggleSelectRow = (id: string) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedRowIds.size === rows.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(rows.map(r => r.id)));
    }
  };

  // Helper function to call backend API and humanize a single row
  const executeHumanizeRowCall = async (
    row: BlogRow,
    overrideConfig?: Partial<HumanizerConfig>
  ): Promise<{ humanizedText: string; humanizedColumns?: Record<string, string>; criticResult?: any }> => {
    const activeCfg = { ...config, ...overrideConfig };

    let columnsToRewrite: Record<string, string> | undefined = undefined;

    if (activeCfg.targetColumns && activeCfg.targetColumns.length > 0) {
      columnsToRewrite = {};
      if (activeCfg.targetColumns.includes('*')) {
        Object.entries(row.rawRecord || {}).forEach(([k, v]) => {
          if (v && v.trim().length > 0) {
            columnsToRewrite![k] = v;
          }
        });
      } else {
        activeCfg.targetColumns.forEach(col => {
          if (row.rawRecord && row.rawRecord[col] !== undefined) {
            columnsToRewrite![col] = row.rawRecord[col];
          }
        });
      }
    }

    const response = await fetch('/api/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: row.originalContent,
        columnsToRewrite: columnsToRewrite && Object.keys(columnsToRewrite).length > 0 ? columnsToRewrite : undefined,
        title: row.title,
        author: row.author,
        tone: activeCfg.tone,
        customPrompt: activeCfg.customPrompt,
        temperature: activeCfg.temperature,
        enableCritic: activeCfg.enableCritic,
        preserveKeywords: activeCfg.preserveKeywords,
        addContractions: activeCfg.addContractions,
        removeAiFluff: activeCfg.removeAiFluff
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Server error during humanization');
    }

    const data = await response.json();
    return {
      humanizedText: data.humanized || row.originalContent,
      humanizedColumns: data.humanizedColumns || {},
      criticResult: data.criticResult
    };
  };

  // Trigger individual single row rewrite
  const handleSingleRowRewrite = async (row: BlogRow, customPromptOverride?: string) => {
    const startTime = Date.now();
    try {
      setRows(prev =>
        prev.map(r => (r.id === row.id ? { ...r, status: 'processing' } : r))
      );

      const res = await executeHumanizeRowCall(row, {
        customPrompt: customPromptOverride || config.customPrompt
      });

      const wordCountBefore = row.wordCountOriginal;
      const wordCountAfter = res.humanizedText.split(/\s+/).filter(Boolean).length;
      const fleschAfter = calculateFleschScore(res.humanizedText);

      const updatedRow: BlogRow = {
        ...row,
        humanizedContent: res.humanizedText,
        humanizedColumns: res.humanizedColumns || {},
        status: 'humanized',
        criticResult: res.criticResult,
        wordCountHumanized: wordCountAfter,
        fleschScoreHumanized: fleschAfter,
        processedAt: new Date().toISOString(),
        timeTakenMs: Date.now() - startTime
      };

      setRows(prev => prev.map(r => (r.id === row.id ? updatedRow : r)));

      // Add to checkpoint audit log
      const auditEntry: AuditLogEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        filename: activeFileName || 'workspace_data.csv',
        rowIndex: row.originalIndex,
        title: row.title,
        originalContent: row.originalContent,
        humanizedContent: res.humanizedText,
        tone: config.tone,
        criticScore: res.criticResult?.score || 85,
        timestamp: new Date().toISOString(),
        tokensUsed: Math.round((wordCountBefore + wordCountAfter) * 1.3)
      };

      setAuditLogs(prev => [auditEntry, ...prev]);
    } catch (err: any) {
      console.error(`Error rewriting row ${row.id}:`, err);
      setRows(prev =>
        prev.map(r =>
          r.id === row.id
            ? { ...r, status: 'failed', errorMessage: err.message || 'Failed to rewrite' }
            : r
        )
      );
    }
  };

  // Save manually edited text from review modal
  const handleSaveHumanizedContent = (rowId: string, updatedText: string, updatedColumns?: Record<string, string>) => {
    setRows(prev =>
      prev.map(r => {
        if (r.id === rowId) {
          const wordCountAfter = updatedText.split(/\s+/).filter(Boolean).length;
          return {
            ...r,
            humanizedContent: updatedText,
            humanizedColumns: updatedColumns ? { ...r.humanizedColumns, ...updatedColumns } : r.humanizedColumns,
            status: 'edited',
            wordCountHumanized: wordCountAfter,
            fleschScoreHumanized: calculateFleschScore(updatedText),
            processedAt: new Date().toISOString()
          };
        }
        return r;
      })
    );
  };

  // Start Batch Processing Loop
  const handleStartBatch = async (selectedOnly: boolean) => {
    const targetRows = selectedOnly
      ? rows.filter(r => selectedRowIds.has(r.id))
      : rows;

    if (targetRows.length === 0) return;

    processingRef.current = true;
    pausedRef.current = false;

    setBatchStats({
      totalRows: targetRows.length,
      completedRows: 0,
      successfulRows: 0,
      failedRows: 0,
      startTime: Date.now(),
      endTime: null,
      isProcessing: true,
      isPaused: false,
      currentProcessingId: null
    });

    setTerminalLogs([
      `[${new Date().toLocaleTimeString()}] Agent initialized batch run for ${targetRows.length} rows.`
    ]);

    for (let i = 0; i < targetRows.length; i++) {
      if (!processingRef.current) {
        setTerminalLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Batch processing cancelled by user.`
        ]);
        break;
      }

      while (pausedRef.current && processingRef.current) {
        await new Promise(r => setTimeout(r, 400));
      }

      const currentRow = targetRows[i];
      setCurrentProcessingTitle(currentRow.title || `Row #${currentRow.originalIndex + 1}`);

      setBatchStats(prev => ({ ...prev, currentProcessingId: currentRow.id }));

      setRows(prev =>
        prev.map(r => (r.id === currentRow.id ? { ...r, status: 'processing' } : r))
      );

      setTerminalLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Processing row ${i + 1}/${targetRows.length}: "${currentRow.title.slice(0, 30)}..."`
      ]);

      const startTime = Date.now();
      try {
        const res = await executeHumanizeRowCall(currentRow);

        const wordCountBefore = currentRow.wordCountOriginal;
        const wordCountAfter = res.humanizedText.split(/\s+/).filter(Boolean).length;
        const fleschAfter = calculateFleschScore(res.humanizedText);

        const updatedRow: BlogRow = {
          ...currentRow,
          humanizedContent: res.humanizedText,
          humanizedColumns: res.humanizedColumns || {},
          status: 'humanized',
          criticResult: res.criticResult,
          wordCountHumanized: wordCountAfter,
          fleschScoreHumanized: fleschAfter,
          processedAt: new Date().toISOString(),
          timeTakenMs: Date.now() - startTime
        };

        setRows(prev => prev.map(r => (r.id === currentRow.id ? updatedRow : r)));

        // Audit Log entry
        const auditEntry: AuditLogEntry = {
          id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          filename: activeFileName || 'workspace_data.csv',
          rowIndex: currentRow.originalIndex,
          title: currentRow.title,
          originalContent: currentRow.originalContent,
          humanizedContent: res.humanizedText,
          tone: config.tone,
          criticScore: res.criticResult?.score || 85,
          timestamp: new Date().toISOString(),
          tokensUsed: Math.round((wordCountBefore + wordCountAfter) * 1.3)
        };

        setAuditLogs(prev => [auditEntry, ...prev]);

        setBatchStats(prev => ({
          ...prev,
          completedRows: prev.completedRows + 1,
          successfulRows: prev.successfulRows + 1
        }));

        setTerminalLogs(prev => [
          ...prev,
          `✓ Row ${i + 1} completed (${res.criticResult?.score || 85}% human score, ${wordCountAfter} words).`
        ]);
      } catch (err: any) {
        setRows(prev =>
          prev.map(r =>
            r.id === currentRow.id
              ? { ...r, status: 'failed', errorMessage: err.message || 'Failed' }
              : r
          )
        );

        setBatchStats(prev => ({
          ...prev,
          completedRows: prev.completedRows + 1,
          failedRows: prev.failedRows + 1
        }));

        setTerminalLogs(prev => [
          ...prev,
          `✕ Row ${i + 1} failed: ${err.message || 'Error'}`
        ]);
      }
    }

    processingRef.current = false;
    setBatchStats(prev => ({
      ...prev,
      isProcessing: false,
      endTime: Date.now(),
      currentProcessingId: null
    }));

    setTerminalLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Batch operation completed.`
    ]);
  };

  const handlePauseToggle = () => {
    pausedRef.current = !pausedRef.current;
    setBatchStats(prev => ({ ...prev, isPaused: pausedRef.current }));
  };

  const handleCancelBatch = () => {
    processingRef.current = false;
    pausedRef.current = false;
    setBatchStats(prev => ({ ...prev, isProcessing: false, isPaused: false }));
  };

  // Export CSV Handler with Programmatic Schema Validation
  const handleExportCSV = () => {
    if (rows.length === 0) return;
    const csvContent = exportRowsToCSV(rows, true);
    const report = validateExportedCSV(rows, csvContent);
    setValidationReport(report);
    setIsSchemaModalOpen(true);

    const filename = activeFileName
      ? `humanized_${activeFileName}`
      : `humanized_blogs_${Date.now()}.csv`;

    if (report.isValid) {
      triggerFileDownload(csvContent, filename);
    }
  };

  // Inspect Schema Integrity Report
  const handleInspectSchema = () => {
    if (rows.length === 0) return;
    const csvContent = exportRowsToCSV(rows, true);
    const report = validateExportedCSV(rows, csvContent);
    setValidationReport(report);
    setIsSchemaModalOpen(true);
  };

  // Reset Workspace
  const handleResetWorkspace = () => {
    setRows([]);
    setActiveFileName(null);
    setSelectedRowIds(new Set());
  };

  return (
    <div className="min-h-screen natural-bg text-[#341306] flex flex-col font-sans selection:bg-[#c96529] selection:text-white">
      {/* Top Header Navbar */}
      <Navbar
        activeFileName={activeFileName}
        totalRows={rows.length}
        processedRows={rows.filter(r => r.status === 'humanized' || r.status === 'edited').length}
        onSelectSample={id => {
          const ds = SAMPLE_DATASETS.find((d: any) => d.id === id);
          if (ds) {
            handleLoadRows(ds.data, ds.filename, ds.contentColumn, ds.titleColumn, ds.authorColumn);
          }
        }}
        onExportCSV={handleExportCSV}
        onReset={handleResetWorkspace}
        onTriggerUploadClick={() => fileInputRef.current?.click()}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        auditCount={auditLogs.length}
        onOpenLocalAiSettings={() => setIsLocalAiModalOpen(true)}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'audit' ? (
          <AuditLogView
            logs={auditLogs}
            onClearLogs={() => setAuditLogs([])}
          />
        ) : rows.length === 0 ? (
          /* Empty State / Upload View */
          <div className="max-w-4xl mx-auto py-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#341306] tracking-tight mb-2">
                Humanize & Rewrite Blog CSV Datasets
              </h1>
              <p className="text-sm text-[#945c3c] max-w-xl mx-auto leading-relaxed font-medium">
                Upload your CSV file containing robotic or AI-generated blog drafts. Our Gemini Flash Agent rewrites content into natural, engaging, authentic human prose with an auto-critique verification loop.
              </p>
            </div>

            <UploadSection
              onLoadRows={handleLoadRows}
              fileInputRef={fileInputRef}
            />
          </div>
        ) : (
          /* Workspace Dashboard View */
          <div>
            {/* Top Workspace Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-white p-3 rounded-2xl border border-[#E8DFD1] shadow-2xs">
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-[#945c3c] font-medium">Active File:</span>
                <span className="font-bold text-[#341306] bg-[#FAF7F2] px-3 py-1 rounded-full border border-[#E8DFD1]">
                  {activeFileName}
                </span>
                <span className="text-[#945c3c] font-medium">({rows.length} total rows loaded)</span>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-[#c96529] hover:text-[#b3551d] font-bold uppercase tracking-wider underline"
              >
                Upload Different CSV
              </button>
            </div>

            {/* Metrics Dashboard Summary */}
            <MetricsBar rows={rows} />

            {/* AI Editorial Directives & Config Panel */}
            <ConfigPanel
              config={config}
              onChangeConfig={setConfig}
              onStartBatch={handleStartBatch}
              selectedCount={selectedRowIds.size}
              totalCount={rows.length}
              isProcessing={batchStats.isProcessing}
              allHeaders={rows.length > 0 && rows[0].rawRecord ? Object.keys(rows[0].rawRecord) : []}
            />

            {/* CSV Interactive Data Table View */}
            <DataTableView
              rows={rows}
              selectedRowIds={selectedRowIds}
              onToggleSelectRow={handleToggleSelectRow}
              onToggleSelectAll={handleToggleSelectAll}
              onOpenDiffModal={row => setReviewRow(row)}
              onSingleRowRewrite={handleSingleRowRewrite}
              processingRowId={batchStats.currentProcessingId}
              onInspectSchema={handleInspectSchema}
            />
          </div>
        )}
      </main>

      {/* Progress Batch Execution Modal */}
      <ProcessProgressModal
        stats={batchStats}
        currentTitle={currentProcessingTitle}
        logs={terminalLogs}
        onPauseToggle={handlePauseToggle}
        onCancel={handleCancelBatch}
        onClose={() => setBatchStats(prev => ({ ...prev, completedRows: 0 }))}
      />

      {/* Human-in-the-Loop Review & Edit Modal */}
      <DiffReviewModal
        row={reviewRow}
        onClose={() => setReviewRow(null)}
        onSaveHumanizedContent={handleSaveHumanizedContent}
        onSingleRowRewrite={handleSingleRowRewrite}
      />

      {/* Local AI Provider Settings Modal */}
      <LocalAiSettingsModal
        isOpen={isLocalAiModalOpen}
        onClose={() => setIsLocalAiModalOpen(false)}
      />

      {/* Programmatic Schema & Integrity Validation Modal */}
      <SchemaValidationModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
        report={validationReport}
        filename={activeFileName || 'humanized_blogs.csv'}
        onConfirmDownload={() => {
          if (rows.length > 0) {
            const csvContent = exportRowsToCSV(rows, true);
            const filename = activeFileName
              ? `humanized_${activeFileName}`
              : `humanized_blogs_${Date.now()}.csv`;
            triggerFileDownload(csvContent, filename);
          }
        }}
      />

      {/* Hidden File Input for uploading at any time */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={e => {
          if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = ev => {
              const text = ev.target?.result as string;
              if (text) {
                const parsed = parseCSVString(text);
                if (parsed.length > 0) {
                  const headers = Object.keys(parsed[0] || {});
                  const detected = autoDetectColumns(headers);
                  handleLoadRows(
                    parsed,
                    file.name,
                    detected.contentColumn,
                    detected.titleColumn,
                    detected.authorColumn
                  );
                }
              }
            };
            reader.readAsText(file);
          }
        }}
      />
    </div>
  );
}
