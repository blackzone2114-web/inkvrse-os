import { createClient } from "@/lib/supabase/server";

export interface CommandSnapshot {
  mode: "live" | "preview";
  workspaceName: string;
  userEmail?: string;
  blockedProjects: Array<{ id: string; name: string; blockedReason: string | null; nextAction: string | null }>;
  approvals: Array<{ id: string; title: string; summary: string | null; severity: string; occurredAt: string }>;
  recentEvents: Array<{ id: string; title: string; summary: string | null; severity: string; occurredAt: string }>;
  canonCount: number;
}

const previewSnapshot: CommandSnapshot = {
  mode: "preview",
  workspaceName: "Architect OS",
  blockedProjects: [],
  approvals: [
    {
      id: "preview-approval",
      title: "Connect Supabase to activate Presence Memory",
      summary: "The Command screen is running safely in preview mode until environment keys and authentication are connected.",
      severity: "attention",
      occurredAt: new Date().toISOString(),
    },
  ],
  recentEvents: [
    {
      id: "preview-event",
      title: "LiNK foundation branch active",
      summary: "Voice presence, canon rules, database migrations and permission boundaries are scaffolded.",
      severity: "info",
      occurredAt: new Date().toISOString(),
    },
  ],
  canonCount: 4,
};

export async function getCommandSnapshot(): Promise<CommandSnapshot> {
  const supabase = await createClient();
  if (!supabase) return previewSnapshot;

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return previewSnapshot;

  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id,name")
    .order("created_at", { ascending: true })
    .limit(1);

  const workspace = workspaces?.[0];
  if (!workspace) {
    return { ...previewSnapshot, mode: "live", userEmail: user.email, workspaceName: "No workspace yet" };
  }

  const [projectsResult, approvalsResult, eventsResult, canonResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id,name,blocked_reason,next_action")
      .eq("workspace_id", workspace.id)
      .not("blocked_reason", "is", null)
      .order("priority", { ascending: false })
      .limit(6),
    supabase
      .from("operational_events")
      .select("id,title,summary,severity,occurred_at")
      .eq("workspace_id", workspace.id)
      .eq("requires_approval", true)
      .is("resolved_at", null)
      .order("occurred_at", { ascending: false })
      .limit(6),
    supabase
      .from("operational_events")
      .select("id,title,summary,severity,occurred_at")
      .eq("workspace_id", workspace.id)
      .order("occurred_at", { ascending: false })
      .limit(8),
    supabase
      .from("current_memory")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id)
      .eq("authority", "canon"),
  ]);

  return {
    mode: "live",
    workspaceName: workspace.name,
    userEmail: user.email,
    blockedProjects: (projectsResult.data ?? []).map((project) => ({
      id: project.id,
      name: project.name,
      blockedReason: project.blocked_reason,
      nextAction: project.next_action,
    })),
    approvals: (approvalsResult.data ?? []).map((event) => ({
      id: event.id,
      title: event.title,
      summary: event.summary,
      severity: event.severity,
      occurredAt: event.occurred_at,
    })),
    recentEvents: (eventsResult.data ?? []).map((event) => ({
      id: event.id,
      title: event.title,
      summary: event.summary,
      severity: event.severity,
      occurredAt: event.occurred_at,
    })),
    canonCount: canonResult.count ?? 0,
  };
}
