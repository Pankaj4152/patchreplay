import React, { useState } from 'react';
import type { ComparisonResult } from '../types';
import {
  X,
  AlertTriangle,
  Flame,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface TraceVisualizerModalProps {
  caseData: ComparisonResult | null;
  onClose: () => void;
}

export const TraceVisualizerModal: React.FC<TraceVisualizerModalProps> = ({
  caseData,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'VISUAL' | 'RAW_STATE'>('VISUAL');
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});

  if (!caseData) return null;

  const toggleNodeExpand = (stepIndex: number) => {
    setExpandedNodes(prev => ({
      ...prev,
      [stepIndex]: !prev[stepIndex]
    }));
  };

  const isDivergenceNode = (stepIndex: number) => {
    return caseData.divergence_step === stepIndex;
  };

  const getImpactBadge = (impact?: string) => {
    if (!impact) return null;
    let color = 'bg-slate-800 text-slate-300 border-slate-700';
    if (impact.includes('RESOLVE') || impact.includes('PASSED') || impact.includes('VALIDATED')) {
      color = 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60';
    } else if (impact.includes('ESCALATE') || impact.includes('HIGH') || impact.includes('MISSING')) {
      color = 'bg-rose-950/60 text-rose-300 border-rose-700/60';
    } else if (impact.includes('MEDIUM') || impact.includes('REJECT')) {
      color = 'bg-amber-950/60 text-amber-300 border-amber-700/60';
    }

    return (
      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono border ${color}`}>
        {impact}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel border border-slate-700 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {caseData.case_id}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {caseData.title}
              </h2>
              {caseData.is_silent_failure && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse">
                  <Flame className="w-3.5 h-3.5" /> CRITICAL SILENT FAILURE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
              <span>Category: <strong className="text-slate-300">{caseData.category}</strong></span>
              <span>•</span>
              <span>Amount: <strong className="text-slate-300">${caseData.amount.toFixed(2)}</strong></span>
              <span>•</span>
              <span>Risk Score: <strong className="text-slate-300">{caseData.risk_score}/100</strong></span>
              <span>•</span>
              <span>Expected: <strong className="text-emerald-400 font-mono">{caseData.expected_decision}</strong></span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Expected Ground Truth Banner */}
        <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="font-mono text-slate-400 uppercase tracking-wider text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              Ground Truth Rationale
            </span>
            <span className="text-slate-300 italic">{caseData.expected_reasoning}</span>
          </div>
          <div className="flex items-center space-x-1 font-mono text-[11px]">
            <button
              onClick={() => setActiveTab('VISUAL')}
              className={`px-3 py-1 rounded-md transition ${
                activeTab === 'VISUAL'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Side-by-Side Visual
            </button>
            <button
              onClick={() => setActiveTab('RAW_STATE')}
              className={`px-3 py-1 rounded-md transition ${
                activeTab === 'RAW_STATE'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              State Diff (JSON)
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'VISUAL' ? (
            <>
              {/* Divergence Callout if detected */}
              {caseData.divergence_step && (
                <div className="divergence-box rounded-xl p-4 border border-rose-500/40">
                  <div className="flex items-center gap-2 text-rose-300 font-mono text-xs font-bold uppercase tracking-wider mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    Divergence Detected at Step {caseData.divergence_step}: {caseData.divergence_node_name}
                  </div>
                  <p className="text-xs text-slate-300 font-mono">
                    {caseData.divergence_reason}
                  </p>
                </div>
              )}

              {/* Side-by-Side Column Headers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Baseline Column */}
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span className="font-mono text-xs font-bold text-white uppercase">
                      Baseline: {caseData.v_baseline_version} ({caseData.v_baseline_trace.workflow_name})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-slate-400">Final Decision:</span>
                    <strong className={caseData.v_baseline_decision === caseData.expected_decision ? 'text-emerald-400' : 'text-rose-400'}>
                      {caseData.v_baseline_decision}
                    </strong>
                  </div>
                </div>

                {/* Current Column */}
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${caseData.v_current_decision === caseData.expected_decision ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'}`} />
                    <span className="font-mono text-xs font-bold text-white uppercase">
                      Current: {caseData.v_current_version} ({caseData.v_current_trace.workflow_name})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-slate-400">Final Decision:</span>
                    <strong className={caseData.v_current_decision === caseData.expected_decision ? 'text-emerald-400' : 'text-rose-400'}>
                      {caseData.v_current_decision}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Node by Node Step Progression */}
              <div className="space-y-3">
                {caseData.v_baseline_trace.nodes.map((nodeA, idx) => {
                  const nodeB = caseData.v_current_trace.nodes[idx];
                  const isDiv = isDivergenceNode(nodeA.step_index);
                  const isExpanded = !!expandedNodes[nodeA.step_index];

                  return (
                    <div
                      key={nodeA.step_index}
                      className={`rounded-xl border transition-all ${
                        isDiv
                          ? 'bg-rose-950/20 border-rose-500/60 ring-1 ring-rose-500/40'
                          : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {/* Node Header */}
                      <div
                        onClick={() => toggleNodeExpand(nodeA.step_index)}
                        className="p-3.5 flex items-center justify-between cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                            isDiv
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {nodeA.step_index}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-white font-mono">
                              {nodeA.node_name}
                            </span>
                            {isDiv && (
                              <span className="ml-2 text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-500/30 text-rose-200 border border-rose-500/50 font-bold">
                                Divergence Point
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="hidden sm:flex items-center gap-4 text-xs font-mono">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-slate-400">{caseData.v_baseline_version}:</span>
                              {getImpactBadge(nodeA.decision_impact)}
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-slate-400">{caseData.v_current_version}:</span>
                              {getImpactBadge(nodeB?.decision_impact)}
                            </div>
                          </div>

                          <button className="text-slate-400 hover:text-slate-200">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Side by Side Node Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 pt-0 border-t border-slate-800/40 text-xs">
                        {/* Baseline Node Card */}
                        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                            <span>{caseData.v_baseline_version} Impact: {getImpactBadge(nodeA.decision_impact)}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {nodeA.duration_ms}ms</span>
                          </div>
                          <p className="text-slate-300 font-sans text-xs leading-relaxed">
                            {nodeA.reasoning}
                          </p>
                          {isExpanded && (
                            <div className="pt-2 border-t border-slate-800/60">
                              <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">State Snapshot</span>
                              <pre className="text-[10px] font-mono bg-slate-900/90 p-2 rounded text-slate-300 overflow-x-auto">
                                {JSON.stringify(nodeA.output_state, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>

                        {/* Current Node Card */}
                        <div className={`p-3 rounded-lg border space-y-2 ${
                          isDiv
                            ? 'bg-rose-950/30 border-rose-500/40 text-rose-100'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300'
                        }`}>
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                            <span>{caseData.v_current_version} Impact: {getImpactBadge(nodeB?.decision_impact)}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {nodeB?.duration_ms}ms</span>
                          </div>
                          <p className={`font-sans text-xs leading-relaxed ${isDiv ? 'text-rose-200 font-medium' : 'text-slate-300'}`}>
                            {nodeB?.reasoning}
                          </p>
                          {isExpanded && nodeB && (
                            <div className="pt-2 border-t border-slate-800/60">
                              <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">State Snapshot</span>
                              <pre className="text-[10px] font-mono bg-slate-900/90 p-2 rounded text-slate-300 overflow-x-auto">
                                {JSON.stringify(nodeB.output_state, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Raw State Diff Tab */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                  {caseData.v_baseline_version} Full Execution Trace
                </span>
                <pre className="text-xs font-mono text-slate-300 bg-slate-900/80 p-3 rounded-lg max-h-96 overflow-y-auto">
                  {JSON.stringify(caseData.v_baseline_trace, null, 2)}
                </pre>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                  {caseData.v_current_version} Full Execution Trace
                </span>
                <pre className="text-xs font-mono text-slate-300 bg-slate-900/80 p-3 rounded-lg max-h-96 overflow-y-auto">
                  {JSON.stringify(caseData.v_current_trace, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Result:</span>
            <span className="font-bold text-white">{caseData.status}</span>
            {caseData.is_silent_failure && (
              <span className="text-rose-400">• High Operational Severity</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition font-mono"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
