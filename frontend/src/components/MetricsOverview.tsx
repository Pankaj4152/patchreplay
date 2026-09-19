import React from 'react';
import type { ReplayMetrics } from '../types';
import {
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface MetricsOverviewProps {
  metrics: ReplayMetrics;
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  onInspectFeaturedCase: (caseId: string) => void;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  metrics,
  selectedFilter,
  onSelectFilter,
  onInspectFeaturedCase
}) => {
  const isV13 = metrics.v_current_version === 'V13';
  const hasRegressions = metrics.regression_count > 0;

  return (
    <div className="space-y-4">
      {/* 1. Single Unified Executive Hero Verdict Banner */}
      <div
        className={`rounded-xl p-5 border transition-all ${
          isV13
            ? 'bg-[#181119] border-rose-500/40 shadow-lg shadow-rose-950/20'
            : 'bg-[#0f171d] border-emerald-500/40 shadow-lg shadow-emerald-950/20'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left: Clear Verdict & Summary */}
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                  hasRegressions
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {hasRegressions ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    5 CRITICAL REGRESSIONS DETECTED
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    100% HARDENED POLICY PASS
                  </>
                )}
              </span>

              <span className="text-xs font-mono text-slate-400">
                Evaluating: <strong className="text-white">{metrics.v_baseline_version}</strong> →{' '}
                <strong className={isV13 ? 'text-rose-300' : 'text-emerald-300'}>
                  {metrics.v_current_version}
                </strong>
              </span>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed">
              {isV13 ? (
                <>
                  Workflow V13 resolved 9 false tenure rejections, but naively auto-resolves high-risk disputes without verifying missing merchant evidence—silently approving fraudulent claims.
                </>
              ) : (
                <>
                  Workflow V14 correctly re-orders mandatory compliance guardrails before trust rules. All 9 false rejections are fixed with zero regressions and zero silent failures.
                </>
              )}
            </p>

            {/* Quick Action CTA */}
            {isV13 && (
              <div className="pt-1">
                <button
                  onClick={() => onInspectFeaturedCase('C-182')}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-lg shadow transition cursor-pointer"
                >
                  <Flame className="w-3.5 h-3.5" />
                  Inspect Case C-182 ($2,500 Missing Evidence Silent Failure)
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Right: Accuracy & Replay Metrics Block */}
          <div className="flex items-center gap-4 bg-[#090d16]/80 p-3.5 rounded-lg border border-slate-800/80 self-start lg:self-center">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Baseline (V12)
              </span>
              <span className="text-base font-bold font-mono text-slate-300">
                {metrics.baseline_accuracy}%
              </span>
            </div>

            <div className="h-8 w-px bg-slate-800" />

            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Target ({metrics.v_current_version})
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold font-mono text-white">
                  {metrics.current_accuracy}%
                </span>
                <span
                  className={`text-xs font-mono font-bold flex items-center ${
                    metrics.accuracy_delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {metrics.accuracy_delta >= 0 ? (
                    <>
                      <TrendingUp className="w-3 h-3" />+{metrics.accuracy_delta}%
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-3 h-3" />
                      {metrics.accuracy_delta}%
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Four Clean, Interactive Outcome Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Fixed */}
        <button
          onClick={() => onSelectFilter(selectedFilter === 'FIXED' ? 'ALL' : 'FIXED')}
          className={`text-left rounded-xl p-4 border transition cursor-pointer ${
            selectedFilter === 'FIXED'
              ? 'bg-emerald-950/30 border-emerald-500/80 ring-1 ring-emerald-500/50'
              : 'bg-[#0f1523] border-slate-800 hover:border-slate-700 hover:bg-[#131b2c]'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">Fixed</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{metrics.fixed_count}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Was failing, now correct</div>
        </button>

        {/* Stable */}
        <button
          onClick={() => onSelectFilter(selectedFilter === 'STABLE' ? 'ALL' : 'STABLE')}
          className={`text-left rounded-xl p-4 border transition cursor-pointer ${
            selectedFilter === 'STABLE'
              ? 'bg-slate-800/50 border-slate-500 ring-1 ring-slate-500'
              : 'bg-[#0f1523] border-slate-800 hover:border-slate-700 hover:bg-[#131b2c]'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">Stable</span>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{metrics.stable_count}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Consistently correct</div>
        </button>

        {/* Regressions */}
        <button
          onClick={() => onSelectFilter(selectedFilter === 'REGRESSION' ? 'ALL' : 'REGRESSION')}
          className={`text-left rounded-xl p-4 border transition cursor-pointer ${
            selectedFilter === 'REGRESSION'
              ? 'bg-rose-950/40 border-rose-500/80 ring-1 ring-rose-500/60'
              : 'bg-[#0f1523] border-slate-800 hover:border-slate-700 hover:bg-[#131b2c]'
          }`}
        >
          <div className="flex items-center justify-between text-rose-400 mb-1">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">Regressions</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{metrics.regression_count}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Newly broken by change</div>
        </button>

        {/* Silent Failures */}
        <button
          onClick={() => onSelectFilter(selectedFilter === 'SILENT_FAILURE' ? 'ALL' : 'SILENT_FAILURE')}
          className={`text-left rounded-xl p-4 border transition cursor-pointer ${
            selectedFilter === 'SILENT_FAILURE'
              ? 'bg-rose-950/50 border-rose-500 ring-1 ring-rose-500'
              : 'bg-[#0f1523] border-slate-800 hover:border-slate-700 hover:bg-[#131b2c]'
          }`}
        >
          <div className="flex items-center justify-between text-rose-400 mb-1">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">Silent Failures</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-300">{metrics.silent_failure_count}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">200 OK + wrong action</div>
        </button>
      </div>
    </div>
  );
};
