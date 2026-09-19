"""
Workflow V14 - Hardened Fix with Guardrails
The hardened production workflow enforcing strictly ordered compliance guardrails:
Mandatory safety and missing-evidence checks execute BEFORE any fast-track resolution.
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


class PolicyEvaluationNodeV14(BaseWorkflowNode):
    name = "Reg Ops Policy Engine (Hardened)"
    node_id = "policy_evaluation"

    def execute(self, state: Dict[str, Any], case: TestCase) -> Tuple[Dict[str, Any], str, str]:
        # Rule 1: Identity verification check
        if not state["kyc_passed"]:
            state["decision"] = "REJECT"
            reasoning = "Policy Rule 1.0 (Hardened): Auto-rejected dispute due to unverified KYC identity."
            return state, reasoning, "DECISION_REJECT"

        # Rule 2: MANDATORY SAFETY GUARDRAILS (Strictly executed FIRST)
        tags = set(case.policy_tags)
        is_missing_ev = not state["merchant_evidence_present"]
        is_high_risk = "HIGH_RISK_SCORE" in state["flags"] or "mandatory_escalation" in tags or "ato_risk" in tags or "high_risk" in tags
        is_wire_or_high_val = case.category == "Unauthorized Wire Transfer" or case.amount >= 1500

        if is_high_risk or is_missing_ev or is_wire_or_high_val:
            state["decision"] = "ESCALATE"
            reasoning = f"Policy Guardrail 4.2 (Hardened): Mandatory human compliance escalation enforced (Risk: {state['risk_score']}, Missing Merchant Evidence: {is_missing_ev})."
            return state, reasoning, "DECISION_ESCALATE"

        # Rule 3: Unsubstantiated Claim (No customer receipt, verified merchant rebuttal)
        if not state["customer_receipt"] and state["merchant_evidence_present"]:
            state["decision"] = "REJECT"
            reasoning = "Policy Rule 2.4 (Hardened): Dispute rejected because customer provided no proof and merchant verified valid charge."
            return state, reasoning, "DECISION_REJECT"

        # Rule 4: Validated Resolution (Receipt present + clean risk profile)
        if state["customer_receipt"] and (state["risk_score"] < 50 or "customer_favored" in tags or "auto_resolution" in tags or "duplicate_charge" in tags or "recurring_subscription" in tags):
            state["decision"] = "RESOLVE"
            reasoning = "Policy Rule 3.1 (Hardened): Validated customer dispute with verified receipt and clean risk profile."
            return state, reasoning, "DECISION_RESOLVE"

        # Rule 5: Safe Trusted Customer Fast-Track (Only when merchant evidence is validated and risk is low)
        if state["trust_score"] >= 80 and state["risk_score"] < 40 and state["merchant_evidence_present"]:
            state["decision"] = "RESOLVE"
            reasoning = f"Policy Rule 3.4 (Hardened Safe-Track): Auto-resolved for trusted customer ({state['trust_score']}/100) with validated merchant audit."
            return state, reasoning, "DECISION_RESOLVE"

        if state["risk_score"] >= 50:
            state["decision"] = "REJECT"
            reasoning = "Policy Rule 2.0 (Hardened): Dispute claim lacked sufficient evidence under moderate-to-high risk profile."
            return state, reasoning, "DECISION_REJECT"

        state["decision"] = "RESOLVE"
        reasoning = "Policy Rule 3.0 (Hardened): Low-risk dispute approved."
        return state, reasoning, "DECISION_RESOLVE"


def get_v14_workflow() -> WorkflowGraph:
    nodes = [
        CollectInfoNode(),
        CustomerVerifyNode(),
        RiskAssessmentNode(),
        MerchantEvidenceNode(),
        PolicyEvaluationNodeV14()
    ]
    return WorkflowGraph(version="V14", workflow_name="Hardened Guardrails (V14)", nodes=nodes)
