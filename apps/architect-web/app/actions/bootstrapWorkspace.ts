"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const canon = [
  ["assistant", "display_name", "LiNK"],
  ["assistant", "activation_greeting", "Time-aware greeting ending in sir"],
  ["assistant", "visual_identity", "Canonical black-and-gold LiNK emblem only"],
  ["assistant", "voice_modulator", "Three centre-out gold LED bars driven by actual outgoing voice audio"],
] as const;

export async function bootstrapWorkspace() {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase is not configured" };

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return { ok: false, error: "Authentication required" };

  const { data: existing } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  let workspaceId = existing?.id;

  if (!workspaceId) {
    const { data: workspace, error } = await supabase
      .from("workspaces")
      .insert({ owner_id: user.id, name: "Architect OS", timezone: "Australia/Melbourne" })
      .select("id")
      .single();

    if (error || !workspace) return { ok: false, error: error?.message ?? "Workspace creation failed" };
    workspaceId = workspace.id;

    await supabase.from("workspace_members").insert({
      workspace_id: workspaceId,
      user_id: user.id,
      role: "owner",
    });
  }

  for (const [subject, predicate, objectText] of canon) {
    await supabase.from("memories").upsert(
      {
        workspace_id: workspaceId,
        subject,
        predicate,
        object_text: objectText,
        authority: "canon",
        status: "active",
        confidence: 1,
        source_type: "architect_bootstrap",
        source_ref: "PRESENCE-MEMORY-CANON.md",
        created_by: user.id,
      },
      { onConflict: "workspace_id,subject,predicate", ignoreDuplicates: true },
    );
  }

  await supabase.from("operational_events").insert({
    workspace_id: workspaceId,
    event_type: "system.bootstrap",
    title: "Presence Memory initialised",
    summary: "Architect OS workspace and core LiNK canon are active.",
    severity: "info",
    source_tool: "Architect OS",
  });

  revalidatePath("/");
  return { ok: true, workspaceId };
}
