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

  const { data: existing, error: existingError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();
  if (existingError) return { ok: false, error: existingError.message };

  let workspaceId = existing?.id;

  if (!workspaceId) {
    const { data: workspace, error } = await supabase
      .from("workspaces")
      .insert({ owner_id: user.id, name: "Architect OS", timezone: "Australia/Melbourne" })
      .select("id")
      .single();

    if (error || !workspace) return { ok: false, error: error?.message ?? "Workspace creation failed" };
    workspaceId = workspace.id;
  }

  const { error: memberError } = await supabase.from("workspace_members").upsert(
    { workspace_id: workspaceId, user_id: user.id, role: "owner" },
    { onConflict: "workspace_id,user_id" },
  );
  if (memberError) return { ok: false, error: memberError.message };

  for (const [subject, predicate, objectText] of canon) {
    const { data: existingCanon, error: canonLookupError } = await supabase
      .from("memories")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("subject", subject)
      .eq("predicate", predicate)
      .eq("authority", "canon")
      .eq("status", "active")
      .maybeSingle();

    if (canonLookupError) return { ok: false, error: canonLookupError.message };
    if (!existingCanon) {
      const { error: canonInsertError } = await supabase.from("memories").insert({
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
      });
      if (canonInsertError) return { ok: false, error: canonInsertError.message };
    }
  }

  const { data: existingBootstrapEvent, error: eventLookupError } = await supabase
    .from("operational_events")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("event_type", "system.bootstrap")
    .limit(1)
    .maybeSingle();
  if (eventLookupError) return { ok: false, error: eventLookupError.message };

  if (!existingBootstrapEvent) {
    const { error: eventError } = await supabase.from("operational_events").insert({
      workspace_id: workspaceId,
      event_type: "system.bootstrap",
      title: "Presence Memory initialised",
      summary: "Architect OS workspace and core LiNK canon are active.",
      severity: "info",
      source_tool: "Architect OS",
      metadata: { owner_id: user.id, canon_entries: canon.length },
    });
    if (eventError) return { ok: false, error: eventError.message };
  }

  revalidatePath("/");
  revalidatePath("/approvals");
  revalidatePath("/wargame");
  return { ok: true, workspaceId };
}
