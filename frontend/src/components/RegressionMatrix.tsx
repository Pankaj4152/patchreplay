import React, { useState } from 'react';
import type { ComparisonResult } from '../types';
import { Search, Filter, AlertTriangle, CheckCircle2, ShieldCheck, Flame, ChevronRight } from 'lucide-react';

interface RegressionMatrixProps {
  cases: ComparisonResult[];
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  onSelectCase: (c: ComparisonResult) => void;
  selectedCaseId?: string;
}

export const RegressionMatrix: React.FC<RegressionMatrixProps> = ({
  cases,
  selectedFilter,
  onSelectFilter,
  onSelectCase,
  selectedCaseId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const categories = Array.from(new Set(cases.map(c => c.category)));

  const filteredCases = cases.filter(c => {
    if (selectedFilter === 'FIXED' && c.status !== 'FIXED') return false;
    if (selectedFilter === 'STABLE' && c.status !== 'STABLE') return false;
    if (selectedFilter === 'REGRESSION' && c.status !== 'REGRESSION') return false;
    if (selectedFilter === 'STILL_FAILING' && c.status !== 'STILL_FAILING') return false;
    if (selectedFilter === 'SILENT_FAILURE' && !c.is_silent_failure) return false;

    if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchId = c.case_id.toLowerCase().includes(term);
      const matchTitle = c.title.toLowerCase().includes(term);
      const matchCategory = c.category.toLowerCase().includes(term);
      if (!matchId && !matchTitle && !matchCategory) return false;
    }

    return true;
  });

  const getStatusBadge = (c: ComparisonResult) => {
    if (c.status === 'FIXED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" /> Fixed
        </span>
      );
    }
    if (c.status === 'REGRESSION') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30">
          {c.is_silent_failure ? (
            <Flame className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          )}
          Regression
          {c.is_silent_failure && (
            <span className="text-[10px] uppercase font-mono bg-rose-500 text-white px-1.5 py-0.2 rounded font-bold ml-0.5">
              Silent
            </span>
          )}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
        <ShieldCheck className="w-3.5 h-3.5" /> Stable
      </span>
    );
  };

  const getDecisionPill = (decision: string, isCurrent: boolean = false, isMismatch: boolean = false) => {
    let style = 'bg-slate-800/80 text-slate-300 border-slate-700';
    if (decision === 'RESOLVE' || decision === 'AUTO_RESOLVE') {
      style = isMismatch && isCurrent
        ? 'bg-rose-950/60 text-rose-300 border-rose-700 font-bold'
        : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60';
    } else if (decision === 'ESCALATE') {
      style = 'bg-indigo-950/40 text-indigo-300 border-indigo-800/60';
    } else if (decision === 'REJECT') {
      style = 'bg-rose-950/30 text-rose-300 border-rose-800/40';
    }

    return (
      <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-mono border ${style}`}>
        {decision}
      </span>
    );
  };

  return (
    <div className="bg-[#0f1523] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Search & Filter Header */}
      <div className="p-4 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0c111c]">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by case ID, title, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#141b2b] border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Categories & Clear Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-[#141b2b] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-2"
            >
              <option value="ALL" className="bg-[#0f1523]">All Categories ({cases.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-[#0f1523]">{cat}</option>
              ))}
            </select>
          </div>

          {selectedFilter !== 'ALL' && (
            <button
              onClick={() => onSelectFilter('ALL')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-mono px-2.5 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 cursor-pointer"
            >
              Filter: {selectedFilter} ×
            </button>
          )}
        </div>
      </div>

      {/* Case Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-[#090d16]/70 text-xs font-medium text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Case ID</th>
              <th className="py-3 px-4">Dispute Scenario</th>
              <th className="py-3 px-3">Amount</th>
              <th className="py-3 px-3">Baseline (V12)</th>
              <th className="py-3 px-3">Target</th>
              <th className="py-3 px-3">Expected</th>
              <th className="py-3 px-4">Outcome</th>
              <th className="py-3 px-3 text-right">Trace</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 font-mono text-xs">
                  No cases match the selected filter.
                </td>
              </tr>
            ) : (
              filteredCases.map((c) => {
                const isSelected = selectedCaseId === c.case_id;
                const isSilentFailure = c.is_silent_failure;
                const isMismatch = c.v_current_decision !== c.expected_decision;

                return (
                  <tr
                    key={c.case_id}
                    onClick={() => onSelectCase(c)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-950/40'
                        : isSilentFailure
                        ? 'bg-rose-950/20 hover:bg-rose-950/30'
                        : 'hover:bg-[#131a29]'
                    }`}
                  >
                    {/* Case ID */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-200 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {isSilentFailure && <Flame className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />}
                        <span className={isSilentFailure ? 'text-rose-300 font-bold' : ''}>
                          {c.case_id}
                        </span>
                      </div>
                    </td>

                    {/* Scenario Title & Details */}
                    <td className="py-3.5 px-4 max-w-sm md:max-w-md">
                      <div className="font-medium text-slate-100 truncate text-xs sm:text-sm">
                        {c.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate flex items-center gap-2 mt-0.5">
                        <span className="text-slate-400">{c.category}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">Risk: {c.risk_score}</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-3 font-mono font-medium text-slate-200 whitespace-nowrap">
                      ${c.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Baseline Decision */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {getDecisionPill(c.v_baseline_decision)}
                    </td>

                    {/* Target Decision */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {getDecisionPill(c.v_current_decision, true, isMismatch)}
                    </td>

                    {/* Expected Ground Truth */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {getDecisionPill(c.expected_decision)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(c)}
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCase(c);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md text-slate-300 hover:text-white bg-slate-800/80 hover:bg-indigo-600 transition cursor-pointer"
                      >
                        Inspect <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="p-3.5 bg-[#0c111c] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div>Showing {filteredCases.length} of {cases.length} cases</div>
        <div className="flex items-center gap-4 hidden sm:flex">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Fixed</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400"></span> Regression (Silent Failure)</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500"></span> Stable</span>
        </div>
      </div>
    </div>
  );
};
