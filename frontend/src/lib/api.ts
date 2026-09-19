/**
 * PatchReplay - FastAPI Client API
 * Directly connects React frontend to the Python replay engine and sandbox backend.
 */

import type { ReplayResponse, ComparisonResult, TestCase } from '../types';
import type { SandboxRules } from '../components/GuardrailSandbox';

// When served from FastAPI on single-port (Render/production), use relative paths ("").
// When developing locally on Vite port 5173, point to http://127.0.0.1:8000.
const API_BASE =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : typeof window !== 'undefined' && window.location.port === '5173'
    ? 'http://127.0.0.1:8000'
    : '';

export async function fetchReplay(
  baseline: string = 'v12',
  candidate: string = 'v13'
): Promise<ReplayResponse> {
  const url = `${API_BASE}/api/replay?baseline=${baseline.toLowerCase()}&candidate=${candidate.toLowerCase()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch replay (${response.status}): ${response.statusText}`);
  }
  return response.json();
}

export async function fetchTrace(
  caseId: string,
  baseline: string = 'v12',
  candidate: string = 'v13'
): Promise<ComparisonResult> {
  const url = `${API_BASE}/api/trace/${encodeURIComponent(caseId)}?baseline=${baseline.toLowerCase()}&candidate=${candidate.toLowerCase()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch trace for case ${caseId}`);
  }
  return response.json();
}

export async function evaluateSandboxRules(rules: SandboxRules): Promise<ReplayResponse> {
  const payload = {
    trust_threshold: rules.trustThreshold,
    bypass_missing_evidence: rules.allowBypassMissingEvidence,
    max_auto_amount: rules.maxAutoResolveAmount,
    strict_kyc: rules.enforceStrictKyc
  };
  const response = await fetch(`${API_BASE}/api/sandbox/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`Failed to evaluate sandbox rules: ${response.statusText}`);
  }
  return response.json();
}

export async function promoteCase(caseData: Partial<TestCase>): Promise<{ status: string; case_id: string }> {
  const payload = {
    id: caseData.id,
    title: caseData.title,
    category: caseData.category,
    amount: caseData.amount,
    currency: caseData.currency || 'USD',
    customer_name: caseData.customer?.name || 'Customer',
    customer_id: caseData.customer?.id || 'C-PROMOTED',
    kyc_verified: caseData.customer?.kyc_verified ?? true,
    tenure_months: caseData.customer?.tenure_months || 12,
    trust_score: caseData.customer?.trust_score || 80,
    location: caseData.customer?.location || 'US',
    merchant: caseData.transaction?.merchant || 'Merchant Inc',
    merchant_location: caseData.transaction?.location || 'US',
    transaction_type: caseData.transaction?.type || 'E-Commerce',
    channel: caseData.transaction?.channel || 'Card Not Present',
    customer_receipt: caseData.evidence?.customer_receipt ?? true,
    merchant_response: caseData.evidence?.merchant_response || 'None provided',
    merchant_evidence_present: caseData.evidence?.merchant_evidence_present ?? false,
    risk_score: caseData.risk_score || 80,
    expected_decision: caseData.expected_decision || 'ESCALATE',
    expected_reasoning: caseData.expected_reasoning || 'Incident promoted from production anomaly trace.',
    policy_tags: caseData.policy_tags || ['incident_promoted', 'mandatory_escalation']
  };
  const response = await fetch(`${API_BASE}/api/cases/promote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`Failed to promote case: ${response.statusText}`);
  }
  return response.json();
}
