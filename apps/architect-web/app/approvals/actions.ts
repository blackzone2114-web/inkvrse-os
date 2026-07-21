"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function decideApproval(formData: FormData) {
  const approvalId = String(formData.get("approvalId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!approvalId || (decision !== "approved" && decision !== "rejected")) return;

  const supabase = await createClient();
  if (!supabase) return;

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return;

  await supabase
    .from("approval_requests")
    .update({
      status: decision,
      decided_by: user.id,
      decided_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", approvalId)
    .eq("status", "pending");

  revalidatePath("/");
  revalidatePath("/approvals");
}
