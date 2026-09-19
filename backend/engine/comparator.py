"""
PatchReplay - Trace Comparator & Regression Analyzer
Calculates divergence points, classifies regression statuses, and flags silent operational failures.
"""

import json
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path

from backend.engine.models import (
    TestCase,
    ComparisonResult,
    OutcomeStatus,
    ReplayMetrics,
    ReplayResponse,
    WorkflowTrace
)
from backend.workflows.base_workflow import WorkflowGraph
from backend.workflows.v12_baseline import get_v12_workflow
from backend.workflows.v13_naive_fix import get_v13_workflow
from backend.workflows.v14_hardened import get_v14_workflow


def load_dataset(dataset_path: Optional[str] = None) -> List[TestCase]:
    if dataset_path is None:
        # Default path lookup
        current_dir = Path(__file__).resolve().parent
        dataset_path = str(current_dir.parent / "dataset.json")
    
    with open(dataset_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)
    
    return [TestCase(**item) for item in raw_data]


def find_divergence(trace_a: WorkflowTrace, trace_b: WorkflowTrace) -> Tuple[Optional[int], Optional[str], Optional[str]]:
    """
    Finds the earliest step where two workflow traces diverge in state, impact, or decision.
    """
    min_len = min(len(trace_a.nodes), len(trace_b.nodes))
    for i in range(min_len):
        node_a = trace_a.nodes[i]
        node_b = trace_b.nodes[i]
        
        # Check decision impact divergence
        if node_a.decision_impact != node_b.decision_impact:
            return (
                node_a.step_index,
                node_a.node_name,
                f"Impact diverged: {trace_a.version} yielded '{node_a.decision_impact}' vs {trace_b.version} yielded '{node_b.decision_impact}'"
            )
        
        # Check decision state change
        dec_a = node_a.output_state.get("decision")
        dec_b = node_b.output_state.get("decision")
        if dec_a != dec_b and (dec_a is not None or dec_b is not None):
            return (
                node_a.step_index,
                node_a.node_name,
                f"Decision diverged: {trace_a.version} selected '{dec_a or 'IN_PROGRESS'}' vs {trace_b.version} selected '{dec_b or 'IN_PROGRESS'}'"
            )
            
        # Check flags divergence
        flags_a = set(node_a.output_state.get("flags", []))
        flags_b = set(node_b.output_state.get("flags", []))
        if flags_a != flags_b:
            diff = (flags_a ^ flags_b)
            return (
                node_a.step_index,
                node_a.node_name,
                f"State flags diverged on {list(diff)}."
            )
            
    if trace_a.final_decision != trace_b.final_decision:
        return (
            len(trace_a.nodes),
            trace_a.nodes[-1].node_name if trace_a.nodes else "Final Decision",
            f"Final decision diverged: '{trace_a.final_decision}' vs '{trace_b.final_decision}'"
        )
        
    return None, None, None


class ReplayEngine:
    def __init__(self, dataset: Optional[List[TestCase]] = None):
        self.dataset = dataset if dataset is not None else load_dataset()
        self.workflow_registry: Dict[str, WorkflowGraph] = {
            "v12": get_v12_workflow(),
            "v13": get_v13_workflow(),
            "v14": get_v14_workflow()
        }

    def run_replay(self, baseline_ver: str = "v12", current_ver: str = "v13") -> ReplayResponse:
        baseline_graph = self.workflow_registry.get(baseline_ver.lower(), get_v12_workflow())
        current_graph = self.workflow_registry.get(current_ver.lower(), get_v13_workflow())
        
        results: List[ComparisonResult] = []
        fixed_count = 0
        stable_count = 0
        regression_count = 0
        still_failing_count = 0
        silent_failure_count = 0
        
        baseline_correct = 0
        current_correct = 0
        
        for case in self.dataset:
            trace_base = baseline_graph.run(case)
            trace_curr = current_graph.run(case)
            
            is_base_correct = (trace_base.final_decision == case.expected_decision)
            is_curr_correct = (trace_curr.final_decision == case.expected_decision)
            
            if is_base_correct:
                baseline_correct += 1
            if is_curr_correct:
                current_correct += 1
                
            # Classify Outcome Status
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
                
            # Detect Silent Failures (Successful 200 OK execution, but wrong operational action)
            is_silent = False
            if not is_curr_correct and trace_curr.success:
                # Especially critical if expected was ESCALATE/REJECT and agent auto-resolved!
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
            
        total = len(self.dataset)
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
            v_current_version=current_graph.version
        )
        
        return ReplayResponse(metrics=metrics, cases=results)
