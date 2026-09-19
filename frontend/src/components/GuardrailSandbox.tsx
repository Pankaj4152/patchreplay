import React, { useState } from 'react';
import { Sliders, RefreshCw, AlertTriangle, Zap } from 'lucide-react';

interface GuardrailSandboxProps {
  onTweakRules: (rules: SandboxRules) => void;
  isReplaying: boolean;
}

export interface SandboxRules {
  trustThreshold: number;
  allowBypassMissingEvidence: boolean;
  maxAutoResolveAmount: number;
  enforceStrictKyc: boolean;
}

export const GuardrailSandbox: React.FC<GuardrailSandboxProps> = ({
  onTweakRules,
  isReplaying
}) => {
  const [trustThreshold, setTrustThreshold] = useState(80);
  const [allowBypassMissingEvidence, setAllowBypassMissingEvidence] = useState(true);
  const [maxAutoResolveAmount, setMaxAutoResolveAmount] = useState(2000);
  const [enforceStrictKyc, setEnforceStrictKyc] = useState(true);

  const handleApply = () => {
    onTweakRules({
      trustThreshold,
      allowBypassMissingEvidence,
      maxAutoResolveAmount,
      enforceStrictKyc
    });
  };

  const handleResetToV14 = () => {
    setTrustThreshold(85);
    setAllowBypassMissingEvidence(false);
    setMaxAutoResolveAmount(500);
    setEnforceStrictKyc(true);
    onTweakRules({
      trustThreshold: 85,
      allowBypassMissingEvidence: false,
      maxAutoResolveAmount: 500,
      enforceStrictKyc: true
    });
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Interactive Policy & Guardrail Sandbox
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Live Simulation
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Simulate prompt and rule adjustments to observe instant impact on regression rates.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetToV14}
            className="text-xs font-mono text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 transition"
          >
            Reset to Safe Guardrails (V14)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Rule 1: Missing Evidence Bypass */}
        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
          <label className="flex items-center justify-between font-medium text-slate-200 cursor-pointer">
            <span>Bypass Missing Evidence for VIPs</span>
            <input
              type="checkbox"
              checked={allowBypassMissingEvidence}
              onChange={(e) => setAllowBypassMissingEvidence(e.target.checked)}
              className="rounded border-slate-700 text-rose-500 focus:ring-rose-500"
            />
          </label>
          <p className="text-[11px] text-slate-400">
            When enabled (V13 behavior), trust score overrides missing merchant evidence, triggering silent failures on disputes like C-182.
          </p>
          {allowBypassMissingEvidence && (
            <div className="text-[10px] text-rose-400 font-mono flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Silent failure hazard active
            </div>
          )}
        </div>

        {/* Rule 2: VIP Trust Score Threshold */}
        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-200">Customer Trust Threshold</span>
            <span className="font-mono text-indigo-400 font-bold">{trustThreshold}/100</span>
          </div>
          <input
            type="range"
            min="50"
            max="95"
            value={trustThreshold}
            onChange={(e) => setTrustThreshold(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <p className="text-[11px] text-slate-400">
            Minimum customer trust score required to qualify for auto-resolution fast tracking.
          </p>
        </div>

        {/* Rule 3: Max Auto Resolve Amount */}
        <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-200">Max Auto-Resolve Limit</span>
            <span className="font-mono text-indigo-400 font-bold">${maxAutoResolveAmount}</span>
          </div>
          <input
            type="range"
            min="200"
            max="3000"
            step="100"
            value={maxAutoResolveAmount}
            onChange={(e) => setMaxAutoResolveAmount(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <p className="text-[11px] text-slate-400">
            Disputes above this ceiling strictly enforce human compliance escalation.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Evaluation runtime: Deterministic node graph simulator</span>
        </div>
        <button
          onClick={handleApply}
          disabled={isReplaying}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs shadow-sm shadow-indigo-600/30 transition font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isReplaying ? 'animate-spin' : ''}`} />
          {isReplaying ? 'Simulating...' : 'Apply Rules & Replay Suite'}
        </button>
      </div>
    </div>
  );
};
