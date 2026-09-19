"""
Unit, Regression, and Policy Invariant Tests for PatchReplay Core Engine.
Validates that workflows execute purely on input attributes and that policy rules
behave with total determinism and zero ground-truth leakage.
"""

import pytest
import sys
from pathlib import Path

# Add root directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.engine.comparator import ReplayEngine, OutcomeStatus
from backend.engine.models import TestCase
from backend.workflows.v12_baseline import get_v12_workflow
from backend.workflows.v13_naive_fix import get_v13_workflow
from backend.workflows.v14_hardened import get_v14_workflow


@pytest.fixture
def replay_engine():
    return ReplayEngine()


def test_dataset_loading(replay_engine):
    assert len(replay_engine.dataset) >= 100
    first_case = replay_engine.dataset[0]
    assert isinstance(first_case, TestCase)
    assert first_case.id == "C-103"


def test_policy_invariant_unverified_kyc_always_rejects():
    """Invariant: An unverified customer identity must always result in REJECT."""
    v14 = get_v14_workflow()
    dummy_case = TestCase(
        id="TEST-KYC",
        title="Test Failed KYC",
        category="Card Fraud Dispute",
        amount=50.0,
        currency="USD",
        customer={
            "name": "Jane Doe",
            "id": "C-999",
            "kyc_verified": False,
            "tenure_months": 12,
            "trust_score": 90,
            "location": "US"
        },
        transaction={"merchant": "Store", "location": "US", "type": "POS", "channel": "POS"},
        evidence={"customer_receipt": True, "merchant_response": "OK", "merchant_evidence_present": True},
        risk_score=10,
        expected_decision="REJECT",
        expected_reasoning="KYC failed."
    )
    trace = v14.run(dummy_case)
    assert trace.final_decision == "REJECT"


def test_policy_invariant_v14_protects_missing_merchant_evidence():
    """Invariant: High-risk dispute with missing merchant evidence MUST escalate in V14 even with 100/100 trust."""
    v14 = get_v14_workflow()
    case_c182_like = TestCase(
        id="TEST-SAFETY",
        title="High Value Missing Evidence",
        category="Cross-Border Merchant Overcharge",
        amount=2500.0,
        currency="USD",
        customer={
            "name": "VIP Customer",
            "id": "C-111",
            "kyc_verified": True,
            "tenure_months": 48,
            "trust_score": 99,  # Ultra high trust
            "location": "India"
        },
        transaction={"merchant": "Luxury Store", "location": "UK", "type": "E-Commerce", "channel": "Card Not Present"},
        evidence={"customer_receipt": True, "merchant_response": "None", "merchant_evidence_present": False},  # Missing evidence!
        risk_score=85,  # High risk!
        expected_decision="ESCALATE",
        expected_reasoning="Mandatory escalation."
    )
    trace = v14.run(case_c182_like)
    assert trace.final_decision == "ESCALATE", "V14 must strictly enforce safety guardrail on missing evidence regardless of trust score!"


def test_policy_invariant_v13_naive_trust_override_creates_silent_failure():
    """Invariant: In V13, naive trust rule overrides missing evidence safety check, creating silent failure."""
    v13 = get_v13_workflow()
    case_c182_like = TestCase(
        id="TEST-V13-REGRESSION",
        title="High Value Missing Evidence with High Trust",
        category="Cross-Border Merchant Overcharge",
        amount=2500.0,
        currency="USD",
        customer={
            "name": "VIP Customer",
            "id": "C-111",
            "kyc_verified": True,
            "tenure_months": 48,
            "trust_score": 85,
            "location": "India"
        },
        transaction={"merchant": "Luxury Store", "location": "UK", "type": "E-Commerce", "channel": "Card Not Present"},
        evidence={"customer_receipt": True, "merchant_response": "None", "merchant_evidence_present": False},
        risk_score=82,
        expected_decision="ESCALATE",
        expected_reasoning="Mandatory escalation."
    )
    trace = v13.run(case_c182_like)
    assert trace.final_decision == "RESOLVE", "V13 naively auto-resolves because trust_score >= 80 precedes safety check."


def test_v12_vs_v13_regression_detection(replay_engine):
    """Verifies that PatchReplay accurately detects regressions and silent failures in V12 -> V13."""
    res = replay_engine.run_replay("v12", "v13")
    assert res.metrics.regression_count > 0
    assert res.metrics.silent_failure_count > 0

    c182 = next((c for c in res.cases if c.case_id == "C-182"), None)
    assert c182 is not None
    assert c182.status == OutcomeStatus.REGRESSION
    assert c182.is_silent_failure is True
    assert c182.divergence_step == 5


def test_v12_vs_v14_hardened_verification(replay_engine):
    """Verifies that V14 fixes baseline bugs with ZERO regressions and ZERO silent failures."""
    res = replay_engine.run_replay("v12", "v14")
    assert res.metrics.regression_count == 0
    assert res.metrics.silent_failure_count == 0
    assert res.metrics.current_accuracy == 100.0


def test_zero_ground_truth_leakage_invariant():
    """Security/Integrity Invariant: Verify workflows NEVER inspect expected_decision or expected_reasoning."""
    import inspect
    import backend.workflows.v12_baseline as v12_mod
    import backend.workflows.v13_naive_fix as v13_mod
    import backend.workflows.v14_hardened as v14_mod

    for mod in [v12_mod, v13_mod, v14_mod]:
        src = inspect.getsource(mod)
        assert "expected_decision" not in src, f"{mod.__name__} violates ground-truth isolation by reading expected_decision!"
        assert "expected_reasoning" not in src, f"{mod.__name__} violates ground-truth isolation by reading expected_reasoning!"
        assert "C-182" not in src, f"{mod.__name__} contains hardcoded case ID C-182!"


def test_fastapi_endpoints():
    """Test all FastAPI endpoints for correct response schemas and replay output."""
    from fastapi.testclient import TestClient
    from backend.app import app

    client = TestClient(app)

    # 1. Health check
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"

    # 2. Replay comparison
    resp = client.get("/api/replay?baseline=v12&candidate=v13")
    assert resp.status_code == 200
    data = resp.json()
    assert "metrics" in data
    assert data["metrics"]["regression_count"] > 0
    assert data["metrics"]["silent_failure_count"] > 0

    # 3. Trace visualization
    resp = client.get("/api/trace/C-182?baseline=v12&candidate=v13")
    assert resp.status_code == 200
    trace_data = resp.json()
    assert trace_data["is_silent_failure"] is True
    assert trace_data["divergence_step"] == 5

    # 4. Sandbox evaluation
    sandbox_payload = {
        "trust_threshold": 95,
        "bypass_missing_evidence": False,
        "max_auto_amount": 500.0,
        "strict_kyc": True
    }
    resp = client.post("/api/sandbox/evaluate", json=sandbox_payload)
    assert resp.status_code == 200
    eval_data = resp.json()
    assert eval_data["metrics"]["total_cases"] >= 100
    assert "current_accuracy" in eval_data["metrics"]

