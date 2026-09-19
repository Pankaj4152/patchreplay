import React, { useState } from 'react';
import type { ComparisonResult } from '../types';
import { Search, Filter, AlertTriangle, CheckCircle2, ShieldCheck, HelpCircle, Flame, Eye } from 'lucide-react';

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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" /> FIXED
        </span>
      );
    }
    if (c.status === 'REGRESSION') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30">
          <AlertTriangle className="w-3 h-3 text-rose-400" /> REGRESSION
          {c.is_silent_failure && (
            <span className="text-[9px] bg-rose-500 text-white px-1 rounded font-bold ml-0.5">
              SILENT
            </span>
          )}
        </span>
      );
    }
    if (c.status === 'STABLE') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-800/80 text-slate-400 border border-slate-700/60">
          <ShieldCheck className="w-3 h-3" /> STABLE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
        <HelpCircle className="w-3 h-3" /> STILL FAILING
      </span>
    );
  };

  const getDecisionBadge = (decision: string) => {
    let color = 'bg-slate-800/60 text-slate-300 border-slate-700';
    if (decision === 'RESOLVE' || decision === 'AUTO_RESOLVE') {
      color = 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60';
    } else if (decision === 'ESCALATE') {
      color = 'bg-indigo-950/40 text-indigo-300 border-indigo-800/60';
    } else if (decision === 'REJECT') {
      color = 'bg-rose-950/40 text-rose-300 border-rose-800/60';
    }

    return (
      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono border ${color}`}>
        {decision}
      </span>
    );
  };

  return (
    <div className="bg-[#111726] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
      {/* Search & Filter Header */}
      <div className="p-3.5 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0d1322]">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by case ID, keyword, merchant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#151c2e] border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-sans"
          />
        </div>

        {/* Category & Filter Reset */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-[#151c2e] border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#111726]">All Categories ({cases.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-[#111726]">{cat}</option>
              ))}
            </select>
          </div>

          {selectedFilter !== 'ALL' && (
            <button
              onClick={() => onSelectFilter('ALL')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-mono px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20"
            >
              Clear: {selectedFilter} ×
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-[#0d1322]/80 text-[11px] uppercase font-mono text-slate-400 tracking-wider">
              <th className="py-2.5 px-4 font-medium">Case ID</th>
              <th className="py-2.5 px-4 font-medium">Scenario Context</th>
              <th className="py-2.5 px-3 font-medium">Amount</th>
              <th className="py-2.5 px-3 font-medium">Baseline</th>
              <th className="py-2.5 px-3 font-medium">Target</th>
              <th className="py-2.5 px-3 font-medium">Expected</th>
              <th className="py-2.5 px-4 font-medium">Result</th>
              <th className="py-2.5 px-3 text-right font-medium">Trace</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-500 font-mono">
                  No cases match the selected filter.
                </td>
              </tr>
            ) : (
              filteredCases.map((c) => {
                const isSelected = selectedCaseId === c.case_id;
                const isSilentFailure = c.is_silent_failure;
                return (
                  <tr
                    key={c.case_id}
                    onClick={() => onSelectCase(c)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-950/40'
                        : isSilentFailure
                        ? 'bg-rose-950/20 hover:bg-rose-950/30'
                        : 'hover:bg-[#151c2e]'
                    }`}
                  >
                    {/* Case ID */}
                    <td className="py-3 px-4 font-mono font-medium text-slate-200 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {isSilentFailure && <Flame className="w-3.5 h-3.5 text-rose-400" />}
                        <span className={isSilentFailure ? 'text-rose-300 font-bold' : ''}>
                          {c.case_id}
                        </span>
                      </div>
                    </td>

                    {/* Title */}
                    <td className="py-3 px-4 max-w-xs md:max-w-md">
                      <div className="font-medium text-slate-200 truncate">{c.title}</div>
                      <div className="text-[11px] text-slate-400 truncate flex items-center gap-2 mt-0.5">
                        <span className="text-slate-500 font-mono">{c.category}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">Risk: {c.risk_score}</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                      ${c.amount.toFixed(2)}
                    </td>

                    {/* Decisions */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getDecisionBadge(c.v_baseline_decision)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getDecisionBadge(c.v_current_decision)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getDecisionBadge(c.expected_decision)}
                    </td>

                    {/* Outcome Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(c)}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCase(c);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium rounded text-slate-300 hover:text-white bg-slate-800 hover:bg-indigo-600 transition"
                      >
                        <Eye className="w-3 h-3" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-3 bg-[#0d1322] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div>Showing {filteredCases.length} of {cases.length} cases</div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Fixed</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Regression / Silent</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Stable</span>
        </div>
      </div>
    </div>
  );
};
