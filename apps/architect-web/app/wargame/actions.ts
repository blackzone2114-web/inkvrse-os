"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { runWargame } from "@/src/lib/wargame/engine";
import { deriveWargameFeedback, persistWargameFeedback } from "@/src/lib/wargame/feedback";
import { persistWargameRun, recordWargameDecision, recordWargameOutcome } from "@/src/lib/wargame/persistence";

function buildWargame(confidence = 0.82) {
  return runWargame({
    objective: "Ship a consequential Architect OS change safely",
    decision: "Release the proposed change after simulation and approval",
    constraints: ["Preserve canon", "Keep rollback available", "Avoid unreviewed destructive actions"],
    assumptions: ["Known dependency graph is materially complete", "Rollback path remains valid"],
    affectedNodeIds: ["architect-os", "presence-memory", "world-model", "learning-engine"],
    rollbackAvailable: true,
    financialImpact: 0.35,
    privacyImpact: 0.3,
    authImpact: 0.25,
    operationalImpact: 0.55,
    confidence,
  });
}

async function requireLiveContext() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) throw new Error("Authentication is required.");

  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1);

  const workspace = workspaces?.[0];
  if (!workspace) throw new Error("No workspace is available.");

  return { supabase, user, workspace };
}

export async function saveWargameRun() {
  const { supabase, user, workspace } = await requireLiveContext();
  await persistWargameRun({
    supabase,
    workspaceId: workspace.id,
    userId: user.id,
    result: buildWargame(),
  });
  revalidatePath("/wargame");
}

export async function rerunWargame() {
  const { supabase, user, workspace } = await requireLiveContext();
  const { data: outcomes } = await supabase
    .from("wargame_outcomes")
    .select("prediction_accuracy")
    .order("created_at", { ascending: false })
    .limit(5);

  const values = (outcomes ?? []).map((row) => Number(row.prediction_accuracy)).filter(Number.isFinite);
  const evidenceConfidence = values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0.82;

  await persistWargameRun({
    supabase,
    workspaceId: workspace.id,
    userId: user.id,
    result: buildWargame(Math.min(0.95, Math.max(0.55, evidenceConfidence))),
  });
  revalidatePath("/wargame");
}

export async function decideWargame(formData: FormData) {
  const runId = String(formData.get("runId") ?? "");
  const chosenAction = String(formData.get("chosenAction") ?? "");
  const allowed = new Set(["approve", "reject"]);
  if (!runId || !allowed.has(chosenAction)) throw new Error("Invalid wargame decision.");

  const { supabase, user } = await requireLiveContext();
  await recordWargameDecision({ supabase, runId, userId: user.id, chosenAction });
  revalidatePath("/wargame");
}

function splitList(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function recordOutcome(formData: FormData) {
  const runId = String(formData.get("runId") ?? "");
  const observedSummary = String(formData.get("observedSummary") ?? "").trim();
  const closestScenarioKey = String(formData.get("closestScenarioKey") ?? "").trim() || null;
  const successScore = Math.min(1, Math.max(0, Number(formData.get("successScore") ?? 0) / 100));
  const predictionAccuracy = Math.min(1, Math.max(0, Number(formData.get("predictionAccuracy") ?? 0) / 100));
  const rollbackUsed = formData.get("rollbackUsed") === "on";
  const rollbackSuccessfulValue = String(formData.get("rollbackSuccessful") ?? "");
  const rollbackSuccessful = rollbackUsed
    ? rollbackSuccessfulValue === "yes" ? true : rollbackSuccessfulValue === "no" ? false : null
    : null;
  const missedDependencies = splitList(formData.get("missedDependencies"));
  const falseAssumptions = splitList(formData.get("falseAssumptions"));
  const observedImpacts = splitList(formData.get("observedImpacts"));
  const predictedImpacts = splitList(formData.get("predictedImpacts"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!runId || !observedSummary) throw new Error("Outcome summary is required.");

  const { supabase, user, workspace } = await requireLiveContext();
  await recordWargameOutcome({
    supabase,
    runId,
    userId: user.id,
    observedSummary,
    closestScenarioKey,
    successScore,
    rollbackUsed,
    rollbackSuccessful,
    predictedImpacts,
    observedImpacts,
    missedDependencies,
    falseAssumptions,
    predictionAccuracy,
    notes,
  });

  const feedback = deriveWargameFeedback({
    predictionAccuracy,
    missedDependencies,
    falseAssumptions,
    rollbackUsed,
    rollbackSuccessful,
  });

  await persistWargameFeedback({
    supabase,
    workspaceId: workspace.id,
    runId,
    feedback,
  });

  revalidatePath("/wargame");
  revalidatePath("/");
}
