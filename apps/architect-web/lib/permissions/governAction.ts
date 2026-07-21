import type { GovernedAction, PermissionVerdict } from "./types";

export function governAction(action: GovernedAction): PermissionVerdict {
  const highConsequence = Boolean(
    action.affectsAuth ||
    action.affectsPrivacy ||
    action.affectsPayments ||
    action.destructive ||
    action.productionImpact,
  );

  if (action.permissionLevel === 0) {
    return {
      mode: "allow",
      reason: "Read-only or local presentation action.",
      receiptRequired: false,
    };
  }

  if (action.permissionLevel === 1 && action.riskLevel < 35 && !highConsequence) {
    return {
      mode: "allow",
      reason: "Low-risk reversible workspace action.",
      receiptRequired: true,
    };
  }

  if (action.permissionLevel >= 3 && !action.reversible && highConsequence) {
    return {
      mode: "wargame_required",
      reason: "High-consequence action has no credible rollback path.",
      requiredRole: "owner",
      receiptRequired: true,
    };
  }

  if (highConsequence || action.permissionLevel >= 2 || action.riskLevel >= 35) {
    return {
      mode: "approval_required",
      reason: "Action crosses the Architect OS consequential-action threshold.",
      requiredRole: action.permissionLevel >= 3 ? "owner" : "admin",
      receiptRequired: true,
    };
  }

  return {
    mode: "allow",
    reason: "Action remains within the current delegated authority envelope.",
    receiptRequired: true,
  };
}
