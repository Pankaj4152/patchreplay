import React, { useState } from 'react';
import { X, Sparkles, PlusCircle } from 'lucide-react';
import type { TestCase } from '../types';

interface PromoteIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCase: (newCase: TestCase) => void;
}

export const PromoteIncidentModal: React.FC<PromoteIncidentModalProps> = ({
  isOpen,
  onClose,
  onAddCase
}) => {
  const [caseId, setCaseId] = useState(`INC-${Math.floor(1000 + Math.random() * 9000)}`);
  const [title, setTitle] = useState('Anomalous Crypto Gateway Dispute with Substituted Merchant Hash');
  const [category, setCategory] = useState('Account Takeover Suspicion');
  const [amount, setAmount] = useState('3250.00');
  const [customerName] = useState('Devon Brooks');
  const [kycVerified] = useState(true);
  const [trustScore] = useState(76);
  const [merchant] = useState('BitPay Vault Ramp');
  const [merchantLocation] = useState('Gibraltar');
  const [merchantEvidencePresent, setMerchantEvidencePresent] = useState(false);
  const [customerReceipt, setCustomerReceipt] = useState(true);
  const [riskScore, setRiskScore] = useState(88);
  const [expectedDecision, setExpectedDecision] = useState('ESCALATE');
  const [expectedReasoning, setExpectedReasoning] = useState(
    'High-risk crypto gateway dispute ($3,250) with missing merchant evidence and elevated anomaly score mandates manual compliance review.'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCase: TestCase = {
      id: caseId,
      title,
      category,
      amount: parseFloat(amount) || 100,
      currency: 'USD',
      customer: {
        name: customerName,
        id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
        kyc_verified: kycVerified,
        tenure_months: 24,
        trust_score: trustScore,
        location: 'US'
      },
      transaction: {
        merchant,
        location: merchantLocation,
        type: 'Crypto Ramp',
        channel: 'Web API'
      },
      evidence: {
        customer_receipt: customerReceipt,
        merchant_response: merchantEvidencePresent ? 'Counter-evidence logged' : 'None provided',
        merchant_evidence_present: merchantEvidencePresent
      },
      risk_score: riskScore,
      expected_decision: expectedDecision,
      expected_reasoning: expectedReasoning,
      policy_tags: ['incident_promoted', 'mandatory_escalation', 'high_risk']
    };

    onAddCase(newCase);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Promote Incident Trace to Golden Test Suite
              </h2>
              <p className="text-xs text-slate-400">
                Convert a real production anomaly into a permanent regression test case.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-slate-400 mb-1">Case / Incident ID</label>
              <input
                type="text"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block font-mono text-slate-400 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option>Account Takeover Suspicion</option>
                <option>Cross-Border Merchant Overcharge</option>
                <option>Unauthorized Wire Transfer</option>
                <option>Card Fraud Dispute</option>
                <option>Subscription Cancellation Conflict</option>
                <option>ATM Withdrawal Discrepancy</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-mono text-slate-400 mb-1">Incident Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-mono text-slate-400 mb-1">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block font-mono text-slate-400 mb-1">Risk Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={riskScore}
                onChange={(e) => setRiskScore(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block font-mono text-slate-400 mb-1">Expected Decision</label>
              <select
                value={expectedDecision}
                onChange={(e) => setExpectedDecision(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              >
                <option value="ESCALATE">ESCALATE</option>
                <option value="RESOLVE">RESOLVE</option>
                <option value="REJECT">REJECT</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={merchantEvidencePresent}
                onChange={(e) => setMerchantEvidencePresent(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-300">Merchant Provided Counter-Evidence</span>
            </label>

            <label className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={customerReceipt}
                onChange={(e) => setCustomerReceipt(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-slate-300">Customer Attached Valid Receipt</span>
            </label>
          </div>

          <div>
            <label className="block font-mono text-slate-400 mb-1">Expected Ground Truth Policy Rationale</label>
            <textarea
              rows={2}
              value={expectedReasoning}
              onChange={(e) => setExpectedReasoning(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-sm shadow-indigo-600/30 flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Save to Test Suite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
