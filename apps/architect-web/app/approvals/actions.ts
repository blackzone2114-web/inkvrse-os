"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function decideApproval(formData: FormData) {
  const approvalId = String(formData.get("approvalId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!approvalId || (decision !== "approved" && decision !== "rejected")) {
    return { ok: false, error: "Invalid approval decision" };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase is not configured" };

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return { ok: false, error: "Authentication required" };

  const { data: approval, error: lookupError } = await supabase
    .from("approval_requests")
    .select("id,workspace_id,tool_name,action,summary,risk_level,status")
    .eq("id", approvalId)
    .eq("status", "pending")
    .maybeSingle();

  if (lookupError || !approval) {
    return { ok: false, error: lookupError?.message ?? "Approval is no longer pending" };
  }

  const decidedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("approval_requests")
    .update({
      status: decision,
      decided_by: user.id,
      decided_at: decidedAt,
      updated_at: decidedAt,
    })
    .eq("id", approval.id)
    .eq("workspace_id", approval.workspace_id)
    .eq("status", "pending");

  if (updateError) return { ok: false, error: updateError.message };

  await supabase.from("operational_events").insert({
    workspace_id: approval.workspace_id,
    event_type: `approval.${decision}`,
    title: `${approval.tool_name}: ${approval.action}`,
    summary: approval.summary ?? `Governed action ${decision} by the workspace owner.`,
    severity: approval.risk_level >= 80 ? "critical" : approval.risk_level >= 55 ? "warning" : "info",
    source_tool: "LiNK Governance",
    metadata: {
      approval_id: approval.id,
      decision,
      decided_by: user.id,
      decided_at: decidedAt,
    },
  });

  revalidatePath("/");
  revalidatePath("/approvals");
  return { ok: true, decision };
}
