export type TaskOutcome = "succeeded" | "partial" | "failed" | "cancelled";
export type LessonKind =
  | "success_pattern"
  | "failure_pattern"
  | "bottleneck"
  | "tool_issue"
  | "user_preference"
  | "process_improvement";
export type ImprovementStatus = "candidate" | "experiment" | "preferred" | "rejected" | "rolled_back";

export interface TaskTelemetry {
  taskRunId: string;
  title: string;
  intent: string;
  outcome: TaskOutcome;
  durationMs: number;
  retryCount: number;
  frictionScore: number;
  toolsUsed: string[];
  observedProblems: string[];
  successfulMoves: string[];
}

export interface TaskReviewDraft {
  goalAchieved: boolean;
  verificationMethod: string;
  whatWorked: string[];
  whatFailed: string[];
  bottlenecks: string[];
  betterNextTime: string[];
  confidence: number;
}

export interface LessonCandidate {
  kind: LessonKind;
  fingerprint: string;
  statement: string;
  confidence: number;
  evidence: Record<string, unknown>[];
}

export interface ImprovementCandidate {
  name: string;
  problem: string;
  proposedChange: string;
  confidence: number;
  evidenceCount: number;
  expectedBenefit: {
    timeSavedPercent?: number;
    retryReductionPercent?: number;
    frictionReduction?: number;
  };
}

export interface PromotionDecision {
  eligible: boolean;
  reason: string;
  requiresHumanApproval: boolean;
}
