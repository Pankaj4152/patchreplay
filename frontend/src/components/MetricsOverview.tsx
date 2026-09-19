import React from 'react';
import type { ReplayMetrics } from '../types';
import { CheckCircle2, AlertTriangle, Flame, ShieldCheck, HelpCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricsOverviewProps {
  metrics: ReplayMetrics;
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  metrics,
  selectedFilter,
  onSelectFilter
}) => {
  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-[#111726] border border-slate-800/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider">
              Evaluating Target
            </span>
            <span className="text-sm font-bold text-white font-mono">
              {metrics.v_baseline_version} → {metrics.v_current_version}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {metrics.total_cases} synthetic regulated banking dispute & compliance cases replayed.
          </p>
        </div>

        {/* Accuracies */}
        <div className="flex items-center gap-4 bg-[#0d1322] px-3.5 py-2 rounded-lg border border-slate-800">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Baseline Acc</span>
            <span className="text-xs font-mono font-bold text-slate-300">{metrics.baseline_accuracy}%</span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Target Acc</span>
            <div className="text-xs font-mono font-bold text-white flex items-center gap-1">
              {metrics.current_accuracy}%
              {metrics.accuracy_delta >= 0 ? (
                <span className="text-[11px] text-emerald-400 flex items-center">
                  <ArrowUpRight className="w-3 h-3" />+{metrics.accuracy_delta}%
                </span>
              ) : (
                <span className="text-[11px] text-rose-400 flex items-center">
                  <ArrowDownRight className="w-3 h-3" />{metrics.accuracy_delta}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5 Minimalist Metric Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Fixed */}
        <button
          onClick={() => onSelectFilter(selectedFilter === 'FIXED' ? 'ALL' : 'FIXED')}
          className={`text-left rounded-xl p-3.5 border transition cursor-pointer ${
            selectedFilter === 'FIXED'
              ? 'bg-emerald-950/30 border-emerald-500/80 ring-1 ring-emerald-500/50'
              : 'bg-[#111726] border-slate-800/80 hover:border-slate-700 hover:bg-[#151c2e]'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 mb-1.5">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">Fixed</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold font-mono text-white">{metrics.fixed_count}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Resolved edge cases</div>
        </button>

        {/* Stable */}
        <button
          onClick={() => onSelectFilter(selectedFilter === 'STABLE' ? 'ALL' : 'STABLE')}
          className={`text-left rounded-xl p-3.5 border transition cursor-pointer ${
            selectedFilter === 'STABLE'
              ? 'bg-slate-800/50 border-slate-500 ring-1 ring-slate-500'
              : 'bg-[#111726] border-slate-800/80 hover:border-slate-700 hover:bg-[#151c2e]'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">Stable</span>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">{metrics.stable_count}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Remained correct</div>
        </button>

        {/* Regressions */}
        <button
          onClick={() => onSelectFilter(selectedFilter === 'REGRESSION' ? 'ALL' : 'REGRESSION')}
          className={`text-left rounded-xl p-3.5 border transition cursor-pointer ${
            selectedFilter === 'REGRESSION'
              ? 'bg-rose-950/40 border-rose-500/80 ring-1 ring-rose-500/60'
              : 'bg-[#111726] border-slate-800/80 hover:border-slate-700 hover:bg-[#151c2e]'
          }`}
        >
          <div className="flex items-center justify-between text-rose-400 mb-1.5">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">Regressions</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-300">{metrics.regression_count}</div>
          <div className="text-[11px] text-rose-400/80 mt-0.5">Newly broken cases</div>
        </button>

        {/* Still Failing */}
        <button
          onClick={() => onSelectFilter(selectedFilter === 'STILL_FAILING' ? 'ALL' : 'STILL_FAILING')}
          className={`text-left rounded-xl p-3.5 border transition cursor-pointer ${
            selectedFilter === 'STILL_FAILING'
              ? 'bg-amber-950/30 border-amber-500/80 ring-1 ring-amber-500/50'
              : 'bg-[#111726] border-slate-800/80 hover:border-slate-700 hover:bg-[#151c2e]'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 mb-1.5">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">Still Failing</span>
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">{metrics.still_failing_count}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Unresolved bugs</div>
        </button>

        {/* Critical Silent Failure */}
        <button
          onClick={() => onSelectFilter(selectedFilter === 'SILENT_FAILURE' ? 'ALL' : 'SILENT_FAILURE')}
          className={`text-left rounded-xl p-3.5 border transition cursor-pointer ${
            selectedFilter === 'SILENT_FAILURE'
              ? 'bg-rose-950/60 border-rose-500 ring-2 ring-rose-500'
              : metrics.silent_failure_count > 0
              ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-400 hover:bg-rose-950/30'
              : 'bg-[#111726] border-slate-800/80 hover:border-slate-700 hover:bg-[#151c2e]'
          }`}
        >
          <div className="flex items-center justify-between text-rose-400 mb-1.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              Silent Failures
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-white flex items-center gap-2">
            {metrics.silent_failure_count}
            {metrics.silent_failure_count > 0 && (
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Critical
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">200 OK + wrong decision</div>
        </button>
      </div>
    </div>
  );
};
