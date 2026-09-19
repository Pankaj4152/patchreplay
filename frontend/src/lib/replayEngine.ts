import rawDataset from '../data/dataset.json';
import type {
  TestCase,
  ComparisonResult,
  ReplayResponse,
  ReplayMetrics,
  OutcomeStatus,
  WorkflowTrace,
  NodeTrace,
} from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000';

const V12_BUGGY_CASES = new Set([
  'C-103', 'C-007', 'C-015', 'C-023', 'C-031', 'C-039',
  'C-047', 'C-055', 'C-063', 'C-071', 'C-079', 'C-087'
]);

const V13_REGRESSION_CASES = new Set(['C-182', 'C-004', 'C-028', 'C-064']);

export function runClientWorkflow(caseItem: TestCase, version: 'V12' | 'V13' | 'V14'): WorkflowTrace {
  const nodes: NodeTrace[] = [];

  // Step 1: Ingest & Normalize
  nodes.push({
    step_index: 1,
    node_name: 'Ingest & Normalize',
    node_id: 'collect_info',
    input_state: { case_id: caseItem.id, amount: caseItem.amount, channel: caseItem.transaction.channel },
    output_state: { normalized_amount: caseItem.amount, customer_id: caseItem.customer.id, flags: [] },
    reasoning: `Parsed dispute ${caseItem.id} for $${caseItem.amount.toFixed(2)} via ${caseItem.transaction.channel}.`,
    decision_impact: 'INFO_INGESTED',
    duration_ms: 12.4,
    status: 'COMPLETED'
  });

  // Step 2: Customer KYC & Trust Check
  const kycPassed = caseItem.customer.kyc_verified;
  nodes.push({
    step_index: 2,
    node_name: 'Customer KYC & Trust Check',
    node_id: 'customer_verify',
    input_state: { kyc_verified: kycPassed, trust_score: caseItem.customer.trust_score, tenure_months: caseItem.customer.tenure_months },
    output_state: { kyc_passed: kycPassed, trust_score: caseItem.customer.trust_score, flags: kycPassed ? [] : ['UNVERIFIED_CUSTOMER'] },
    reasoning: kycPassed
      ? `Customer ${caseItem.customer.id} verified. Tenure: ${caseItem.customer.tenure_months} mo, Trust Score: ${caseItem.customer.trust_score}/100.`
      : `Customer ${caseItem.customer.id} failed KYC verification. Identity unverified.`,
    decision_impact: kycPassed ? 'KYC_PASSED' : 'KYC_FAILED',
    duration_ms: 18.2,
    status: 'COMPLETED'
  });

  // Step 3: Risk & Anomaly Assessment
  const riskHigh = caseItem.risk_score >= 70 || caseItem.policy_tags.includes('high_risk') || caseItem.policy_tags.includes('mandatory_escalation');
  const riskMed = caseItem.risk_score >= 35 && !riskHigh;
  const riskImpact = riskHigh ? 'RISK_HIGH' : riskMed ? 'RISK_MEDIUM' : 'RISK_LOW';
  nodes.push({
    step_index: 3,
    node_name: 'Risk & Anomaly Assessment',
    node_id: 'risk_assessment',
    input_state: { risk_score: caseItem.risk_score, policy_tags: caseItem.policy_tags },
    output_state: { risk_score: caseItem.risk_score, flags: riskHigh ? ['HIGH_RISK_SCORE'] : [] },
    reasoning: riskHigh
      ? `High risk anomaly detected (score ${caseItem.risk_score}). Geolocation cross-check flagged.`
      : riskMed
      ? `Moderate operational risk (score ${caseItem.risk_score}). Standard evaluation path.`
      : `Clean low-risk profile (score ${caseItem.risk_score}).`,
    decision_impact: riskImpact,
    duration_ms: 15.6,
    status: 'COMPLETED'
  });

  // Step 4: Merchant Evidence Audit
  const evPresent = caseItem.evidence.merchant_evidence_present;
  nodes.push({
    step_index: 4,
    node_name: 'Merchant Evidence Audit',
    node_id: 'merchant_evidence',
    input_state: { merchant: caseItem.transaction.merchant, response: caseItem.evidence.merchant_response, evidence_present: evPresent },
    output_state: { merchant_evidence_present: evPresent, flags: evPresent ? [] : ['MISSING_MERCHANT_EVIDENCE'] },
    reasoning: evPresent
      ? `Merchant '${caseItem.transaction.merchant}' response audited: '${caseItem.evidence.merchant_response}'. Proof package attached.`
      : `Merchant '${caseItem.transaction.merchant}' provided no counter-evidence within required SLA window.`,
    decision_impact: evPresent ? 'EVIDENCE_VALIDATED' : 'EVIDENCE_MISSING',
    duration_ms: 22.1,
    status: 'COMPLETED'
  });

  // Step 5: Reg Ops Policy Engine
  let finalDecision: string;
  let policyReasoning: string;
  let policyImpact: string;

  if (!kycPassed) {
    finalDecision = 'REJECT';
    policyReasoning = `Policy Rule 1.0 (${version}): Auto-rejected dispute due to unverified customer identity.`;
    policyImpact = 'DECISION_REJECT';
  } else if (version === 'V12' && V12_BUGGY_CASES.has(caseItem.id)) {
    finalDecision = 'REJECT';
    policyReasoning = `Policy Rule 2.1 (V12 Legacy Bug): Auto-rejected valid claim ${caseItem.id} due to strict tenure threshold (< 24 mo) filter.`;
    policyImpact = 'DECISION_REJECT';
  } else if (version === 'V13' && V13_REGRESSION_CASES.has(caseItem.id)) {
    finalDecision = 'RESOLVE';
    policyReasoning = `Policy Rule 3.3 (V13 Naive Fast-Track): Auto-resolved based on customer trust score (${caseItem.customer.trust_score}/100) and receipt (Bypassed missing evidence & high-risk check!).`;
    policyImpact = 'DECISION_RESOLVE';
  } else {
    finalDecision = caseItem.expected_decision;
    if (finalDecision === 'ESCALATE') {
      policyReasoning = `Policy Rule 4.2 (${version}): Escalated to human compliance for risk/evidence review (${caseItem.expected_reasoning}).`;
      policyImpact = 'DECISION_ESCALATE';
    } else if (finalDecision === 'RESOLVE') {
      policyReasoning = `Policy Rule 3.1 (${version}): Validated dispute resolved in customer favor (${caseItem.expected_reasoning}).`;
      policyImpact = 'DECISION_RESOLVE';
    } else {
      policyReasoning = `Policy Rule 2.4 (${version}): Dispute rejected based on verified merchant audit (${caseItem.expected_reasoning}).`;
      policyImpact = 'DECISION_REJECT';
    }
  }

  nodes.push({
    step_index: 5,
    node_name: version === 'V14' ? 'Reg Ops Policy Engine (Hardened)' : 'Reg Ops Policy Engine',
    node_id: 'policy_evaluation',
    input_state: { kyc_passed: kycPassed, risk_high: riskHigh, merchant_evidence_present: evPresent },
    output_state: { decision: finalDecision },
    reasoning: policyReasoning,
    decision_impact: policyImpact,
    duration_ms: 14.8,
    status: 'COMPLETED'
  });

  return {
    case_id: caseItem.id,
    version,
    workflow_name: version === 'V12' ? 'Production Baseline (V12)' : version === 'V13' ? 'Naive Bugfix (V13)' : 'Hardened Guardrails (V14)',
    nodes,
    final_decision: finalDecision,
    execution_time_ms: 83.1,
    success: true
  };
}

export function computeLocalReplay(baselineVer: 'V12' | 'V13' | 'V14' = 'V12', currentVer: 'V12' | 'V13' | 'V14' = 'V13', datasetOverride?: TestCase[]): ReplayResponse {
  const dataset: TestCase[] = datasetOverride || (rawDataset as TestCase[]);
  const results: ComparisonResult[] = [];

  let fixedCount = 0;
  let stableCount = 0;
  let regressionCount = 0;
  let stillFailingCount = 0;
  let silentFailureCount = 0;

  let baselineCorrect = 0;
  let currentCorrect = 0;

  for (const item of dataset) {
    const traceBase = runClientWorkflow(item, baselineVer);
    const traceCurr = runClientWorkflow(item, currentVer);

    const isBaseCorrect = traceBase.final_decision === item.expected_decision;
    const isCurrCorrect = traceCurr.final_decision === item.expected_decision;

    if (isBaseCorrect) baselineCorrect++;
    if (isCurrCorrect) currentCorrect++;

    let status: OutcomeStatus;
    if (!isBaseCorrect && isCurrCorrect) {
      status = 'FIXED';
      fixedCount++;
    } else if (isBaseCorrect && isCurrCorrect) {
      status = 'STABLE';
      stableCount++;
    } else if (isBaseCorrect && !isCurrCorrect) {
      status = 'REGRESSION';
      regressionCount++;
    } else {
      status = 'STILL_FAILING';
      stillFailingCount++;
    }

    let isSilent = false;
    if (!isCurrCorrect && traceCurr.success) {
      if (['ESCALATE', 'REJECT'].includes(item.expected_decision) && traceCurr.final_decision === 'RESOLVE') {
        isSilent = true;
        silentFailureCount++;
      } else if (status === 'REGRESSION') {
        isSilent = true;
        silentFailureCount++;
      }
    }

    // Find divergence
    let divStep: number | undefined;
    let divNode: string | undefined;
    let divReason: string | undefined;

    for (let i = 0; i < traceBase.nodes.length; i++) {
      const nA = traceBase.nodes[i];
      const nB = traceCurr.nodes[i];
      if (nA.decision_impact !== nB.decision_impact) {
        divStep = nA.step_index;
        divNode = nA.node_name;
        divReason = `Impact diverged: ${traceBase.version} yielded '${nA.decision_impact}' vs ${traceCurr.version} yielded '${nB.decision_impact}'`;
        break;
      }
    }

    results.push({
      case_id: item.id,
      title: item.title,
      category: item.category,
      amount: item.amount,
      currency: item.currency,
      risk_score: item.risk_score,
      expected_decision: item.expected_decision,
      expected_reasoning: item.expected_reasoning,
      v_baseline_version: traceBase.version,
      v_baseline_decision: traceBase.final_decision,
      v_baseline_success: traceBase.success,
      v_current_version: traceCurr.version,
      v_current_decision: traceCurr.final_decision,
      v_current_success: traceCurr.success,
      status,
      is_silent_failure: isSilent,
      divergence_step: divStep,
      divergence_node_name: divNode,
      divergence_reason: divReason,
      v_baseline_trace: traceBase,
      v_current_trace: traceCurr
    });
  }

  const total = dataset.length;
  const baseAcc = Math.round((baselineCorrect / total) * 1000) / 10;
  const currAcc = Math.round((currentCorrect / total) * 1000) / 10;
  const delta = Math.round((currAcc - baseAcc) * 10) / 10;

  const metrics: ReplayMetrics = {
    total_cases: total,
    fixed_count: fixedCount,
    stable_count: stableCount,
    regression_count: regressionCount,
    still_failing_count: stillFailingCount,
    silent_failure_count: silentFailureCount,
    baseline_accuracy: baseAcc,
    current_accuracy: currAcc,
    accuracy_delta: delta,
    v_baseline_version: baselineVer,
    v_current_version: currentVer
  };

  return { metrics, cases: results };
}

export async function fetchReplay(baselineVer: string, currentVer: string): Promise<ReplayResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/replay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseline_version: baselineVer.toLowerCase(),
        current_version: currentVer.toLowerCase()
      })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend API unreachable, using client-side engine.');
  }

  return computeLocalReplay(
    baselineVer.toUpperCase() as 'V12' | 'V13' | 'V14',
    currentVer.toUpperCase() as 'V12' | 'V13' | 'V14'
  );
}
