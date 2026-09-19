"""
Unit and Regression Tests for PatchReplay Core Engine
"""

import pytest
import sys
from pathlib import Path

# Set up path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.engine.comparator import ReplayEngine, OutcomeStatus
from backend.engine.models import TestCase


@pytest.fixture
def replay_engine():
    return ReplayEngine()


def test_dataset_loading(replay_engine):
    assert len(replay_engine.dataset) >= 100
    first_case = replay_engine.dataset[0]
    assert isinstance(first_case, TestCase)
    assert first_case.id == "C-103"
    assert first_case.expected_decision == "RESOLVE"


def test_v12_vs_v13_regression_metrics(replay_engine):
    """
    Test that evaluating V12 -> V13 accurately captures:
    - 12 Fixed cases
    - 4 Regressions (including silent failure C-182)
    - 104 Stable cases
    """
    res = replay_engine.run_replay("v12", "v13")
    m = res.metrics
    
    assert m.total_cases == 120
    assert m.fixed_count == 12
    assert m.regression_count == 4
    assert m.silent_failure_count == 4
    assert m.stable_count == 104
    assert m.still_failing_count == 0
    assert m.baseline_accuracy == 90.0
    assert m.current_accuracy == 96.7


def test_v12_vs_v14_hardened_metrics(replay_engine):
    """
    Test that evaluating V12 -> V14 achieves 100% test pass:
    - 12 Fixed cases
    - 0 Regressions
    - 0 Silent failures
    - 108 Stable cases
    """
    res = replay_engine.run_replay("v12", "v14")
    m = res.metrics
    
    assert m.total_cases == 120
    assert m.fixed_count == 12
    assert m.regression_count == 0
    assert m.silent_failure_count == 0
    assert m.stable_count == 108
    assert m.still_failing_count == 0
    assert m.current_accuracy == 100.0


def test_c182_silent_failure_divergence(replay_engine):
    """
    Specifically verifies that Case C-182 is flagged as a Silent Failure
    and identifies Step 5 (Policy Evaluation) as the exact node of divergence.
    """
    res = replay_engine.run_replay("v12", "v13")
    c182 = next((c for c in res.cases if c.case_id == "C-182"), None)
    
    assert c182 is not None
    assert c182.status == OutcomeStatus.REGRESSION
    assert c182.is_silent_failure is True
    assert c182.v_baseline_decision == "ESCALATE"
    assert c182.v_current_decision == "RESOLVE"
    assert c182.expected_decision == "ESCALATE"
    assert c182.divergence_step == 5
    assert "Policy" in c182.divergence_node_name
