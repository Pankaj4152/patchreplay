import React from 'react';
import { Plus, RefreshCw, Layers } from 'lucide-react';

interface NavbarProps {
  baselineVer: string;
  currentVer: string;
  onVersionChange: (base: string, curr: string) => void;
  onOpenPromoteModal: () => void;
  onRefresh: () => void;
  isReplaying: boolean;
  showSandbox: boolean;
  onToggleSandbox: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  baselineVer,
  currentVer,
  onVersionChange,
  onOpenPromoteModal,
  onRefresh,
  isReplaying,
  showSandbox,
  onToggleSandbox
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-[#0d1322] sticky top-0 z-40 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                PatchReplay
              </h1>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                AI Reliability Lab
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Workflow Regression & Silent Failure Detection Engine
            </p>
          </div>
        </div>

        {/* Center: Clean Segmented Version Selector */}
        <div className="flex items-center bg-[#131b2e] border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => onVersionChange('V12', 'V13')}
            className={`px-3 py-1.5 text-xs font-mono rounded-md transition cursor-pointer ${
              baselineVer === 'V12' && currentVer === 'V13'
                ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            V12 → V13 (Naive Fix)
          </button>
          <button
            onClick={() => onVersionChange('V12', 'V14')}
            className={`px-3 py-1.5 text-xs font-mono rounded-md transition cursor-pointer ${
              baselineVer === 'V12' && currentVer === 'V14'
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            V12 → V14 (Hardened Fix)
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleSandbox}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition cursor-pointer ${
              showSandbox
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Sandbox
          </button>

          <button
            onClick={onRefresh}
            disabled={isReplaying}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReplaying ? 'animate-spin' : ''}`} />
            Replay
          </button>

          <button
            onClick={onOpenPromoteModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Case
          </button>
        </div>
      </div>
    </header>
  );
};
