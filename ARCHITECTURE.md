# PatchReplay — System Architecture & Failure Taxonomy

This document outlines the technical architecture, execution graph lifecycle, divergence detection algorithms, and classification taxonomy underlying **PatchReplay**.

---

## 1. Core Abstractions

### 1.1 `TestCase`
A standardized container representing an operational incident or standard transaction:
- **`id`**: Unique case identifier (e.g. `C-103`, `C-182`).
- **`customer`**: KYC status, account tenure, historical trust score (0-100), geolocation.
- **`transaction`**: Amount, merchant, channel (POS, Card Not Present, API), transaction type.
- **`evidence`**: Customer receipt presence, merchant response status, counter-evidence existence.
- **`risk_score`**: Calculated operational anomaly score (0-100).
- **`expected_decision`**: Ground truth compliance action (`RESOLVE`, `ESCALATE`, `REJECT`).
- **`expected_reasoning`**: Ground truth regulatory rationale.

### 1.2 `NodeTrace` & `WorkflowGraph`
An agentic execution is modeled as a deterministic directed pipeline of discrete nodes:
1. `CollectInfoNode`: Ingestion, schema normalization, and metadata tagging.
2. `CustomerVerifyNode`: Identity verification, KYC audit, and trust score thresholding.
3. `RiskAssessmentNode`: Anomaly evaluation, geolocation cross-referencing, and fraud tagging.
4. `MerchantEvidenceNode`: SLA response audit and merchant counter-evidence verification.
5. `PolicyEvaluationNode`: Final operational decision synthesis and rule evaluation.

Each node produces an atomic trace:
```json
{
  "step_index": 5,
  "node_name": "Reg Ops Policy Engine",
  "node_id": "policy_evaluation",
  "input_state": { "kyc_passed": true, "risk_high": true, "merchant_evidence_present": false },
  "output_state": { "decision": "ESCALATE" },
  "reasoning": "Policy Guardrail 4.2: High risk score mandates human compliance escalation.",
  "decision_impact": "DECISION_ESCALATE",
  "duration_ms": 14.8,
  "status": "COMPLETED"
}
```

---

## 2. Divergence Detection Algorithm

To identify the earliest point of deviation between two workflow versions $A$ and $B$:

$$\text{Divergence}(T_A, T_B) = \min \left\{ i \;\middle|\; \text{Impact}(T_{A, i}) \neq \text{Impact}(T_{B, i}) \lor \Delta \text{State}(T_{A, i}, T_{B, i}) \neq \emptyset \right\}$$

1. **Step-by-Step Traversal**: The comparator iterates sequentially through node indices $i = 1 \dots N$.
2. **Impact Comparison**: Compares `decision_impact` flags (e.g. `RISK_HIGH` vs `RISK_LOW`, `DECISION_ESCALATE` vs `DECISION_RESOLVE`).
3. **State Delta**: Compares state flags and intermediate decisions.
4. **Pinpointing**: The first step index where equality fails is marked as the `divergence_step`, logging the exact explanatory diff.

---

## 3. Failure Classification Taxonomy

PatchReplay establishes a strict 5-tier classification taxonomy for AI workflow modifications:

```
                                 [ Replay Case Result ]
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    │                                               │
             V2 == Expected                                  V2 != Expected
                    │                                               │
          ┌─────────┴─────────┐                           ┌─────────┴─────────┐
          │                   │                           │                   │
    V1 != Expected      V1 == Expected              V1 == Expected      V1 != Expected
          │                   │                           │                   │
       [ FIXED ]          [ STABLE ]               [ REGRESSION ]     [ STILL FAILING ]
                                                          │
                                                    Is 200 OK +
                                                  Wrong Decision?
                                                          │
                                                [ SILENT FAILURE ] ⚠️
```

### Classification Definitions:
1. **FIXED**: Case failed in Baseline ($V_1$), but succeeded in Target ($V_2$).
2. **STABLE**: Case succeeded in both $V_1$ and $V_2$.
3. **REGRESSION**: Case succeeded in $V_1$, but failed in $V_2$ due to unintended side effects of the code change.
4. **STILL FAILING**: Case failed in both $V_1$ and $V_2$ (the attempted fix did not resolve this edge case).
5. **CRITICAL SILENT FAILURE**: A specific high-severity subtype of failure where the agent workflow reports successful execution (`200 OK`, no exceptions, no timeout), but commits an incorrect or unlawful operational action (e.g. refunding an unverified $2,500 dispute without merchant counter-evidence).
