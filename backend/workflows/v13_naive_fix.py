"""
Workflow V13 - Naive Bugfix (Introduces Silent Failures & Regressions)
Fixes the 12 false rejections from V12, but introduces a naive trust-based fast-track that bypasses mandatory high-risk escalations.
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

# Exactly 4 specific cases where V13 naively auto-resolves high-risk/missing-evidence cases (Regressions)
V13_REGRESSION_CASES = {"C-182", "C-004", "C-028", "C-064"}


class PolicyEvaluationNodeV13(BaseWorkflowNode):
    name = "Reg Ops Policy Engine"
    node_id = "policy_evaluation"

    def execute(self, state: Dict[str, Any], case: TestCase) -> Tuple[Dict[str, Any], str, str]:
        if not state["kyc_passed"]:
            state["decision"] = "REJECT"
            reasoning = f"Policy Rule 1.0 (V13): Auto-rejected dispute {case.id} due to unverified KYC."
            return state, reasoning, "DECISION_REJECT"

        # NAIVE BUG: Fast-track auto-resolves for trusted profiles, accidentally bypassing high-risk / missing evidence
        if case.id in V13_REGRESSION_CASES:
            state["decision"] = "RESOLVE"
            reasoning = f"Policy Rule 3.3 (V13 Naive Fast-Track): Auto-resolved based on customer trust score ({state['trust_score']}/100) and receipt (Bypassed missing evidence & high-risk check!)."
            return state, reasoning, "DECISION_RESOLVE"

        # Normal execution matching ground truth (12 V12 bugs are fixed)
        state["decision"] = case.expected_decision
        if case.expected_decision == "ESCALATE":
            reasoning = f"Policy Rule 4.2 (V13): Escalated to human compliance for risk/evidence review."
            impact = "DECISION_ESCALATE"
        elif case.expected_decision == "RESOLVE":
            reasoning = f"Policy Rule 3.1 (V13): Validated dispute resolved in customer favor."
            impact = "DECISION_RESOLVE"
        else:
            reasoning = f"Policy Rule 2.4 (V13): Dispute rejected based on merchant counter-evidence."
            impact = "DECISION_REJECT"

        return state, reasoning, impact


def get_v13_workflow() -> WorkflowGraph:
    nodes = [
        CollectInfoNode(),
        CustomerVerifyNode(),
        RiskAssessmentNode(),
        MerchantEvidenceNode(),
        PolicyEvaluationNodeV13()
    ]
    return WorkflowGraph(version="V13", workflow_name="Naive Bugfix (V13)", nodes=nodes)
