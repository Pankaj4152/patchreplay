"""
PatchReplay - FastAPI Backend Service
Provides REST API endpoints for test case management, replay analysis, trace divergence inspection,
incident ingestion (Promote Trace to Test), and live rule sandbox evaluation.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.engine.models import (
    TestCase,
    ComparisonResult,
    ReplayResponse,
    WorkflowTrace
)
from backend.engine.comparator import ReplayEngine, load_dataset


app = FastAPI(
    title="PatchReplay API",
    description="AI Workflow Regression & Reliability Lab Backend",
    version="1.0.0"
)

# Enable CORS for frontend development and production
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
    fast_track_trust_threshold: int = 80
    require_merchant_evidence: bool = True
    max_auto_resolve_amount: float = 1000.0
    mandatory_escalate_high_risk: bool = True
    high_risk_threshold: int = 70


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


@app.post("/api/replay", response_model=ReplayResponse)
def run_replay_comparison(req: ReplayRequest = Body(...)):
    res = engine.run_replay(req.baseline_version, req.current_version)
    if req.case_ids:
        target_set = set(c.upper() for c in req.case_ids)
        filtered_cases = [c for c in res.cases if c.case_id.upper() in target_set]
        res.cases = filtered_cases
    return res


@app.get("/api/trace/{case_id}")
def get_case_trace(case_id: str, v1: str = "v12", v2: str = "v13"):
    response = engine.run_replay(v1, v2)
    match = next((c for c in response.cases if c.case_id.upper() == case_id.upper()), None)
    if not match:
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found in regression suite.")
    return match


@app.post("/api/cases/promote")
def promote_trace_to_test(req: PromoteTraceRequest):
    """
    Ingests an incident trace from production logs and converts it into a permanent test case.
    """
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
    
    # Check if already exists
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
