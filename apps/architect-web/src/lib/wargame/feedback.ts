import type { SupabaseClient } from "@supabase/supabase-js";

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
const fingerprint = (kind: string, value: string) => `wargame:${kind}:${value.trim().toLowerCase().replace(/\s+/g, "-")}`;

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

export async function persistWargameFeedback(args: {
  supabase: SupabaseClient;
  workspaceId: string;
  runId: string;
  feedback: WargameFeedback;
}) {
  for (const statement of args.feedback.lessons) {
    const key = fingerprint("lesson", statement);
    const { data: existing } = await args.supabase
      .from("lessons")
      .select("id,occurrence_count,confidence,evidence")
      .eq("workspace_id", args.workspaceId)
      .eq("fingerprint", key)
      .maybeSingle();

    const evidence = [...((existing?.evidence as string[] | null) ?? []), `wargame:${args.runId}`];
    if (existing) {
      const { error } = await args.supabase.from("lessons").update({
        occurrence_count: existing.occurrence_count + 1,
        confidence: Math.min(1, Number(existing.confidence ?? 0.5) + 0.05),
        evidence,
        last_observed_at: new Date().toISOString(),
      }).eq("id", existing.id);
      if (error) throw new Error(`Failed to update wargame lesson: ${error.message}`);
    } else {
      const { error } = await args.supabase.from("lessons").insert({
        workspace_id: args.workspaceId,
        kind: "process_improvement",
        fingerprint: key,
        statement,
        evidence,
        confidence: Math.max(0.5, args.feedback.predictionAccuracy),
      });
      if (error) throw new Error(`Failed to persist wargame lesson: ${error.message}`);
    }
  }

  for (const correction of args.feedback.worldModelCorrections) {
    const statement = correction.kind === "missing_dependency"
      ? `World Model missed dependency: ${correction.value}`
      : `Wargame assumption proved false: ${correction.value}`;
    const key = fingerprint(correction.kind, correction.value);

    const { data: existing } = await args.supabase
      .from("lessons")
      .select("id,occurrence_count,confidence,evidence")
      .eq("workspace_id", args.workspaceId)
      .eq("fingerprint", key)
      .maybeSingle();

    const evidence = [...((existing?.evidence as string[] | null) ?? []), `wargame:${args.runId}`];
    if (existing) {
      const { error } = await args.supabase.from("lessons").update({
        occurrence_count: existing.occurrence_count + 1,
        confidence: Math.min(1, Number(existing.confidence ?? 0.5) + 0.08),
        evidence,
        last_observed_at: new Date().toISOString(),
      }).eq("id", existing.id);
      if (error) throw new Error(`Failed to update World Model correction lesson: ${error.message}`);
    } else {
      const { error } = await args.supabase.from("lessons").insert({
        workspace_id: args.workspaceId,
        kind: correction.kind === "missing_dependency" ? "process_improvement" : "failure_pattern",
        fingerprint: key,
        statement,
        evidence,
        confidence: 0.8,
      });
      if (error) throw new Error(`Failed to persist World Model correction lesson: ${error.message}`);
    }
  }
}
