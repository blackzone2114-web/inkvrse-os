export type WargameScenarioKind = "best" | "base" | "worst" | "contrarian";

export type WargameScenario = {
  id: string;
  kind: WargameScenarioKind;
  title: string;
  narrative: string;
  probability: number;
  impact: number;
  reversibility: number;
  assumptions: string[];
  affectedNodeIds: string[];
  leadingIndicators: string[];
  mitigations: string[];
};

export type WargameInput = {
  objective: string;
  decision: string;
  constraints: string[];
  assumptions: string[];
  affectedNodeIds: string[];
  rollbackAvailable: boolean;
  financialImpact: number;
  privacyImpact: number;
  authImpact: number;
  operationalImpact: number;
  confidence: number;
};

export type WargameRecommendation = {
  action: "proceed" | "proceed_with_controls" | "experiment" | "defer" | "reject";
  confidence: number;
  rationale: string[];
  requiredControls: string[];
  stopConditions: string[];
};

export type WargameResult = {
  input: WargameInput;
  scenarios: WargameScenario[];
  recommendation: WargameRecommendation;
  reviewRequired: boolean;
};
