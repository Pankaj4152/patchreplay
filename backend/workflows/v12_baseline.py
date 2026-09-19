"""
Workflow V12 - Production Baseline
Flawed Policy: Overly strict legacy tenure filter (< 24 months) rejects legitimate customer disputes,
causing false rejections on low-risk customer claims.
Zero access to expected ground-truth fields or hardcoded IDs.
"""

from typing import Dict, Any, Tuple
from backend.engine.models import TestCase
from backend.workflows.base_workflow import BaseWorkflowNode, WorkflowGraph


class CollectInfoNode(BaseWorkflowNode):
    name = "Ingest & Normalize"
    node_id = "collect_info"

    def execute(self, state: Dict[str, Any], case: TestCase) -> Tuple[Dict[str, Any], str, str]:
        state["normalized_amount"] = case.amount
        state["channel"] = case.transaction.channel
        state["customer_id"] = case.customer.id
        reasoning = f"Parsed incoming dispute {case.id} for ${case.amount:.2f} via {case.transaction.channel}."
        return state, reasoning, "INFO_INGESTED"


class CustomerVerifyNode(BaseWorkflowNode):
    name = "Customer KYC & Trust Check"
    node_id = "customer_verify"

    def execute(self, state: Dict[str, Any], case: TestCase) -> Tuple[Dict[str, Any], str, str]:
        state["kyc_passed"] = case.customer.kyc_verified
        state["trust_score"] = case.customer.trust_score
        state["tenure_months"] = case.customer.tenure_months
        
        if not case.customer.kyc_verified:
            state["flags"].append("UNVERIFIED_CUSTOMER")
            reasoning = f"Customer {case.customer.id} failed KYC verification. Low trust score ({case.customer.trust_score})."
            return state, reasoning, "KYC_FAILED"
        
        reasoning = f"Customer {case.customer.id} verified. Tenure: {case.customer.tenure_months} mo, Trust Score: {case.customer.trust_score}/100."
        return state, reasoning, "KYC_PASSED"


class RiskAssessmentNode(BaseWorkflowNode):
    name = "Risk & Anomaly Assessment"
    node_id = "risk_assessment"

    def execute(self, state: Dict[str, Any], case: TestCase) -> Tuple[Dict[str, Any], str, str]:
        state["risk_score"] = case.risk_score
        is_cross_border = case.customer.location != case.transaction.location
        state["cross_border"] = is_cross_border
        
        if case.risk_score >= 70 or "high_risk" in case.policy_tags or "mandatory_escalation" in case.policy_tags:
            state["flags"].append("HIGH_RISK_SCORE")
            state["escalation_reasons"].append(f"Risk score {case.risk_score} exceeds safety threshold (70)")
            reasoning = f"High risk anomaly detected (score {case.risk_score}). Location check: {case.transaction.location}."
            return state, reasoning, "RISK_HIGH"
        elif case.risk_score >= 35:
            state["flags"].append("MEDIUM_RISK")
            reasoning = f"Moderate risk level (score {case.risk_score}). Standard evaluation path."
            return state, reasoning, "RISK_MEDIUM"
        else:
            reasoning = f"Dispute falls within clean low-risk distribution (score {case.risk_score})."
            return state, reasoning, "RISK_LOW"


class MerchantEvidenceNode(BaseWorkflowNode):
    name = "Merchant Evidence Audit"
    node_id = "merchant_evidence"

    def execute(self, state: Dict[str, Any], case: TestCase) -> Tuple[Dict[str, Any], str, str]:
        state["merchant_evidence_present"] = case.evidence.merchant_evidence_present
        state["merchant_response"] = case.evidence.merchant_response
        state["customer_receipt"] = case.evidence.customer_receipt
        
        if not case.evidence.merchant_evidence_present:
            state["flags"].append("MISSING_MERCHANT_EVIDENCE")
            reasoning = f"Merchant '{case.transaction.merchant}' provided no counter-evidence within required SLA window."
            return state, reasoning, "EVIDENCE_MISSING"
        
        reasoning = f"Merchant response audited: '{case.evidence.merchant_response}'. Proof package attached."
        return state, reasoning, "EVIDENCE_VALIDATED"


class PolicyEvaluationNodeV12(BaseWorkflowNode):
    name = "Reg Ops Policy Engine"
    node_id = "policy_evaluation"

    def execute(self, state: Dict[str, Any], case: TestCase) -> Tuple[Dict[str, Any], str, str]:
        # Rule 1: Identity verification failure
        if not state["kyc_passed"]:
            state["decision"] = "REJECT"
            reasoning = "Policy Rule 1.0 (V12): Auto-rejected dispute due to unverified KYC."
            return state, reasoning, "DECISION_REJECT"

        # V12 KNOWN BUG: Overly aggressive tenure filter (< 24 mo) rejecting legitimate low-risk customer claims
        if state["tenure_months"] < 24 and state["customer_receipt"] and ("customer_favored" in case.policy_tags or "recurring_subscription" in case.policy_tags or state["risk_score"] < 40 or case.amount < 200):
            state["decision"] = "REJECT"
            reasoning = f"Policy Rule 2.1 (V12 Legacy Bug): Auto-rejected valid claim because account tenure ({state['tenure_months']} mo) is under legacy 24-month threshold."
            return state, reasoning, "DECISION_REJECT"

        # Rule 2: Mandatory Safety Checks
        tags = set(case.policy_tags)
        is_missing_ev = not state["merchant_evidence_present"]
        is_high_risk = "HIGH_RISK_SCORE" in state["flags"] or "mandatory_escalation" in tags or "ato_risk" in tags or "high_risk" in tags
        is_wire_or_high_val = case.category == "Unauthorized Wire Transfer" or case.amount >= 1500

        if is_high_risk or is_missing_ev or is_wire_or_high_val:
            state["decision"] = "ESCALATE"
            reasoning = "Policy Rule 4.2 (V12): Mandatory human compliance escalation triggered for high-risk / missing evidence."
            return state, reasoning, "DECISION_ESCALATE"

        # Rule 3: Unsubstantiated Claim
        if not state["customer_receipt"] and state["merchant_evidence_present"]:
            state["decision"] = "REJECT"
            reasoning = "Policy Rule 2.4 (V12): Dispute rejected because customer provided no receipt and merchant verified charge."
            return state, reasoning, "DECISION_REJECT"

        # Rule 4: Validated Resolution
        if state["customer_receipt"] and (state["risk_score"] < 50 or "customer_favored" in tags or "auto_resolution" in tags or "duplicate_charge" in tags or "recurring_subscription" in tags):
            state["decision"] = "RESOLVE"
            reasoning = "Policy Rule 3.1 (V12): Validated dispute resolved in customer favor."
            return state, reasoning, "DECISION_RESOLVE"

        if state["risk_score"] >= 50:
            state["decision"] = "REJECT"
            reasoning = "Policy Rule 2.0 (V12): Dispute claim lacked sufficient evidence under moderate-to-high risk profile."
            return state, reasoning, "DECISION_REJECT"

        state["decision"] = "RESOLVE"
        reasoning = "Policy Rule 3.0 (V12): Low-risk dispute approved."
        return state, reasoning, "DECISION_RESOLVE"


def get_v12_workflow() -> WorkflowGraph:
    nodes = [
        CollectInfoNode(),
        CustomerVerifyNode(),
        RiskAssessmentNode(),
        MerchantEvidenceNode(),
        PolicyEvaluationNodeV12()
    ]
    return WorkflowGraph(version="V12", workflow_name="Production Baseline (V12)", nodes=nodes)
