import type { WargameInput, WargameRecommendation, WargameResult, WargameScenario } from "./types";

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function riskPressure(input: WargameInput) {
  const weighted =
    input.financialImpact * 0.25 +
    input.privacyImpact * 0.3 +
    input.authImpact * 0.25 +
    input.operationalImpact * 0.2;

  return clamp(weighted);
}

function scenario(
  input: WargameInput,
  kind: WargameScenario["kind"],
  probability: number,
  impact: number,
  reversibility: number,
  narrative: string,
): WargameScenario {
  return {
    id: `scenario-${kind}`,
    kind,
    title: `${kind[0].toUpperCase()}${kind.slice(1)} case`,
    narrative,
    probability: clamp(probability),
    impact: clamp(impact),
    reversibility: clamp(reversibility),
    assumptions: input.assumptions,
    affectedNodeIds: input.affectedNodeIds,
    leadingIndicators: [],
    mitigations: [],
  };
}

function recommend(input: WargameInput): WargameRecommendation {
  const pressure = riskPressure(input);
  const reversible = input.rollbackAvailable;

  if (pressure >= 0.78 && !reversible) {
    return {
      action: "defer",
      confidence: clamp(Math.max(input.confidence, 0.82)),
      rationale: ["Risk pressure is high and there is no credible rollback path."],
      requiredControls: ["Create and verify a rollback path before execution."],
      stopConditions: ["Any unresolved auth, privacy, payment, or destructive-data dependency remains."],
    };
  }

  if (pressure >= 0.58) {
    return {
      action: reversible ? "experiment" : "proceed_with_controls",
      confidence: clamp(input.confidence),
      rationale: ["Material downstream risk exists, so exposure should be constrained."],
      requiredControls: ["Limit blast radius.", "Capture baseline metrics.", "Define rollback trigger before execution."],
      stopConditions: ["Leading indicators breach the agreed risk threshold."],
    };
  }

  return {
    action: pressure < 0.3 ? "proceed" : "proceed_with_controls",
    confidence: clamp(input.confidence),
    rationale: ["Known risk is proportionate to the current rollback and control posture."],
    requiredControls: reversible ? ["Keep rollback available until verification completes."] : ["Add explicit verification before closing the task."],
    stopConditions: ["Observed impact materially exceeds the simulated base case."],
  };
}

export function runWargame(input: WargameInput): WargameResult {
  const pressure = riskPressure(input);
  const rollbackScore = input.rollbackAvailable ? 0.9 : 0.25;

  const scenarios: WargameScenario[] = [
    scenario(input, "best", 0.2, clamp(0.85 - pressure * 0.25), rollbackScore, "The decision achieves its objective with limited downstream friction."),
    scenario(input, "base", 0.5, clamp(0.55 + pressure * 0.15), rollbackScore, "The objective is achieved, with manageable dependencies and some corrective work."),
    scenario(input, "worst", 0.2, clamp(0.75 + pressure * 0.25), rollbackScore, "Coupled dependencies amplify the change and force rollback or containment."),
    scenario(input, "contrarian", 0.1, clamp(0.5 + pressure * 0.2), rollbackScore, "The central assumption is wrong, making the apparently safer path the weaker strategic choice."),
  ];

  return {
    input,
    scenarios,
    recommendation: recommend(input),
    reviewRequired: pressure >= 0.58 || input.confidence < 0.7 || !input.rollbackAvailable,
  };
}
