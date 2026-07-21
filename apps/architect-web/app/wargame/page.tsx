import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { runWargame } from "@/src/lib/wargame/engine";
import { decideWargame, saveWargameRun } from "./actions";

const demo = runWargame({
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

async function getLatestRun() {
  const supabase = await createClient();
  if (!supabase) return { mode: "preview" as const, run: null };

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { mode: "preview" as const, run: null };

  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1);

  const workspace = workspaces?.[0];
  if (!workspace) return { mode: "live" as const, run: null };

  const { data } = await supabase
    .from("wargame_runs")
    .select("id,chosen_action,created_at,recommendation_action,recommendation_confidence")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { mode: "live" as const, run: data ?? null };
}

export default async function WargamePage() {
  const latest = await getLatestRun();
  const persisted = latest.run;
  const canDecide = latest.mode === "live" && persisted && !persisted.chosen_action;

  return (
    <main className="wargame-shell">
      <header className="wargame-header">
        <div><p className="kicker">LiNK DECISION INTELLIGENCE</p><h1>WARGAME</h1></div>
        <Link href="/" className="wargame-back">RETURN TO COMMAND</Link>
      </header>

      <section className="wargame-summary">
        <div><small>OBJECTIVE</small><strong>{demo.input.objective}</strong></div>
        <div><small>RECOMMENDATION</small><strong>{demo.recommendation.action.replaceAll("_", " ").toUpperCase()}</strong></div>
        <div><small>CONFIDENCE</small><strong>{Math.round(demo.recommendation.confidence * 100)}%</strong></div>
        <div><small>STATUS</small><strong>{latest.mode === "live" ? (persisted?.chosen_action ? `DECIDED · ${persisted.chosen_action.toUpperCase()}` : persisted ? "AWAITING DECISION" : "UNSAVED") : "SAFE PREVIEW"}</strong></div>
      </section>

      <section className="scenario-grid" aria-label="Wargame scenarios">
        {demo.scenarios.map((scenario) => (
          <article key={scenario.id}>
            <div className="scenario-top"><small>{scenario.kind.toUpperCase()}</small><span>{Math.round(scenario.probability * 100)}%</span></div>
            <h2>{scenario.title}</h2>
            <p>{scenario.narrative}</p>
            <dl>
              <div><dt>IMPACT</dt><dd>{Math.round(scenario.impact * 100)}%</dd></div>
              <div><dt>REVERSIBILITY</dt><dd>{Math.round(scenario.reversibility * 100)}%</dd></div>
              <div><dt>AFFECTED NODES</dt><dd>{scenario.affectedNodeIds.length}</dd></div>
            </dl>
          </article>
        ))}
      </section>

      <section className="decision-panel">
        <div>
          <p className="kicker">DECISION GATE</p>
          <h2>{demo.recommendation.rationale[0]}</h2>
          <p>{latest.mode === "preview" ? "Connect Supabase and authenticate to persist this wargame and unlock the decision gate." : persisted ? "This run is persisted. Decisions are written with the authenticated user identity and remain auditable." : "Save the current simulation before making a decision."}</p>
        </div>
        <div className="decision-actions">
          {!persisted && latest.mode === "live" ? (
            <form action={saveWargameRun}><button type="submit">SAVE RUN</button></form>
          ) : null}
          {canDecide ? (
            <>
              <form action={decideWargame}><input type="hidden" name="runId" value={persisted.id} /><input type="hidden" name="chosenAction" value="approve" /><button type="submit">APPROVE</button></form>
              <form action={decideWargame}><input type="hidden" name="runId" value={persisted.id} /><input type="hidden" name="chosenAction" value="reject" /><button type="submit">REJECT</button></form>
            </>
          ) : null}
          <button disabled>RUN AGAIN</button>
        </div>
      </section>
    </main>
  );
}
