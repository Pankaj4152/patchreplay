import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { MetricsOverview } from './components/MetricsOverview';
import { RegressionMatrix } from './components/RegressionMatrix';
import { TraceVisualizerModal } from './components/TraceVisualizerModal';
import { PromoteIncidentModal } from './components/PromoteIncidentModal';
import { GuardrailSandbox, type SandboxRules } from './components/GuardrailSandbox';
import { fetchReplay, evaluateSandboxRules, promoteCase } from './lib/api';
import type { ReplayResponse, ComparisonResult, TestCase } from './types';
import { Sparkles, AlertTriangle, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

export function App() {
  const [baselineVer, setBaselineVer] = useState('V12');
  const [currentVer, setCurrentVer] = useState('V13');
  const [replayData, setReplayData] = useState<ReplayResponse | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [selectedCase, setSelectedCase] = useState<ComparisonResult | null>(null);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadReplay = useCallback(async (base: string, curr: string) => {
    setIsReplaying(true);
    setApiError(null);
    try {
      const data = await fetchReplay(base, curr);
      setReplayData(data);
    } catch (err: any) {
      console.error('Failed to load replay from backend API:', err);
      setApiError(
        'FastAPI backend unreachable at http://127.0.0.1:8000. Start the server with: uvicorn backend.app:app --reload'
      );
    } finally {
      setIsReplaying(false);
    }
  }, []);

  useEffect(() => {
    loadReplay(baselineVer, currentVer);
  }, [baselineVer, currentVer, loadReplay]);

  const handleVersionChange = (base: string, curr: string) => {
    setBaselineVer(base);
    setCurrentVer(curr);
    setSelectedFilter('ALL');
    showToast(`Switched target: ${base} → ${curr}`);
  };

  const handlePromoteCase = async (newCase: TestCase) => {
    try {
      await promoteCase(newCase);
      showToast(`Case ${newCase.id} promoted to regression suite!`);
      await loadReplay(baselineVer, currentVer);
    } catch (err: any) {
      showToast(`Error promoting case: ${err.message}`);
    }
  };

  const handleApplySandboxRules = async (rules: SandboxRules) => {
    setIsReplaying(true);
    try {
      const sandboxResponse = await evaluateSandboxRules(rules);
      setReplayData(sandboxResponse);
      showToast('Live sandbox rules evaluated across 120 cases via Python engine.');
    } catch (err: any) {
      showToast(`Sandbox evaluation error: ${err.message}`);
    } finally {
      setIsReplaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161f33] border border-indigo-500/40 px-3.5 py-2 rounded-lg shadow-xl text-xs font-mono text-indigo-300 flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          {toastMessage}
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        baselineVer={baselineVer}
        currentVer={currentVer}
        onVersionChange={handleVersionChange}
        onOpenPromoteModal={() => setIsPromoteModalOpen(true)}
        onRefresh={() => loadReplay(baselineVer, currentVer)}
        isReplaying={isReplaying}
        showSandbox={showSandbox}
        onToggleSandbox={() => setShowSandbox(!showSandbox)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4 flex-1 w-full">
        {/* Context Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Proof-of-Work:</span>
            <span>Patched (YC S24) AI Reliability Intern</span>
            <span>•</span>
            <span className="font-mono text-slate-400">Regulated Ops Suite (120 Cases)</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
            Core Loop: Reproduce → Replay → Divergence Diff → Invariant Check
          </div>
        </div>

        {/* API Error / Connection Warning */}
        {apiError && (
          <div className="bg-[#1c131d] border border-amber-500/40 rounded-xl p-3.5 flex items-center justify-between gap-3 text-amber-200 text-xs font-mono">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
            <button
              onClick={() => loadReplay(baselineVer, currentVer)}
              className="px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-100 rounded text-xs transition flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {/* Collapsible Sandbox */}
        {showSandbox && (
          <GuardrailSandbox
            onTweakRules={handleApplySandboxRules}
            isReplaying={isReplaying}
          />
        )}

        {/* 20-Second Featured Silent Failure Alert (If V13 active) */}
        {baselineVer === 'V12' && currentVer === 'V13' && (
          <div className="bg-[#1f1017] border border-rose-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <div>
                <span className="text-xs font-mono font-bold text-rose-300 mr-2">
                  CRITICAL SILENT FAILURE IN C-182:
                </span>
                <span className="text-xs text-slate-300">
                  Workflow V13 auto-resolved a $2,500 dispute with missing merchant evidence due to a naive trust rule override.
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                const c182 = replayData?.cases.find(c => c.case_id === 'C-182');
                if (c182) setSelectedCase(c182);
              }}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-medium rounded-lg whitespace-nowrap transition flex items-center gap-1 cursor-pointer"
            >
              Inspect Divergence <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Overview Stats Cards */}
        {replayData && (
          <MetricsOverview
            metrics={replayData.metrics}
            selectedFilter={selectedFilter}
            onSelectFilter={setSelectedFilter}
          />
        )}

        {/* Regression Cases Table */}
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
      <footer className="border-t border-slate-800/80 bg-[#0d1322] py-4 px-6 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            PatchReplay • Built for <strong className="text-slate-400">Patched (YC S24)</strong> AI Reliability Engineering Loop
          </div>
          <div>
            Deterministic Workflow Simulation • Synthetic Dataset
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
