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
      {/* Top Banner with Version Context & Accuracy */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Evaluation Target
            </span>
            <h2 className="text-lg font-bold text-white font-mono">
              Workflow {metrics.v_baseline_version} → {metrics.v_current_version}
            </h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Replaying {metrics.total_cases} historical dispute & compliance cases against modified workflow definition.
          </p>
        </div>

        {/* Accuracy Comparison */}
        <div className="flex items-center gap-6 bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800">
          <div>
            <div className="text-[11px] uppercase font-mono text-slate-400">Baseline Acc ({metrics.v_baseline_version})</div>
            <div className="text-base font-bold font-mono text-slate-300">{metrics.baseline_accuracy}%</div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <div className="text-[11px] uppercase font-mono text-slate-400">Current Acc ({metrics.v_current_version})</div>
            <div className="text-base font-bold font-mono text-white flex items-center gap-1">
              {metrics.current_accuracy}%
              {metrics.accuracy_delta >= 0 ? (
                <span className="text-xs text-emerald-400 flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" />+{metrics.accuracy_delta}%
                </span>
              ) : (
                <span className="text-xs text-rose-400 flex items-center">
                  <ArrowDownRight className="w-3.5 h-3.5" />{metrics.accuracy_delta}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5 Core Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Fixed */}
        <button
          onClick={() => onSelectFilter(selectedFilter === 'FIXED' ? 'ALL' : 'FIXED')}
          className={`text-left rounded-xl p-4 transition-all glass-panel-hover border ${
            selectedFilter === 'FIXED'
              ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/40'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-mono font-medium tracking-wider uppercase">Fixed</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{metrics.fixed_count}</div>
          <div className="text-xs text-slate-400 mt-1">Previously failing, now resolved</div>
        </button>

        {/* Stable */}
        <button
          onClick={() => onSelectFilter(selectedFilter === 'STABLE' ? 'ALL' : 'STABLE')}
          className={`text-left rounded-xl p-4 transition-all glass-panel-hover border ${
            selectedFilter === 'STABLE'
              ? 'bg-slate-800/60 border-slate-600 ring-1 ring-slate-600'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono font-medium tracking-wider uppercase">Stable</span>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{metrics.stable_count}</div>
          <div className="text-xs text-slate-400 mt-1">Consistently correct execution</div>
        </button>

        {/* Regressions */}
        <button
          onClick={() => onSelectFilter(selectedFilter === 'REGRESSION' ? 'ALL' : 'REGRESSION')}
          className={`text-left rounded-xl p-4 transition-all glass-panel-hover border ${
            selectedFilter === 'REGRESSION'
              ? 'bg-rose-950/50 border-rose-500/80 ring-1 ring-rose-500/60'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-xs font-mono font-medium tracking-wider uppercase">Regressions</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-300">{metrics.regression_count}</div>
          <div className="text-xs text-rose-400/80 mt-1">Previously correct, now failing</div>
        </button>

        {/* Still Failing */}
        <button
          onClick={() => onSelectFilter(selectedFilter === 'STILL_FAILING' ? 'ALL' : 'STILL_FAILING')}
          className={`text-left rounded-xl p-4 transition-all glass-panel-hover border ${
            selectedFilter === 'STILL_FAILING'
              ? 'bg-amber-950/40 border-amber-500/60 ring-1 ring-amber-500/40'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-mono font-medium tracking-wider uppercase">Still Failing</span>
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{metrics.still_failing_count}</div>
          <div className="text-xs text-slate-400 mt-1">Attempted fix did not solve</div>
        </button>

        {/* Critical Silent Failure (Highlight Callout) */}
        <button
          onClick={() => onSelectFilter(selectedFilter === 'SILENT_FAILURE' ? 'ALL' : 'SILENT_FAILURE')}
          className={`text-left rounded-xl p-4 transition-all border relative overflow-hidden ${
            metrics.silent_failure_count > 0
              ? selectedFilter === 'SILENT_FAILURE'
                ? 'bg-rose-950/80 border-rose-500 ring-2 ring-rose-500'
                : 'bg-gradient-to-br from-rose-950/40 via-purple-950/30 to-slate-900/80 border-rose-500/50 hover:border-rose-400'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          {metrics.silent_failure_count > 0 && (
            <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 w-12 h-12 bg-rose-500/20 rounded-full blur-md pointer-events-none" />
          )}
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              Silent Failures
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white flex items-center gap-2">
            {metrics.silent_failure_count}
            {metrics.silent_failure_count > 0 && (
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Critical
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1">200 OK status with wrong decision</div>
        </button>
      </div>
    </div>
  );
};
