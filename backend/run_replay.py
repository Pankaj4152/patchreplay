"""
PatchReplay - Standalone CLI Runner & Evaluation Reporter
Runs replay suites between workflow versions and prints rich terminal summaries.
"""

import sys
import argparse
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.engine.comparator import ReplayEngine, OutcomeStatus


def run_cli():
    parser = argparse.ArgumentParser(description="PatchReplay: AI Workflow Regression & Reliability Lab")
    parser.add_argument("--v1", default="v12", help="Baseline workflow version (default: v12)")
    parser.add_argument("--v2", default="v13", help="Target workflow version to evaluate (default: v13)")
    parser.add_argument("--inspect", default=None, help="Inspect specific case ID (e.g. C-182)")
    args = parser.parse_args()

    engine = ReplayEngine()
    print("=" * 80)
    print(f"  PATCHREPLAY: AI WORKFLOW REGRESSION LAB")
    print(f"  Evaluating: {args.v1.upper()} (Baseline)  --->  {args.v2.upper()} (Changed Version)")
    print("=" * 80)

    response = engine.run_replay(args.v1, args.v2)
    m = response.metrics

    print(f"\n[METRICS SUMMARY]")
    print(f"  Total Cases Replayed    : {m.total_cases}")
    print(f"  \033[92m[+] FIXED\033[0m               : {m.fixed_count}")
    print(f"  \033[90m[=] STABLE\033[0m              : {m.stable_count}")
    print(f"  \033[91m[-] REGRESSIONS\033[0m         : {m.regression_count}")
    print(f"  \033[93m[?] STILL FAILING\033[0m       : {m.still_failing_count}")
    print(f"  \033[95m[!] SILENT FAILURES\033[0m     : {m.silent_failure_count}")
    print(f"  Baseline Accuracy ({m.v_baseline_version}) : {m.baseline_accuracy}%")
    print(f"  Current Accuracy  ({m.v_current_version}) : {m.current_accuracy}% (Delta: {m.accuracy_delta:+0.1f}%)")

    # If specific case inspection requested
    if args.inspect:
        target_case = next((c for c in response.cases if c.case_id.upper() == args.inspect.upper()), None)
        if not target_case:
            print(f"\nCase {args.inspect} not found in test suite.")
            return

        print("\n" + "=" * 80)
        print(f"  CASE INSPECTOR: {target_case.case_id} - {target_case.title}")
        print(f"  Amount: ${target_case.amount} | Risk Score: {target_case.risk_score} | Expected: {target_case.expected_decision}")
        print(f"  Status: {target_case.status.value} | Silent Failure: {target_case.is_silent_failure}")
        if target_case.divergence_node_name:
            print(f"  Divergence: Step {target_case.divergence_step} ({target_case.divergence_node_name})")
            print(f"  Reason: {target_case.divergence_reason}")
        print("=" * 80)

        print("\n  STEP-BY-STEP TRACE COMPARISON:")
        print(f"  {'STEP':<6} {'NODE NAME':<25} {target_case.v_baseline_version + ' (OLD)':<18} {target_case.v_current_version + ' (NEW)':<18}")
        print("  " + "-" * 70)

        for i in range(len(target_case.v_baseline_trace.nodes)):
            n_old = target_case.v_baseline_trace.nodes[i]
            n_new = target_case.v_current_trace.nodes[i]
            is_div = (n_old.step_index == target_case.divergence_step)
            marker = " -> [DIVERGENCE]" if is_div else ""
            print(f"  {n_old.step_index:<6} {n_old.node_name:<25} {str(n_old.decision_impact):<18} {str(n_new.decision_impact):<18}{marker}")

        print(f"\n  Final Decision: {target_case.v_baseline_version}={target_case.v_baseline_decision} | {target_case.v_current_version}={target_case.v_current_decision} | Expected={target_case.expected_decision}")
        print("=" * 80)
    else:
        # Show table of noteworthy cases (Fixed, Regressions, Silent Failures)
        print("\n[KEY OUTCOME ANOMALIES & REGRESSIONS]")
        print(f"  {'CASE ID':<8} {'CATEGORY':<28} {'EXPECTED':<12} {m.v_baseline_version:<10} {m.v_current_version:<12} {'STATUS':<15}")
        print("  " + "-" * 88)
        
        flagged = [c for c in response.cases if c.status in [OutcomeStatus.REGRESSION, OutcomeStatus.FIXED] or c.is_silent_failure]
        for c in flagged[:15]:
            status_str = f"\033[91mREGRESSION\033[0m" if c.status == OutcomeStatus.REGRESSION else f"\033[92mFIXED\033[0m"
            if c.is_silent_failure and c.status == OutcomeStatus.REGRESSION:
                status_str += " \033[95m[SILENT]\033[0m"
            print(f"  {c.case_id:<8} {c.category[:26]:<28} {c.expected_decision:<12} {c.v_baseline_decision:<10} {c.v_current_decision:<12} {status_str}")


if __name__ == "__main__":
    run_cli()
