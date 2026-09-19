"""
Workflow V13 - Naive Bugfix (Introduces Silent Operational Failures & Regressions)
The engineer fixed the tenure filter from V12, but naively added a VIP fast-track rule
(trust_score >= 80) BEFORE checking mandatory risk and missing evidence guardrails.
Zero access to expected ground-truth fields or hardcoded IDs.
"""

from typing import Dict, Any, Tuple
from backend.engine.models import TestCase
from backend.workflows.base_workflow import BaseWorkflowNode, WorkflowGraph
from backend.workflows.v12_baseline import (
    CollectInfoNode,
    CustomerVerifyNode,
    RiskAssessmentNode,
    MerchantEvidenceNode
)


class PolicyEvaluationNodeV13(BaseWorkflowNode):
    name = "Reg Ops Policy Engine"
    node_id = "policy_evaluation"

    def execute(self, state: Dict[str, Any], case: TestCase) -> Tuple[Dict[str, Any], str, str]:
        # Rule 1: Identity verification failure
        if not state["kyc_passed"]:
            state["decision"] = "REJECT"
            reasoning = "Policy Rule 1.0 (V13): Auto-rejected dispute due to unverified KYC."
            return state, reasoning, "DECISION_REJECT"

        # NAIVE BUGFIX: Intended to speed up trusted resolutions and eliminate false rejections,
        # but accidentally auto-resolves for ANY customer with trust score >= 80 and a receipt,
        # executing BEFORE mandatory missing-evidence and high-risk safety checks!
        if state["trust_score"] >= 80 and state["customer_receipt"]:
            state["decision"] = "RESOLVE"
            reasoning = f"Policy Rule 3.3 (V13 Naive Fast-Track): Auto-resolved based on customer trust score ({state['trust_score']}/100) and receipt (Bypassed missing evidence & high-risk check!)."
            return state, reasoning, "DECISION_RESOLVE"

        # Rule 2: Mandatory Safety Checks (Now only reached if trust_score < 80)
        tags = set(case.policy_tags)
        is_missing_ev = not state["merchant_evidence_present"]
        is_high_risk = "HIGH_RISK_SCORE" in state["flags"] or "mandatory_escalation" in tags or "ato_risk" in tags or "high_risk" in tags
        is_wire_or_high_val = case.category == "Unauthorized Wire Transfer" or case.amount >= 1500

        if is_high_risk or is_missing_ev or is_wire_or_high_val:
            state["decision"] = "ESCALATE"
            reasoning = "Policy Rule 4.2 (V13): Mandatory human compliance escalation triggered for risk/missing evidence."
            return state, reasoning, "DECISION_ESCALATE"

        # Rule 3: Unsubstantiated Claim
        if not state["customer_receipt"] and state["merchant_evidence_present"]:
            state["decision"] = "REJECT"
            reasoning = "Policy Rule 2.4 (V13): Dispute rejected because customer provided no receipt and merchant verified charge."
            return state, reasoning, "DECISION_REJECT"

        # Rule 4: Validated Resolution (Tenure check properly removed)
        if state["customer_receipt"] and (state["risk_score"] < 50 or "customer_favored" in tags or "auto_resolution" in tags or "duplicate_charge" in tags or "recurring_subscription" in tags):
            state["decision"] = "RESOLVE"
            reasoning = "Policy Rule 3.1 (V13): Validated dispute resolved in customer favor."
            return state, reasoning, "DECISION_RESOLVE"

        if state["risk_score"] >= 50:
            state["decision"] = "REJECT"
            reasoning = "Policy Rule 2.0 (V13): Dispute claim lacked sufficient evidence under moderate-to-high risk profile."
            return state, reasoning, "DECISION_REJECT"

        state["decision"] = "RESOLVE"
        reasoning = "Policy Rule 3.0 (V13): Low-risk dispute approved."
        return state, reasoning, "DECISION_RESOLVE"


def get_v13_workflow() -> WorkflowGraph:
    nodes = [
        CollectInfoNode(),
        CustomerVerifyNode(),
        RiskAssessmentNode(),
        MerchantEvidenceNode(),
        PolicyEvaluationNodeV13()
    ]
    return WorkflowGraph(version="V13", workflow_name="Naive Bugfix (V13)", nodes=nodes)
