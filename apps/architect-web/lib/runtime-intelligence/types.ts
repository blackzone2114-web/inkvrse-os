export type RuntimeReuseDecision =
  | "reuse"
  | "reuse_with_refresh"
  | "fresh_reasoning"
  | "wargame";

export type RuntimeReuseSignals = {
  similarity: number;
  successRate: number;
  predictionAccuracy: number;
  evidenceCount: number;
  ageHours: number;
  dependenciesStable: boolean;
  permissionsStable: boolean;
  externalStateVolatile: boolean;
  reversible: boolean;
  highImpact: boolean;
  canonConflict: boolean;
  unresolvedAssumptions: number;
  priorRollback: boolean;
};

export type RuntimeReuseAssessment = {
  decision: RuntimeReuseDecision;
  confidence: number;
  score: number;
  reasons: string[];
  requiresFreshPermissionCheck: boolean;
  requiresExternalStateRefresh: boolean;
};
