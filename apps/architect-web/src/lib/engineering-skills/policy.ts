export type TechnicalSourceStatus = "current" | "stale" | "unavailable" | "not_required";

export type EngineeringTaskInput = {
  consequential: boolean;
  versionSensitive: boolean;
  touchesUi: boolean;
  changesCanon: boolean;
  hasVerificationPlan: boolean;
  sourceStatus: TechnicalSourceStatus;
  permissionApproved: boolean;
};

export type EngineeringTaskDecision = {
  mayExecute: boolean;
  requiresPlan: boolean;
  requiresCurrentDocs: boolean;
  requiresDesignGuardrail: boolean;
  requiresHumanReview: boolean;
  reasons: string[];
};

export function evaluateEngineeringTask(input: EngineeringTaskInput): EngineeringTaskDecision {
  const reasons: string[] = [];
  const requiresPlan = input.consequential;
  const requiresCurrentDocs = input.versionSensitive;
  const requiresDesignGuardrail = input.touchesUi;
  const requiresHumanReview = input.changesCanon || (input.consequential && !input.permissionApproved);

  if (input.changesCanon) {
    reasons.push("Canon changes require explicit human approval.");
  }

  if (input.consequential && !input.permissionApproved) {
    reasons.push("Consequential work is blocked until the permission gate is satisfied.");
  }

  if (input.versionSensitive && input.sourceStatus !== "current") {
    reasons.push("Version-sensitive work requires current technical documentation before execution.");
  }

  if (input.consequential && !input.hasVerificationPlan) {
    reasons.push("Consequential work requires a verification plan before execution.");
  }

  const mayExecute =
    !input.changesCanon &&
    (!input.consequential || input.permissionApproved) &&
    (!input.versionSensitive || input.sourceStatus === "current") &&
    (!input.consequential || input.hasVerificationPlan);

  if (mayExecute) {
    reasons.push("Execution gates satisfied. Verify before claiming completion.");
  }

  return {
    mayExecute,
    requiresPlan,
    requiresCurrentDocs,
    requiresDesignGuardrail,
    requiresHumanReview,
    reasons,
  };
}
