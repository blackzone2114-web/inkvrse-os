import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { decideApproval } from "./actions";

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const { data: authData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const user = authData.user;

  let approvals: Array<{
    id: string;
    tool_name: string;
    action: string;
    summary: string;
    permission_level: number;
    risk_level: number;
    reversible: boolean;
    requires_wargame: boolean;
    created_at: string;
  }> = [];

  if (supabase && user) {
    const { data: workspaces } = await supabase.from("workspaces").select("id").order("created_at", { ascending: true }).limit(1);
    const workspace = workspaces?.[0];
    if (workspace) {
      const { data } = await supabase
        .from("approval_requests")
        .select("id,tool_name,action,summary,permission_level,risk_level,reversible,requires_wargame,created_at")
        .eq("workspace_id", workspace.id)
        .eq("status", "pending")
        .order("risk_level", { ascending: false })
        .order("created_at", { ascending: false });
      approvals = data ?? [];
    }
  }

  return (
    <main className="wargame-shell">
      <header className="wargame-header">
        <div><p className="kicker">LiNK GOVERNANCE</p><h1>APPROVALS</h1></div>
        <Link href="/" className="wargame-back">RETURN TO COMMAND</Link>
      </header>

      {!user ? (
        <section className="decision-panel"><div><h2>Authentication required</h2><p>Approval decisions are unavailable in preview mode.</p></div></section>
      ) : approvals.length === 0 ? (
        <section className="decision-panel"><div><h2>Nothing waiting</h2><p>LiNK has no governed actions awaiting your decision.</p></div></section>
      ) : (
        <section className="scenario-grid" aria-label="Pending approvals">
          {approvals.map((approval) => (
            <article key={approval.id}>
              <div className="scenario-top"><small>{approval.tool_name.toUpperCase()}</small><span>RISK {approval.risk_level}</span></div>
              <h2>{approval.action}</h2>
              <p>{approval.summary}</p>
              <dl>
                <div><dt>PERMISSION</dt><dd>LEVEL {approval.permission_level}</dd></div>
                <div><dt>REVERSIBLE</dt><dd>{approval.reversible ? "YES" : "NO"}</dd></div>
                <div><dt>WARGAME</dt><dd>{approval.requires_wargame ? "REQUIRED" : "NO"}</dd></div>
              </dl>
              <form action={decideApproval} className="decision-actions" style={{ marginTop: 20 }}>
                <input type="hidden" name="approvalId" value={approval.id} />
                <button name="decision" value="approved">APPROVE</button>
                <button name="decision" value="rejected">REJECT</button>
              </form>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
