import type { LessonCandidate, TaskReviewDraft, TaskTelemetry } from "./types";

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const fingerprint = (kind: string, statement: string) =>
  `${kind}:${statement.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;

export function reviewTask(telemetry: TaskTelemetry): TaskReviewDraft {
  const failed = telemetry.outcome === "failed" || telemetry.outcome === "partial";
  const bottlenecks = [...telemetry.observedProblems];

  if (telemetry.retryCount > 0) bottlenecks.push(`${telemetry.retryCount} retries were required`);
  if (telemetry.frictionScore >= 60) bottlenecks.push(`High friction score: ${telemetry.frictionScore}/100`);

  const betterNextTime = bottlenecks.map((problem) => `Prevent or reduce: ${problem}`);
  if (telemetry.successfulMoves.length) {
    betterNextTime.push(`Preserve successful sequence: ${telemetry.successfulMoves.join(" → ")}`);
  }

  return {
    goalAchieved: telemetry.outcome === "succeeded",
    verificationMethod: "Outcome, retry, duration, friction and tool telemetry review",
    whatWorked: telemetry.successfulMoves,
    whatFailed: failed ? telemetry.observedProblems : [],
    bottlenecks,
    betterNextTime,
    confidence: clamp(0.55 + Math.min(0.3, telemetry.toolsUsed.length * 0.03) + (failed ? 0.1 : 0)),
  };
}

export function extractLessons(telemetry: TaskTelemetry, review: TaskReviewDraft): LessonCandidate[] {
  const lessons: LessonCandidate[] = [];

  for (const problem of review.whatFailed) {
    lessons.push({
      kind: "failure_pattern",
      fingerprint: fingerprint("failure", problem),
      statement: `Avoid repeating this failure: ${problem}`,
      confidence: review.confidence,
      evidence: [{ taskRunId: telemetry.taskRunId, outcome: telemetry.outcome }],
    });
  }

  for (const bottleneck of review.bottlenecks) {
    lessons.push({
      kind: "bottleneck",
      fingerprint: fingerprint("bottleneck", bottleneck),
      statement: `Reduce this bottleneck next time: ${bottleneck}`,
      confidence: review.confidence,
      evidence: [{ taskRunId: telemetry.taskRunId, durationMs: telemetry.durationMs }],
    });
  }

  for (const move of review.whatWorked) {
    lessons.push({
      kind: "success_pattern",
      fingerprint: fingerprint("success", move),
      statement: `Reuse this successful move when context matches: ${move}`,
      confidence: clamp(review.confidence - 0.05),
      evidence: [{ taskRunId: telemetry.taskRunId, outcome: telemetry.outcome }],
    });
  }

  return lessons;
}
