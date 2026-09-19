"""
PatchReplay - FastAPI Backend Service
Provides REST API endpoints for test case management, replay analysis, trace divergence inspection,
incident ingestion (Promote Trace to Test), and live rule sandbox evaluation.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from typing import Optional, List, Dict, Any, Tuple
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict

from backend.engine.models import (
    TestCase,
    ComparisonResult,
    ReplayResponse,
    ReplayMetrics,
    WorkflowTrace,
    OutcomeStatus
)
from backend.engine.comparator import ReplayEngine, find_divergence
from backend.workflows.base_workflow import BaseWorkflowNode, WorkflowGraph
from backend.workflows.v12_baseline import CollectInfoNode, CustomerVerifyNode, RiskAssessmentNode, MerchantEvidenceNode


app = FastAPI(
    title="PatchReplay API",
    description="AI Workflow Regression & Reliability Lab Backend",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = ReplayEngine()


class ReplayRequest(BaseModel):
    baseline_version: str = "v12"
    current_version: str = "v13"
    case_ids: Optional[List[str]] = None


class PromoteTraceRequest(BaseModel):
    id: str
    title: str
    category: str
    amount: float
    currency: str = "USD"
    customer_name: str
    customer_id: str
    kyc_verified: bool
    tenure_months: int
    trust_score: int
    location: str
    merchant: str
    merchant_location: str
    transaction_type: str = "E-Commerce"
    channel: str = "Card Not Present"
    customer_receipt: bool = True
    merchant_response: str = "None provided"
    merchant_evidence_present: bool = False
    risk_score: int = 80
    expected_decision: str = "ESCALATE"
    expected_reasoning: str = "Incident promoted from production anomaly trace."
    policy_tags: List[str] = ["incident_promoted", "mandatory_escalation"]


class SandboxRuleRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    trust_threshold: int = Field(default=80, alias="trust_threshold")
    allow_bypass_missing_evidence: bool = Field(default=True, alias="bypass_missing_evidence")
    max_auto_resolve_amount: float = Field(default=2000.0, alias="max_auto_amount")
    enforce_strict_kyc: bool = Field(default=True, alias="strict_kyc")


class DynamicSandboxPolicyNode(BaseWorkflowNode):
    name = "Reg Ops Policy Engine (Sandbox)"
    node_id = "policy_evaluation"

    def __init__(self, rules: SandboxRuleRequest):
        self.rules = rules

    def execute(self, state: Dict[str, Any], case: TestCase) -> Tuple[Dict[str, Any], str, str]:
        # Rule 1: KYC Check
        if self.rules.enforce_strict_kyc and not state["kyc_passed"]:
            state["decision"] = "REJECT"
            reasoning = "Sandbox Policy Rule 1.0: Auto-rejected due to unverified KYC."
            return state, reasoning, "DECISION_REJECT"

        # Rule 2: Fast Track check with sandbox parameters
        trust_qualifies = state["trust_score"] >= self.rules.trust_threshold
        amount_qualifies = case.amount <= self.rules.max_auto_resolve_amount
        receipt_present = state["customer_receipt"]
        missing_evidence = not state["merchant_evidence_present"]

        if self.rules.allow_bypass_missing_evidence:
            # If bypass is enabled, trust score overrides missing evidence & risk up to max amount
            if trust_qualifies and receipt_present and amount_qualifies:
                state["decision"] = "RESOLVE"
                reasoning = f"Sandbox Policy (Bypass Active): Auto-resolved based on trust ({state['trust_score']}) and receipt under ${self.rules.max_auto_resolve_amount} ceiling (Bypassed missing evidence)."
                return state, reasoning, "DECISION_RESOLVE"
        else:
            # Safe ordering: Mandatory safety check runs FIRST
            tags = set(case.policy_tags)
            is_high_risk = "HIGH_RISK_SCORE" in state["flags"] or "mandatory_escalation" in tags or "ato_risk" in tags or "high_risk" in tags
            if is_high_risk or missing_evidence or case.amount >= 1500 or case.category == "Unauthorized Wire Transfer":
                state["decision"] = "ESCALATE"
                reasoning = "Sandbox Policy (Safe Guardrails): Mandatory escalation enforced for risk/missing evidence."
                return state, reasoning, "DECISION_ESCALATE"

        # Normal safety flow
        tags = set(case.policy_tags)
        if not state["customer_receipt"] and state["merchant_evidence_present"]:
            state["decision"] = "REJECT"
            reasoning = "Sandbox Policy Rule 2.4: Dispute rejected due to no receipt."
            return state, reasoning, "DECISION_REJECT"

        if state["customer_receipt"] and (state["risk_score"] < 50 or "customer_favored" in tags or "auto_resolution" in tags):
            state["decision"] = "RESOLVE"
            reasoning = "Sandbox Policy Rule 3.1: Validated dispute resolved in customer favor."
            return state, reasoning, "DECISION_RESOLVE"

        if state["risk_score"] >= 50:
            state["decision"] = "REJECT"
            reasoning = "Sandbox Policy Rule 2.0: Claim rejected under moderate/high risk."
            return state, reasoning, "DECISION_REJECT"

        state["decision"] = "RESOLVE"
        reasoning = "Sandbox Policy Rule 3.0: Standard low-risk dispute approved."
        return state, reasoning, "DECISION_RESOLVE"


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "PatchReplay Core Engine",
        "dataset_size": len(engine.dataset),
        "available_workflows": list(engine.workflow_registry.keys())
    }


@app.get("/api/cases", response_model=List[TestCase])
def get_all_cases():
    return engine.dataset


@app.get("/api/replay", response_model=ReplayResponse)
def get_replay_comparison(baseline: str = "v12", candidate: str = "v13", case_id: Optional[str] = None):
    res = engine.run_replay(baseline, candidate)
    if case_id:
        res.cases = [c for c in res.cases if c.case_id.upper() == case_id.upper()]
    return res


@app.post("/api/replay", response_model=ReplayResponse)
def run_replay_comparison(req: ReplayRequest = Body(...)):
    res = engine.run_replay(req.baseline_version, req.current_version)
    if req.case_ids:
        target_set = set(c.upper() for c in req.case_ids)
        filtered_cases = [c for c in res.cases if c.case_id.upper() in target_set]
        res.cases = filtered_cases
    return res


@app.get("/api/trace/{case_id}")
def get_case_trace(case_id: str, baseline: str = "v12", candidate: str = "v13", v1: Optional[str] = None, v2: Optional[str] = None):
    b = v1 or baseline
    c = v2 or candidate
    response = engine.run_replay(b, c)
    match = next((case for case in response.cases if case.case_id.upper() == case_id.upper()), None)
    if not match:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found in regression suite.")
    return match


@app.post("/api/sandbox/evaluate", response_model=ReplayResponse)
def evaluate_sandbox_rules(rules: SandboxRuleRequest):
    """
    Dynamically executes a sandbox workflow graph with user-defined policy sliders
    across all 120 cases and compares against baseline V12.
    """
    baseline_graph = engine.workflow_registry["v12"]
    sandbox_nodes = [
        CollectInfoNode(),
        CustomerVerifyNode(),
        RiskAssessmentNode(),
        MerchantEvidenceNode(),
        DynamicSandboxPolicyNode(rules)
    ]
    sandbox_graph = WorkflowGraph(version="Sandbox", workflow_name="Custom Policy Sandbox", nodes=sandbox_nodes)

    results: List[ComparisonResult] = []
    fixed_count = 0
    stable_count = 0
    regression_count = 0
    still_failing_count = 0
    silent_failure_count = 0
    baseline_correct = 0
    current_correct = 0

    for case in engine.dataset:
        trace_base = baseline_graph.run(case)
        trace_curr = sandbox_graph.run(case)

        is_base_correct = (trace_base.final_decision == case.expected_decision)
        is_curr_correct = (trace_curr.final_decision == case.expected_decision)

        if is_base_correct:
            baseline_correct += 1
        if is_curr_correct:
            current_correct += 1

        if not is_base_correct and is_curr_correct:
            status = OutcomeStatus.FIXED
            fixed_count += 1
        elif is_base_correct and is_curr_correct:
            status = OutcomeStatus.STABLE
            stable_count += 1
        elif is_base_correct and not is_curr_correct:
            status = OutcomeStatus.REGRESSION
            regression_count += 1
        else:
            status = OutcomeStatus.STILL_FAILING
            still_failing_count += 1

        is_silent = False
        if not is_curr_correct and trace_curr.success:
            if case.expected_decision in ["ESCALATE", "REJECT"] and trace_curr.final_decision == "RESOLVE":
                is_silent = True
                silent_failure_count += 1
            elif status == OutcomeStatus.REGRESSION:
                is_silent = True
                silent_failure_count += 1

        div_step, div_node, div_reason = find_divergence(trace_base, trace_curr)

        results.append(
            ComparisonResult(
                case_id=case.id,
                title=case.title,
                category=case.category,
                amount=case.amount,
                currency=case.currency,
                risk_score=case.risk_score,
                expected_decision=case.expected_decision,
                expected_reasoning=case.expected_reasoning,
                v_baseline_version=trace_base.version,
                v_baseline_decision=trace_base.final_decision,
                v_baseline_success=trace_base.success,
                v_current_version=trace_curr.version,
                v_current_decision=trace_curr.final_decision,
                v_current_success=trace_curr.success,
                status=status,
                is_silent_failure=is_silent,
                divergence_step=div_step,
                divergence_node_name=div_node,
                divergence_reason=div_reason,
                v_baseline_trace=trace_base,
                v_current_trace=trace_curr
            )
        )

    total = len(engine.dataset)
    base_acc = round((baseline_correct / total) * 100, 1) if total > 0 else 0.0
    curr_acc = round((current_correct / total) * 100, 1) if total > 0 else 0.0
    delta = round(curr_acc - base_acc, 1)

    metrics = ReplayMetrics(
        total_cases=total,
        fixed_count=fixed_count,
        stable_count=stable_count,
        regression_count=regression_count,
        still_failing_count=still_failing_count,
        silent_failure_count=silent_failure_count,
        baseline_accuracy=base_acc,
        current_accuracy=curr_acc,
        accuracy_delta=delta,
        v_baseline_version=baseline_graph.version,
        v_current_version=sandbox_graph.version
    )

    return ReplayResponse(metrics=metrics, cases=results)


@app.post("/api/cases/promote")
def promote_trace_to_test(req: PromoteTraceRequest):
    new_case = TestCase(
        id=req.id,
        title=req.title,
        category=req.category,
        amount=req.amount,
        currency=req.currency,
        customer={
            "name": req.customer_name,
            "id": req.customer_id,
            "kyc_verified": req.kyc_verified,
            "tenure_months": req.tenure_months,
            "trust_score": req.trust_score,
            "location": req.location
        },
        transaction={
            "merchant": req.merchant,
            "location": req.merchant_location,
            "type": req.transaction_type,
            "channel": req.channel
        },
        evidence={
            "customer_receipt": req.customer_receipt,
            "merchant_response": req.merchant_response,
            "merchant_evidence_present": req.merchant_evidence_present
        },
        risk_score=req.risk_score,
        expected_decision=req.expected_decision,
        expected_reasoning=req.expected_reasoning,
        policy_tags=req.policy_tags
    )
    
    existing_idx = next((i for i, c in enumerate(engine.dataset) if c.id == new_case.id), None)
    if existing_idx is not None:
        engine.dataset[existing_idx] = new_case
    else:
        engine.dataset.insert(0, new_case)
        
    return {
        "status": "success",
        "message": f"Incident trace {new_case.id} successfully promoted to Golden Regression Suite.",
        "case": new_case
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="127.0.0.1", port=8000, reload=True)
