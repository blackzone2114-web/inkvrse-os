import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { runWargame } from "@/src/lib/wargame/engine";
import { decideWargame, recordOutcome, rerunWargame, saveWargameRun } from "./actions";

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
  if (!supabase) return { mode: "preview" as const, run: null, outcome: null };

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { mode: "preview" as const, run: null, outcome: null };

  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1);

  const workspace = workspaces?.[0];
  if (!workspace) return { mode: "live" as const, run: null, outcome: null };

  const { data } = await supabase
    .from("wargame_runs")
    .select("id,chosen_action,created_at,recommendation_action,recommendation_confidence")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return { mode: "live" as const, run: null, outcome: null };

  const { data: outcome } = await supabase
    .from("wargame_outcomes")
    .select("observed_summary,prediction_accuracy,success_score,created_at")
    .eq("wargame_run_id", data.id)
    .maybeSingle();

  return { mode: "live" as const, run: data, outcome: outcome ?? null };
}

export default async function WargamePage() {
  const latest = await getLatestRun();
  const persisted = latest.run;
  const outcome = latest.outcome;
  const canDecide = latest.mode === "live" && persisted && !persisted.chosen_action;
  const canReviewOutcome = latest.mode === "live" && persisted?.chosen_action === "approve" && !outcome;

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
        <div><small>STATUS</small><strong>{latest.mode === "live" ? (outcome ? "OUTCOME REVIEWED" : persisted?.chosen_action ? `DECIDED · ${persisted.chosen_action.toUpperCase()}` : persisted ? "AWAITING DECISION" : "UNSAVED") : "SAFE PREVIEW"}</strong></div>
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
          {!persisted && latest.mode === "live" ? <form action={saveWargameRun}><button type="submit">SAVE RUN</button></form> : null}
          {canDecide ? (
            <>
              <form action={decideWargame}><input type="hidden" name="runId" value={persisted.id} /><input type="hidden" name="chosenAction" value="approve" /><button type="submit">APPROVE</button></form>
              <form action={decideWargame}><input type="hidden" name="runId" value={persisted.id} /><input type="hidden" name="chosenAction" value="reject" /><button type="submit">REJECT</button></form>
            </>
          ) : null}
          {latest.mode === "live" ? <form action={rerunWargame}><button type="submit">RUN AGAIN</button></form> : <button disabled>RUN AGAIN</button>}
        </div>
      </section>

      {canReviewOutcome ? (
        <section className="outcome-panel">
          <div className="outcome-heading"><p className="kicker">REALITY CHECK</p><h2>What actually happened?</h2><p>LiNK will compare this result with the simulation, create lessons, and flag missed dependencies or false assumptions.</p></div>
          <form action={recordOutcome} className="outcome-form">
            <input type="hidden" name="runId" value={persisted.id} />
            <label>OUTCOME SUMMARY<textarea name="observedSummary" required placeholder="Describe the real outcome." /></label>
            <div className="outcome-row">
              <label>SUCCESS SCORE<input name="successScore" type="number" min="0" max="100" defaultValue="80" /></label>
              <label>PREDICTION ACCURACY<input name="predictionAccuracy" type="number" min="0" max="100" defaultValue="80" /></label>
              <label>CLOSEST SCENARIO<select name="closestScenarioKey" defaultValue="scenario-base"><option value="scenario-best">Best</option><option value="scenario-base">Base</option><option value="scenario-worst">Worst</option><option value="scenario-contrarian">Contrarian</option></select></label>
            </div>
            <label>PREDICTED IMPACTS<textarea name="predictedImpacts" placeholder="One per line or comma separated." /></label>
            <label>OBSERVED IMPACTS<textarea name="observedImpacts" placeholder="One per line or comma separated." /></label>
            <label>MISSED DEPENDENCIES<textarea name="missedDependencies" placeholder="Anything the World Model failed to predict." /></label>
            <label>FALSE ASSUMPTIONS<textarea name="falseAssumptions" placeholder="Any assumption that proved wrong." /></label>
            <div className="outcome-row">
              <label className="check-label"><input name="rollbackUsed" type="checkbox" /> ROLLBACK USED</label>
              <label>ROLLBACK RESULT<select name="rollbackSuccessful" defaultValue="unknown"><option value="unknown">Not applicable / unknown</option><option value="yes">Successful</option><option value="no">Failed</option></select></label>
            </div>
            <label>NOTES<textarea name="notes" placeholder="Optional additional evidence." /></label>
            <button className="outcome-submit" type="submit">CLOSE LOOP</button>
          </form>
        </section>
      ) : null}

      {outcome ? (
        <section className="outcome-panel complete">
          <div><p className="kicker">FEEDBACK LOOP CLOSED</p><h2>{outcome.observed_summary}</h2><p>Prediction accuracy: {Math.round(Number(outcome.prediction_accuracy) * 100)}% · Success score: {Math.round(Number(outcome.success_score) * 100)}%. Lessons and World Model correction candidates have been recorded.</p></div>
        </section>
      ) : null}
    </main>
  );
}
