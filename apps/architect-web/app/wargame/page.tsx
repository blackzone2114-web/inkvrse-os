import Link from "next/link";
import { runWargame } from "@/src/lib/wargame/engine";

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

export default function WargamePage() {
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
        <div><small>HUMAN REVIEW</small><strong>{demo.reviewRequired ? "REQUIRED" : "NOT REQUIRED"}</strong></div>
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
        <div><p className="kicker">DECISION GATE</p><h2>{demo.recommendation.rationale[0]}</h2><p>LiNK will not execute from this screen until persistence, identity, and approval actions are connected to the live Supabase workspace.</p></div>
        <div className="decision-actions"><button disabled>APPROVE</button><button disabled>REJECT</button><button disabled>RUN AGAIN</button></div>
      </section>
    </main>
  );
}
