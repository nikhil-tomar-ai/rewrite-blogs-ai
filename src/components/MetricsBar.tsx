import React from 'react';
import { FileText, CheckCircle2, Award, Zap, Sparkles, AlertCircle } from 'lucide-react';
import { BlogRow } from '../types';

interface MetricsBarProps {
  rows: BlogRow[];
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ rows }) => {
  const total = rows.length;
  if (total === 0) return null;

  const processed = rows.filter(r => r.status === 'humanized' || r.status === 'edited').length;
  const pending = rows.filter(r => r.status === 'pending').length;
  const failed = rows.filter(r => r.status === 'failed').length;

  // Calculate average critic score for processed items
  const criticScores = rows
    .filter(r => r.criticResult && typeof r.criticResult.score === 'number')
    .map(r => r.criticResult!.score);

  const avgHumanScore =
    criticScores.length > 0
      ? Math.round(criticScores.reduce((a, b) => a + b, 0) / criticScores.length)
      : 0;

  // Calculate average word reduction / optimization
  let totalOriginalWords = 0;
  let totalHumanizedWords = 0;
  rows.forEach(r => {
    if (r.status === 'humanized' || r.status === 'edited') {
      totalOriginalWords += r.wordCountOriginal;
      totalHumanizedWords += r.wordCountHumanized;
    }
  });

  const wordDiffPercent =
    totalOriginalWords > 0
      ? Math.round(((totalHumanizedWords - totalOriginalWords) / totalOriginalWords) * 100)
      : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* Total Progress */}
      <div className="bg-[#FFFFFF] border border-[#E8DFD1] rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center justify-between text-[#945c3c] mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider">Dataset Status</span>
          <FileText className="w-4 h-4 text-[#c96529]" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="font-serif text-3xl font-bold text-[#341306]">{processed}</span>
          <span className="text-xs text-[#945c3c] font-medium">/ {total} rows</span>
        </div>
        <div className="w-full bg-[#FAF7F2] h-1.5 rounded-full mt-2.5 overflow-hidden border border-[#E8DFD1]">
          <div
            className="bg-[#c96529] h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.round((processed / total) * 100)}%` }}
          />
        </div>
      </div>

      {/* Human Score Quality Average */}
      <div className="bg-[#FFFFFF] border border-[#E8DFD1] rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center justify-between text-[#945c3c] mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider">Avg Authenticity</span>
          <Award className="w-4 h-4 text-[#c96529]" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="font-serif text-3xl font-bold text-[#c96529]">
            {avgHumanScore > 0 ? `${avgHumanScore}%` : '—'}
          </span>
          <span className="text-[11px] text-[#945444] font-medium">target &gt; 80%</span>
        </div>
        <div className="text-[11px] text-[#945c3c] mt-2 flex items-center gap-1 font-medium">
          <Sparkles className="w-3 h-3 text-[#c96529]" /> Critic verification active
        </div>
      </div>

      {/* Word Count / Fluff Reduction */}
      <div className="bg-[#FFFFFF] border border-[#E8DFD1] rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center justify-between text-[#945c3c] mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider">Text Conciseness</span>
          <Zap className="w-4 h-4 text-[#c96529]" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="font-serif text-3xl font-bold text-[#341306]">
            {wordDiffPercent !== 0 ? `${wordDiffPercent > 0 ? '+' : ''}${wordDiffPercent}%` : '0%'}
          </span>
          <span className="text-[11px] text-[#945c3c] font-medium">word delta</span>
        </div>
        <div className="text-[11px] text-[#945444] mt-2 font-medium">
          {totalOriginalWords > 0 ? `${totalOriginalWords} → ${totalHumanizedWords} words` : 'Awaiting batch pass'}
        </div>
      </div>

      {/* Pending / Errors Queue */}
      <div className="bg-[#FFFFFF] border border-[#E8DFD1] rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center justify-between text-[#945c3c] mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider">Queue Breakdown</span>
          {failed > 0 ? (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#c96529]" />
          )}
        </div>
        <div className="flex items-center space-x-4 mt-1">
          <div className="flex flex-col">
            <span className="text-[11px] text-[#945c3c] font-medium">Pending</span>
            <span className="font-serif text-2xl font-bold text-[#341306]">{pending}</span>
          </div>
          <div className="w-px h-8 bg-[#E8DFD1]" />
          <div className="flex flex-col">
            <span className="text-[11px] text-[#945c3c] font-medium">Failed</span>
            <span className={`font-serif text-2xl font-bold ${failed > 0 ? 'text-rose-600' : 'text-[#945c3c]/50'}`}>
              {failed}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
