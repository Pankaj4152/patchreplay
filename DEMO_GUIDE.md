# PatchReplay — 20-Second Founder Demo Guide

Use this walkthrough script during interviews, demos, or Loom video recordings to showcase the core value proposition of PatchReplay in under 20 seconds.

---

## ⏱ The 20-Second Demo Script

### Step 1: Establish the Problem (0:00 - 0:05)
> *"In enterprise regulated workflows, AI agents rarely crash with exceptions. Instead, they silently make the wrong business decision. PatchReplay is a regression testing harness built to verify workflow changes across historical incident suites."*

### Step 2: Show the Baseline vs Naive Fix (0:05 - 0:12)
> *"Here, we are comparing Workflow V12 against V13. The engineer attempted to fix 12 customer tenure rejections. PatchReplay immediately reports that all 12 were FIXED—but simultaneously flags 4 new REGRESSIONS and 1 Critical Silent Failure."*

### Step 3: Inspect Divergence in Case C-182 (0:12 - 0:18)
> *(Click on the red banner for Case C-182)*  
> *"When we inspect Case C-182—a $2,500 dispute with missing merchant evidence—the side-by-side trace visualizer highlights the exact divergence node at Step 5. V12 correctly escalated to human compliance, but V13 silently auto-resolved it because a naive trust rule bypassed the missing evidence guardrail."*

### Step 4: Show the Hardened Fix (0:18 - 0:25)
> *(Click the version diff switcher to `V12 → V14`)*  
> *"Switching to Workflow V14, we see the proper guardrail implementation: all 12 cases are fixed, regressions drop to 0, silent failures drop to 0, and accuracy reaches 100%."*

---

## 🛠 Features to Highlight During Q&A
1. **Interactive Policy Sandbox:** Click **"Policy Sandbox"** in the header, toggle rules, and watch regression counts recalculate live.
2. **Incident Promotion:** Click **"Promote Trace to Test"** to simulate an intern ingesting an anomalous production trace into the regression test suite.
3. **Pure Python Backend & CLI:** Run `python backend/run_replay.py --v1 v12 --v2 v13 --inspect C-182` in terminal to show the backend CLI tool output.
