import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MetricsOverview } from './components/MetricsOverview';
import { RegressionMatrix } from './components/RegressionMatrix';
import { TraceVisualizerModal } from './components/TraceVisualizerModal';
import { PromoteIncidentModal } from './components/PromoteIncidentModal';
import { GuardrailSandbox, type SandboxRules } from './components/GuardrailSandbox';
import { computeLocalReplay } from './lib/replayEngine';
import type { ReplayResponse, ComparisonResult, TestCase } from './types';
import rawDataset from './data/dataset.json';
import { Shield, Sparkles, AlertTriangle, Layers } from 'lucide-react';

export function App() {
  const [baselineVer, setBaselineVer] = useState('V12');
  const [currentVer, setCurrentVer] = useState('V13');
  const [replayData, setReplayData] = useState<ReplayResponse | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [selectedCase, setSelectedCase] = useState<ComparisonResult | null>(null);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [activeDataset, setActiveDataset] = useState<TestCase[]>(rawDataset as TestCase[]);
  const [showSandbox, setShowSandbox] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadReplay = (base: string, curr: string, datasetToUse = activeDataset) => {
    setIsReplaying(true);
    try {
      const data = computeLocalReplay(
        base as 'V12' | 'V13' | 'V14',
        curr as 'V12' | 'V13' | 'V14',
        datasetToUse
      );
      setReplayData(data);
    } catch (err) {
      console.error('Failed to load replay', err);
    } finally {
      setTimeout(() => setIsReplaying(false), 200);
    }
  };

  useEffect(() => {
    loadReplay(baselineVer, currentVer);
  }, [baselineVer, currentVer]);

  const handleVersionChange = (base: string, curr: string) => {
    setBaselineVer(base);
    setCurrentVer(curr);
    setSelectedFilter('ALL');
    showToast(`Switched evaluation target to ${base} → ${curr}`);
  };

  const handlePromoteCase = (newCase: TestCase) => {
    const updated = [newCase, ...activeDataset];
    setActiveDataset(updated);
    loadReplay(baselineVer, currentVer, updated);
    showToast(`Incident ${newCase.id} added to golden regression suite!`);
  };

  const handleApplySandboxRules = (rules: SandboxRules) => {
    setIsReplaying(true);
    setTimeout(() => {
      const baseResponse = computeLocalReplay('V12', 'V14', activeDataset);
      if (rules.allowBypassMissingEvidence) {
        baseResponse.cases.forEach(c => {
          if (['C-182', 'C-004', 'C-028', 'C-064'].includes(c.case_id)) {
            c.v_current_decision = 'RESOLVE';
            c.status = 'REGRESSION';
            c.is_silent_failure = true;
            c.divergence_step = 5;
            c.divergence_node_name = 'Reg Ops Policy Engine';
            c.divergence_reason = `Custom Sandbox Rule: Auto-resolved for customer trust >= ${rules.trustThreshold} (Bypassed missing evidence rule).`;
          }
        });
        const fixed = baseResponse.cases.filter(c => c.status === 'FIXED').length;
        const reg = baseResponse.cases.filter(c => c.status === 'REGRESSION').length;
        const silent = baseResponse.cases.filter(c => c.is_silent_failure).length;
        const stable = baseResponse.cases.filter(c => c.status === 'STABLE').length;
        baseResponse.metrics.regression_count = reg;
        baseResponse.metrics.silent_failure_count = silent;
        baseResponse.metrics.fixed_count = fixed;
        baseResponse.metrics.stable_count = stable;
        baseResponse.metrics.current_accuracy = Math.round(((120 - reg) / 120) * 1000) / 10;
        baseResponse.metrics.accuracy_delta = Math.round((baseResponse.metrics.current_accuracy - baseResponse.metrics.baseline_accuracy) * 10) / 10;
      }
      setReplayData(baseResponse);
      setIsReplaying(false);
      showToast('Sandbox policy rules re-evaluated across test suite.');
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-indigo-500/50 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-mono text-indigo-300 flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          {toastMessage}
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        baselineVer={baselineVer}
        currentVer={currentVer}
        onVersionChange={handleVersionChange}
        onOpenPromoteModal={() => setIsPromoteModalOpen(true)}
        onRefresh={() => loadReplay(baselineVer, currentVer)}
        isReplaying={isReplaying}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1 w-full">
        {/* Role Positioning & Hero Context */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-indigo-950/30 via-purple-950/20 to-slate-900/40 p-4 rounded-2xl border border-indigo-500/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Patched (YC S24) • AI Reliability Proof-of-Work
                </span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-mono">
                  Regulated Ops Benchmark
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Replaying historical disputes & compliance traces to verify that fixing one failure doesn't silently break another.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSandbox(!showSandbox)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition border flex items-center gap-1.5 ${
                showSandbox
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              {showSandbox ? 'Hide Guardrail Sandbox' : 'Policy Sandbox'}
            </button>
          </div>
        </div>

        {/* Interactive Guardrail Sandbox (Collapsible) */}
        {showSandbox && (
          <GuardrailSandbox
            onTweakRules={handleApplySandboxRules}
            isReplaying={isReplaying}
          />
        )}

        {/* Metrics Summary Cards */}
        {replayData && (
          <MetricsOverview
            metrics={replayData.metrics}
            selectedFilter={selectedFilter}
            onSelectFilter={setSelectedFilter}
          />
        )}

        {/* Featured 20-Second Demo Callout if V13 selected */}
        {baselineVer === 'V12' && currentVer === 'V13' && (
          <div className="divergence-box rounded-2xl p-4 border border-rose-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center border border-rose-500/40 flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
                  Critical Finding Detected: 1 Silent Operational Failure in Case C-182
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Workflow V13 auto-resolved a $2,500 high-risk dispute with missing merchant evidence because an attempted bugfix naively bypassed mandatory escalation rules.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const c182 = replayData?.cases.find(c => c.case_id === 'C-182');
                if (c182) setSelectedCase(c182);
              }}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-medium rounded-lg shadow-sm shadow-rose-600/30 whitespace-nowrap transition"
            >
              Inspect Divergence in C-182 →
            </button>
          </div>
        )}

        {/* Regression Matrix & Cases Table */}
        {replayData && (
          <RegressionMatrix
            cases={replayData.cases}
            selectedFilter={selectedFilter}
            onSelectFilter={setSelectedFilter}
            onSelectCase={setSelectedCase}
            selectedCaseId={selectedCase?.case_id}
          />
        )}
      </main>

      {/* Side-by-Side Trace Visualizer Modal */}
      {selectedCase && (
        <TraceVisualizerModal
          caseData={selectedCase}
          onClose={() => setSelectedCase(null)}
        />
      )}

      {/* Promote Incident Modal */}
      <PromoteIncidentModal
        isOpen={isPromoteModalOpen}
        onClose={() => setIsPromoteModalOpen(false)}
        onAddCase={handlePromoteCase}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 px-6 mt-12 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            PatchReplay • Built for <strong className="text-slate-400">Patched (YC S24)</strong> AI Reliability Engineering Loop
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Synthetic Regulated Operations Dataset (120 Cases)</span>
            <span>•</span>
            <span>Deterministic Node Simulator</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
