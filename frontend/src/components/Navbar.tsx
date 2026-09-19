import React from 'react';
import { Play, GitCommit, Plus, RefreshCw } from 'lucide-react';

interface NavbarProps {
  baselineVer: string;
  currentVer: string;
  onVersionChange: (base: string, curr: string) => void;
  onOpenPromoteModal: () => void;
  onRefresh: () => void;
  isReplaying: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  baselineVer,
  currentVer,
  onVersionChange,
  onOpenPromoteModal,
  onRefresh,
  isReplaying
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo & Subtitle */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <RefreshCw className={`w-5 h-5 text-white ${isReplaying ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                PatchReplay
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Reliability Lab
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              AI Workflow Regression & Silent Failure Detection System
            </p>
          </div>
        </div>

        {/* Center: Version Diff Switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1.5 shadow-inner">
          <span className="text-xs font-mono text-slate-400 px-2 flex items-center gap-1.5">
            <GitCommit className="w-3.5 h-3.5 text-slate-400" />
            Diff:
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onVersionChange('V12', 'V13')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-all ${
                baselineVer === 'V12' && currentVer === 'V13'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              V12 → V13 (Naive Fix)
            </button>
            <button
              onClick={() => onVersionChange('V12', 'V14')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-all ${
                baselineVer === 'V12' && currentVer === 'V14'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              V12 → V14 (Hardened)
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onRefresh}
            disabled={isReplaying}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition"
            title="Re-run workflow evaluation"
          >
            <Play className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
            {isReplaying ? 'Replaying...' : 'Run Replay'}
          </button>

          <button
            onClick={onOpenPromoteModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Promote Trace to Test
          </button>
        </div>
      </div>
    </header>
  );
};
