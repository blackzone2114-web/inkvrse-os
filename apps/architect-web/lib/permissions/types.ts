export type PermissionLevel = 0 | 1 | 2 | 3;

export type ApprovalDecision = "approve" | "reject";

export type GovernedAction = {
  toolName: string;
  action: string;
  summary: string;
  permissionLevel: PermissionLevel;
  riskLevel: number;
  reversible: boolean;
  affectsAuth?: boolean;
  affectsPrivacy?: boolean;
  affectsPayments?: boolean;
  destructive?: boolean;
  productionImpact?: boolean;
};

export type PermissionVerdict = {
  mode: "allow" | "approval_required" | "wargame_required" | "deny";
  reason: string;
  requiredRole?: "owner" | "admin";
  receiptRequired: boolean;
};
