import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { governAction } from "@/lib/permissions/governAction";
import type { GovernedAction, PermissionLevel } from "@/lib/permissions/types";

function isPermissionLevel(value: unknown): value is PermissionLevel {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Partial<GovernedAction> | null;
  if (!body || !body.toolName || !body.action || !body.summary || !isPermissionLevel(body.permissionLevel)) {
    return NextResponse.json({ error: "Invalid governed action request." }, { status: 400 });
  }

  const governedAction: GovernedAction = {
    toolName: body.toolName,
    action: body.action,
    summary: body.summary,
    permissionLevel: body.permissionLevel,
    riskLevel: Math.max(0, Math.min(100, Number(body.riskLevel ?? 0))),
    reversible: body.reversible !== false,
    affectsAuth: Boolean(body.affectsAuth),
    affectsPrivacy: Boolean(body.affectsPrivacy),
    affectsPayments: Boolean(body.affectsPayments),
    destructive: Boolean(body.destructive),
    productionImpact: Boolean(body.productionImpact),
  };

  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1);
  const workspace = workspaces?.[0];
  if (!workspace) return NextResponse.json({ error: "No workspace is available." }, { status: 409 });

  const verdict = governAction(governedAction);

  if (verdict.mode === "allow") {
    return NextResponse.json({ verdict, approvalId: null });
  }

  if (verdict.mode === "deny") {
    return NextResponse.json({ verdict, approvalId: null }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("approval_requests")
    .insert({
      workspace_id: workspace.id,
      requested_by: user.id,
      requested_via: "link",
      tool_name: governedAction.toolName,
      action: governedAction.action,
      summary: governedAction.summary,
      permission_level: governedAction.permissionLevel,
      risk_level: governedAction.riskLevel,
      reversible: governedAction.reversible,
      requires_wargame: verdict.mode === "wargame_required",
      payload: governedAction,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Unable to create approval request." }, { status: 500 });
  }

  return NextResponse.json({ verdict, approvalId: data.id }, { status: 202 });
}
