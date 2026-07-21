"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { runWargame } from "@/src/lib/wargame/engine";
import { persistWargameRun, recordWargameDecision } from "@/src/lib/wargame/persistence";

function buildDemoWargame() {
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
    confidence: 0.82,
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
    result: buildDemoWargame(),
  });

  revalidatePath("/wargame");
}

export async function decideWargame(formData: FormData) {
  const runId = String(formData.get("runId") ?? "");
  const chosenAction = String(formData.get("chosenAction") ?? "");
  const allowed = new Set(["approve", "reject"]);

  if (!runId || !allowed.has(chosenAction)) {
    throw new Error("Invalid wargame decision.");
  }

  const { supabase, user } = await requireLiveContext();
  await recordWargameDecision({
    supabase,
    runId,
    userId: user.id,
    chosenAction,
  });

  revalidatePath("/wargame");
}
