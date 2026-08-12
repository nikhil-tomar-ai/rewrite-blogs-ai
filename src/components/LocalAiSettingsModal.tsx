import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle2, AlertCircle, RefreshCw, X, Server, Sparkles, Terminal } from 'lucide-react';

interface LocalAiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocalAiSettingsModal: React.FC<LocalAiSettingsModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    connected: boolean;
    provider: string;
    providerName: string;
    baseUrl: string;
    activeModel: string;
    availableModels: string[];
    message: string;
  } | null>(null);

  const [selectedProvider, setSelectedProvider] = useState<'ollama' | 'openai_local' | 'fallback'>('ollama');
  const [baseUrlInput, setBaseUrlInput] = useState('http://localhost:11434');
  const [modelInput, setModelInput] = useState('llama3.1:8b');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const checkLlmStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health/llm');
      const data = await res.json();
      setStatus(data);
      if (data.provider) setSelectedProvider(data.provider);
      if (data.baseUrl) setBaseUrlInput(data.baseUrl);
      if (data.activeModel) setModelInput(data.activeModel);
    } catch {
      setStatus({
        connected: false,
        provider: 'ollama',
        providerName: 'Ollama (Local LLM)',
        baseUrl: 'http://localhost:11434',
        activeModel: 'llama3.1:8b',
        availableModels: [],
        message: 'Unable to query backend health service.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkLlmStatus();
    }
  }, [isOpen]);

  const handleSaveSettings = async () => {
    setLoading(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/settings/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerType: selectedProvider,
          baseUrl: baseUrlInput,
          model: modelInput
        })
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        await checkLlmStatus();
      }
    } catch (err) {
      console.error('Failed to save local AI settings:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#341306]/60 backdrop-blur-sm">
      <div className="bg-[#FFFFFF] border-2 border-[#E8DFD1] w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden text-[#341306] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#E8DFD1] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white border border-[#E8DFD1] rounded-2xl text-[#c96529]">
              <Cpu className="w-5 h-5 text-[#c96529]" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#341306]">Local AI Configuration</h3>
              <p className="text-[11px] text-[#945c3c] font-medium">100% Offline & Open-Source LLM Execution</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#945c3c] hover:text-[#341306] hover:bg-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">

          {/* Connection Status Card */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
            status?.connected
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}>
            {status?.connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <div className="font-bold flex items-center justify-between">
                <span>{status?.connected ? 'Local AI Connected & Ready' : 'Local LLM Offline / Standby'}</span>
                <button
                  onClick={checkLlmStatus}
                  disabled={loading}
                  className="text-[10px] font-bold uppercase tracking-wider text-[#c96529] hover:underline flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  Test Status
                </button>
              </div>
              <p className="mt-1 leading-relaxed opacity-90">{status?.message}</p>
            </div>
          </div>

          {/* Setup Instructions Helper */}
          {!status?.connected && (
            <div className="p-4 bg-[#FAF7F2] border border-[#E8DFD1] rounded-2xl text-xs space-y-2">
              <div className="font-bold text-[#945c3c] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Terminal className="w-4 h-4 text-[#c96529]" /> Quick Ollama Local Launch Commands:
              </div>
              <div className="p-2.5 bg-white text-[#341306] font-mono rounded-xl text-[11px] space-y-1 border border-[#E8DFD1]">
                <p><span className="text-[#c96529]">$</span> ollama serve</p>
                <p><span className="text-[#c96529]">$</span> ollama pull llama3.1:8b</p>
              </div>
              <p className="text-[10px] text-[#945c3c]/80 italic">
                SparkyAI automatically switches to its built-in rule engine when Ollama is offline, so you can test immediately!
              </p>
            </div>
          )}

          {/* Provider Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#945c3c] mb-2">
                Local AI Provider
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProvider('ollama');
                    setBaseUrlInput('http://localhost:11434');
                  }}
                  className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                    selectedProvider === 'ollama'
                      ? 'bg-[#c96529] text-white border-[#c96529] shadow-2xs'
                      : 'bg-white text-[#341306] border-[#E8DFD1] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <Server className="w-4 h-4 mb-1" />
                  Ollama
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProvider('openai_local');
                    setBaseUrlInput('http://localhost:1234/v1');
                  }}
                  className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                    selectedProvider === 'openai_local'
                      ? 'bg-[#c96529] text-white border-[#c96529] shadow-2xs'
                      : 'bg-white text-[#341306] border-[#E8DFD1] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <Cpu className="w-4 h-4 mb-1" />
                  LM Studio / vLLM
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProvider('fallback')}
                  className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                    selectedProvider === 'fallback'
                      ? 'bg-[#c96529] text-white border-[#c96529] shadow-2xs'
                      : 'bg-white text-[#341306] border-[#E8DFD1] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <Sparkles className="w-4 h-4 mb-1" />
                  Local Rule Engine
                </button>
              </div>
            </div>

            {/* Base URL */}
            {selectedProvider !== 'fallback' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#945c3c] mb-1.5">
                  Local Base Endpoint URL
                </label>
                <input
                  type="text"
                  value={baseUrlInput}
                  onChange={(e) => setBaseUrlInput(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl px-3.5 py-2 text-xs font-mono text-[#341306] focus:outline-none focus:ring-2 focus:ring-[#c96529]"
                />
              </div>
            )}

            {/* Model Name & Dropdown */}
            {selectedProvider !== 'fallback' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#945c3c] flex items-center justify-between">
                  <span>Model Name</span>
                  {status?.availableModels && status.availableModels.length > 0 && (
                    <span className="text-[10px] text-[#c96529] font-bold">
                      {status.availableModels.length} Installed locally
                    </span>
                  )}
                </label>
                
                {status?.availableModels && status.availableModels.length > 0 ? (
                  <select
                    value={modelInput}
                    onChange={(e) => setModelInput(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl px-3.5 py-2 text-xs text-[#341306] focus:outline-none focus:ring-2 focus:ring-[#c96529] font-semibold"
                  >
                    {status.availableModels.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={modelInput}
                    onChange={(e) => setModelInput(e.target.value)}
                    placeholder="e.g. llama3.1:8b, llama3.2, mistral"
                    className="w-full bg-[#FAF7F2] border border-[#E8DFD1] rounded-xl px-3.5 py-2 text-xs text-[#341306] placeholder-[#945c3c]/50 focus:outline-none focus:ring-2 focus:ring-[#c96529]"
                  />
                )}

                {/* Popular Model Quick Pick Pills */}
                <div>
                  <div className="text-[10px] text-[#945c3c] font-semibold mb-1">Recommended Models:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {['llama3.1:8b', 'llama3.2', 'mistral', 'qwen2.5', 'gemma2'].map(modelTag => (
                      <button
                        key={modelTag}
                        type="button"
                        onClick={() => setModelInput(modelTag)}
                        className={`px-2.5 py-1 text-[10px] font-mono rounded-full border transition-all ${
                          modelInput === modelTag
                            ? 'bg-[#c96529] text-white border-[#c96529] font-bold shadow-2xs'
                            : 'bg-[#FAF7F2] text-[#945c3c] border-[#E8DFD1] hover:bg-[#F2EAE0]'
                        }`}
                      >
                        {modelTag} {modelTag === 'llama3.1:8b' && '★'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#FAF7F2] border-t border-[#E8DFD1] flex items-center justify-between">
          <span className="text-xs text-emerald-700 font-bold">
            {saveSuccess ? '✓ Saved settings successfully!' : ''}
          </span>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#945c3c] hover:bg-white rounded-full transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="px-5 py-2 bg-[#c96529] hover:bg-[#b3551d] text-white text-xs font-bold rounded-full transition-all shadow-md shadow-[#c96529]/20"
            >
              Save Configuration
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
