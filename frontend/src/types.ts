export type OutcomeStatus = 'FIXED' | 'STABLE' | 'REGRESSION' | 'STILL_FAILING';

export type DecisionType = 'RESOLVE' | 'ESCALATE' | 'REJECT' | 'AUTO_RESOLVE';

export interface CustomerProfile {
  name: string;
  id: string;
  kyc_verified: boolean;
  tenure_months: number;
  trust_score: number;
  location: string;
}

export interface TransactionInfo {
  merchant: string;
  location: string;
  type: string;
  channel: string;
}

export interface EvidencePackage {
  customer_receipt: boolean;
  merchant_response: string;
  merchant_evidence_present: boolean;
}

export interface TestCase {
  id: string;
  title: string;
  category: string;
  amount: number;
  currency: string;
  customer: CustomerProfile;
  transaction: TransactionInfo;
  evidence: EvidencePackage;
  risk_score: number;
  expected_decision: string;
  expected_reasoning: string;
  policy_tags: string[];
}

export interface NodeTrace {
  step_index: number;
  node_name: string;
  node_id: string;
  input_state: Record<string, any>;
  output_state: Record<string, any>;
  reasoning: string;
  decision_impact?: string;
  duration_ms: number;
  status: string;
}

export interface WorkflowTrace {
  case_id: string;
  version: string;
  workflow_name: string;
  nodes: NodeTrace[];
  final_decision: string;
  execution_time_ms: number;
  success: boolean;
  error?: string;
}

export interface ComparisonResult {
  case_id: string;
  title: string;
  category: string;
  amount: number;
  currency: string;
  risk_score: number;
  expected_decision: string;
  expected_reasoning: string;
  v_baseline_version: string;
  v_baseline_decision: string;
  v_baseline_success: boolean;
  v_current_version: string;
  v_current_decision: string;
  v_current_success: boolean;
  status: OutcomeStatus;
  is_silent_failure: boolean;
  divergence_step?: number;
  divergence_node_name?: string;
  divergence_reason?: string;
  v_baseline_trace: WorkflowTrace;
  v_current_trace: WorkflowTrace;
}

export interface ReplayMetrics {
  total_cases: number;
  fixed_count: number;
  stable_count: number;
  regression_count: number;
  still_failing_count: number;
  silent_failure_count: number;
  baseline_accuracy: number;
  current_accuracy: number;
  accuracy_delta: number;
  v_baseline_version: string;
  v_current_version: string;
}

export interface ReplayResponse {
  metrics: ReplayMetrics;
  cases: ComparisonResult[];
}
