import React from 'react';
import { Plus, RefreshCw, Sliders } from 'lucide-react';

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
    <header className="border-b border-slate-800/80 bg-[#0c111c] sticky top-0 z-40 px-4 sm:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Identity */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md text-sm">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white tracking-tight">
                  PatchReplay
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-semibold">
                  Reliability Lab
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                AI Workflow Regression & Silent Failure Engine
              </p>
            </div>
          </div>

          {/* Mobile Sandbox & Refresh Actions */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onToggleSandbox}
              className={`p-1.5 rounded-lg border text-xs ${showSandbox ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-300 border-slate-700'}`}
            >
              <Sliders className="w-4 h-4" />
            </button>
            <button
              onClick={onRefresh}
              className="p-1.5 bg-slate-900 text-slate-300 border border-slate-700 rounded-lg text-xs"
            >
              <RefreshCw className={`w-4 h-4 ${isReplaying ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Center: Segmented Target Version Switcher */}
        <div className="flex items-center bg-[#131a29] border border-slate-800 rounded-lg p-1 w-full md:w-auto justify-center">
          <button
            onClick={() => onVersionChange('V12', 'V13')}
            className={`flex-1 md:flex-initial px-3.5 py-1.5 text-xs font-mono rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
              baselineVer === 'V12' && currentVer === 'V13'
                ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            V12 → V13 (Naive Bugfix)
          </button>
          <button
            onClick={() => onVersionChange('V12', 'V14')}
            className={`flex-1 md:flex-initial px-3.5 py-1.5 text-xs font-mono rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
              baselineVer === 'V12' && currentVer === 'V14'
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            V12 → V14 (Hardened Fix)
          </button>
        </div>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center space-x-2">
          <button
            onClick={onToggleSandbox}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition cursor-pointer ${
              showSandbox
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Policy Sandbox
          </button>

          <button
            onClick={onRefresh}
            disabled={isReplaying}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900/90 hover:bg-slate-800 hover:text-white border border-slate-800 rounded-lg transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReplaying ? 'animate-spin' : ''}`} />
            Replay
          </button>

          <button
            onClick={onOpenPromoteModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Incident
          </button>
        </div>
      </div>
    </header>
  );
};
