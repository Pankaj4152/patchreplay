"""
PatchReplay - Core Domain Models & Schemas
Defines data structures for cases, execution traces, node state transitions, and regression classifications.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from enum import Enum


class OutcomeStatus(str, Enum):
    FIXED = "FIXED"
    STABLE = "STABLE"
    REGRESSION = "REGRESSION"
    STILL_FAILING = "STILL_FAILING"


class Decision(str, Enum):
    RESOLVE = "RESOLVE"
    ESCALATE = "ESCALATE"
    REJECT = "REJECT"
    AUTO_RESOLVE = "AUTO_RESOLVE"


class CustomerProfile(BaseModel):
    name: str
    id: str
    kyc_verified: bool
    tenure_months: int
    trust_score: int
    location: str


class TransactionInfo(BaseModel):
    merchant: str
    location: str
    type: str
    channel: str


class EvidencePackage(BaseModel):
    customer_receipt: bool
    merchant_response: str
    merchant_evidence_present: bool


class TestCase(BaseModel):
    __test__ = False  # Suppress pytest collection warning
    id: str
    title: str
    category: str
    amount: float
    currency: str = "USD"
    customer: CustomerProfile
    transaction: TransactionInfo
    evidence: EvidencePackage
    risk_score: int
    expected_decision: str
    expected_reasoning: str
    policy_tags: List[str] = Field(default_factory=list)


class NodeTrace(BaseModel):
    step_index: int
    node_name: str
    node_id: str
    input_state: Dict[str, Any]
    output_state: Dict[str, Any]
    reasoning: str
    decision_impact: Optional[str] = None
    duration_ms: float = 12.5
    status: str = "COMPLETED"


class WorkflowTrace(BaseModel):
    case_id: str
    version: str
    workflow_name: str
    nodes: List[NodeTrace]
    final_decision: str
    execution_time_ms: float
    success: bool = True
    error: Optional[str] = None


class ComparisonResult(BaseModel):
    case_id: str
    title: str
    category: str
    amount: float
    currency: str
    risk_score: int
    expected_decision: str
    expected_reasoning: str
    v_baseline_version: str
    v_baseline_decision: str
    v_baseline_success: bool
    v_current_version: str
    v_current_decision: str
    v_current_success: bool
    status: OutcomeStatus
    is_silent_failure: bool
    divergence_step: Optional[int] = None
    divergence_node_name: Optional[str] = None
    divergence_reason: Optional[str] = None
    v_baseline_trace: WorkflowTrace
    v_current_trace: WorkflowTrace


class ReplayMetrics(BaseModel):
    total_cases: int
    fixed_count: int
    stable_count: int
    regression_count: int
    still_failing_count: int
    silent_failure_count: int
    baseline_accuracy: float
    current_accuracy: float
    accuracy_delta: float
    v_baseline_version: str
    v_current_version: str


class ReplayResponse(BaseModel):
    metrics: ReplayMetrics
    cases: List[ComparisonResult]
