export type WargameFeedback = {
  predictionAccuracy: number;
  confidenceDelta: number;
  lessons: string[];
  worldModelCorrections: Array<{
    kind: "missing_dependency" | "false_assumption";
    value: string;
  }>;
};

const clamp = (value: number, min = -0.2, max = 0.2) => Math.min(max, Math.max(min, value));

export function deriveWargameFeedback(args: {
  predictionAccuracy: number;
  missedDependencies: string[];
  falseAssumptions: string[];
  rollbackUsed: boolean;
  rollbackSuccessful?: boolean | null;
}): WargameFeedback {
  const accuracy = Math.min(1, Math.max(0, args.predictionAccuracy));
  let confidenceDelta = clamp((accuracy - 0.5) * 0.2);

  const lessons: string[] = [];

  if (args.missedDependencies.length > 0) {
    confidenceDelta -= Math.min(0.12, args.missedDependencies.length * 0.03);
    lessons.push("Expand the World Model before repeating this decision class; dependencies were missed.");
  }

  if (args.falseAssumptions.length > 0) {
    confidenceDelta -= Math.min(0.12, args.falseAssumptions.length * 0.03);
    lessons.push("Do not reuse falsified assumptions without fresh evidence.");
  }

  if (args.rollbackUsed) {
    lessons.push(
      args.rollbackSuccessful
        ? "Rollback controls worked as intended; preserve this recovery path."
        : "Rollback did not behave as expected; treat this workflow as higher risk until recovery is repaired.",
    );

    if (args.rollbackSuccessful === false) confidenceDelta -= 0.1;
  }

  if (accuracy >= 0.85 && args.missedDependencies.length === 0 && args.falseAssumptions.length === 0) {
    lessons.push("Scenario model tracked reality closely; retain these dependency and risk weights as a strong prior.");
  }

  return {
    predictionAccuracy: accuracy,
    confidenceDelta: clamp(confidenceDelta),
    lessons,
    worldModelCorrections: [
      ...args.missedDependencies.map((value) => ({ kind: "missing_dependency" as const, value })),
      ...args.falseAssumptions.map((value) => ({ kind: "false_assumption" as const, value })),
    ],
  };
}
