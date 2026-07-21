import type { RuntimeReuseAssessment, RuntimeReuseSignals } from "./types";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function assessRuntimeReuse(signals: RuntimeReuseSignals): RuntimeReuseAssessment {
  const reasons: string[] = [];

  if (signals.canonConflict) {
    return {
      decision: "fresh_reasoning",
      confidence: 1,
      score: 0,
      reasons: ["Canon conflict invalidates workflow reuse."],
      requiresFreshPermissionCheck: true,
      requiresExternalStateRefresh: true,
    };
  }

  if (signals.highImpact && !signals.reversible) {
    return {
      decision: "wargame",
      confidence: 0.95,
      score: 0,
      reasons: ["High-impact, low-reversibility work requires Wargame before reuse."],
      requiresFreshPermissionCheck: true,
      requiresExternalStateRefresh: true,
    };
  }

  let score =
    clamp01(signals.similarity) * 0.28 +
    clamp01(signals.successRate) * 0.24 +
    clamp01(signals.predictionAccuracy) * 0.16 +
    Math.min(signals.evidenceCount / 8, 1) * 0.12 +
    (signals.dependenciesStable ? 0.1 : 0) +
    (signals.permissionsStable ? 0.1 : 0);

  if (signals.externalStateVolatile) {
    score -= 0.12;
    reasons.push("External state is volatile and must be refreshed.");
  }

  if (signals.unresolvedAssumptions > 0) {
    score -= Math.min(signals.unresolvedAssumptions * 0.04, 0.16);
    reasons.push("Unresolved assumptions reduce reuse confidence.");
  }

  if (signals.priorRollback) {
    score -= 0.15;
    reasons.push("A prior rollback weakens the reuse candidate.");
  }

  if (!signals.dependenciesStable) {
    score -= 0.15;
    reasons.push("Dependency graph changed or is insufficiently stable.");
  }

  if (!signals.permissionsStable) {
    score -= 0.12;
    reasons.push("Permissions require a fresh check.");
  }

  if (signals.ageHours > 168) {
    score -= 0.12;
    reasons.push("Workflow evidence is older than seven days.");
  } else if (signals.ageHours > 24) {
    score -= 0.05;
    reasons.push("Workflow evidence is older than one day.");
  }

  score = clamp01(score);

  const requiresFreshPermissionCheck = !signals.permissionsStable || signals.highImpact;
  const requiresExternalStateRefresh = signals.externalStateVolatile || signals.ageHours > 24;

  if (score >= 0.82 && !requiresFreshPermissionCheck && !requiresExternalStateRefresh) {
    reasons.push("Evidence supports direct workflow reuse.");
    return {
      decision: "reuse",
      confidence: score,
      score,
      reasons,
      requiresFreshPermissionCheck,
      requiresExternalStateRefresh,
    };
  }

  if (score >= 0.68 && signals.reversible) {
    reasons.push("Workflow structure may be reused after refreshing volatile state and permissions.");
    return {
      decision: "reuse_with_refresh",
      confidence: score,
      score,
      reasons,
      requiresFreshPermissionCheck,
      requiresExternalStateRefresh: true,
    };
  }

  reasons.push("Evidence is insufficient for safe reuse; reason from current state.");
  return {
    decision: "fresh_reasoning",
    confidence: 1 - score,
    score,
    reasons,
    requiresFreshPermissionCheck: true,
    requiresExternalStateRefresh: true,
  };
}
