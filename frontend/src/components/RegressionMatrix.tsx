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
    // Status Filter
    if (selectedFilter === 'FIXED' && c.status !== 'FIXED') return false;
    if (selectedFilter === 'STABLE' && c.status !== 'STABLE') return false;
    if (selectedFilter === 'REGRESSION' && c.status !== 'REGRESSION') return false;
    if (selectedFilter === 'STILL_FAILING' && c.status !== 'STILL_FAILING') return false;
    if (selectedFilter === 'SILENT_FAILURE' && !c.is_silent_failure) return false;

    // Category Filter
    if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;

    // Search Term
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
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" /> FIXED
        </span>
      );
    }
    if (c.status === 'REGRESSION') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-rose-500/20 text-rose-300 border border-rose-500/40">
          <AlertTriangle className="w-3 h-3 text-rose-400" /> REGRESSION
          {c.is_silent_failure && (
            <span className="ml-1 text-[10px] bg-rose-500/40 text-white px-1 py-0.2 rounded font-bold">
              SILENT
            </span>
          )}
        </span>
      );
    }
    if (c.status === 'STABLE') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700/60">
          <ShieldCheck className="w-3 h-3" /> STABLE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <HelpCircle className="w-3 h-3" /> STILL FAILING
      </span>
    );
  };

  const getDecisionBadge = (decision: string) => {
    let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
    if (decision === 'RESOLVE' || decision === 'AUTO_RESOLVE') {
      colorClasses = 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50';
    } else if (decision === 'ESCALATE') {
      colorClasses = 'bg-indigo-950/40 text-indigo-300 border-indigo-700/50';
    } else if (decision === 'REJECT') {
      colorClasses = 'bg-rose-950/40 text-rose-300 border-rose-700/50';
    }

    return (
      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono border ${colorClasses}`}>
        {decision}
      </span>
    );
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
      {/* Table Controls & Filters */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/40">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search case ID, title, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Categories ({cases.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
              ))}
            </select>
          </div>

          {/* Quick Filter Reset */}
          {selectedFilter !== 'ALL' && (
            <button
              onClick={() => onSelectFilter('ALL')}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline font-mono px-2"
            >
              Clear Filter ({selectedFilter})
            </button>
          )}
        </div>
      </div>

      {/* Cases Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] uppercase font-mono text-slate-400 tracking-wider">
              <th className="py-3 px-4">Case ID</th>
              <th className="py-3 px-4">Title & Context</th>
              <th className="py-3 px-3">Amount</th>
              <th className="py-3 px-3">Baseline</th>
              <th className="py-3 px-3">Current</th>
              <th className="py-3 px-3">Expected</th>
              <th className="py-3 px-4">Outcome</th>
              <th className="py-3 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500 font-mono">
                  No cases match the selected filters.
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
                        ? 'bg-indigo-950/40 hover:bg-indigo-950/60'
                        : isSilentFailure
                        ? 'bg-rose-950/20 hover:bg-rose-950/40'
                        : 'hover:bg-slate-900/50'
                    }`}
                  >
                    {/* Case ID */}
                    <td className="py-3 px-4 font-mono font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        {isSilentFailure && <Flame className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />}
                        <span className={isSilentFailure ? 'text-rose-300 font-bold' : ''}>
                          {c.case_id}
                        </span>
                      </div>
                    </td>

                    {/* Title & Category */}
                    <td className="py-3 px-4 max-w-xs md:max-w-sm">
                      <div className="font-medium text-slate-200 truncate">{c.title}</div>
                      <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                        <span className="text-slate-500 font-mono">{c.category}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">Risk: {c.risk_score}/100</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                      ${c.amount.toFixed(2)}
                    </td>

                    {/* Baseline Decision */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getDecisionBadge(c.v_baseline_decision)}
                    </td>

                    {/* Current Decision */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getDecisionBadge(c.v_current_decision)}
                    </td>

                    {/* Ground Truth Expected */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getDecisionBadge(c.expected_decision)}
                    </td>

                    {/* Status Badge */}
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
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-indigo-600 transition"
                      >
                        <Eye className="w-3 h-3" />
                        Inspect Trace
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div>Showing {filteredCases.length} of {cases.length} cases</div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Fixed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span> Regression / Silent
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span> Stable
          </span>
        </div>
      </div>
    </div>
  );
};
