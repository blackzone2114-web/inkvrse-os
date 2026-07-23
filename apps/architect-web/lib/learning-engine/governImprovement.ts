import type { ImprovementCandidate, PromotionDecision } from "./types";

const MIN_EVIDENCE = 3;
const MIN_CONFIDENCE = 0.85;

export function assessPromotion(candidate: ImprovementCandidate): PromotionDecision {
  if (candidate.evidenceCount < MIN_EVIDENCE) {
    return {
      eligible: false,
      reason: `Needs at least ${MIN_EVIDENCE} independent observations; currently ${candidate.evidenceCount}.`,
      requiresHumanApproval: true,
    };
  }

  if (candidate.confidence < MIN_CONFIDENCE) {
    return {
      eligible: false,
      reason: `Confidence must reach ${MIN_CONFIDENCE}; currently ${candidate.confidence.toFixed(2)}.`,
      requiresHumanApproval: true,
    };
  }

  return {
    eligible: true,
    reason: "Evidence threshold reached. Eligible for a reversible experiment, not silent permanent adoption.",
    requiresHumanApproval: true,
  };
}

export const learningGuardrails = {
  canonMayNeverBeChangedAutomatically: true,
  preferredWorkflowsRequireApproval: true,
  experimentsMustHaveRollbackSnapshot: true,
  failuresRemainHistoricalEvidence: true,
  userPreferencesAreContextualNotUniversal: true,
} as const;
