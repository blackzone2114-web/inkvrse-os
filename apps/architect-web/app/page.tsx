import Link from "next/link";
import { LinkPresence } from "@/components/link-presence/LinkPresence";
import { getCommandSnapshot } from "@/lib/command/getCommandSnapshot";
import { bootstrapWorkspace } from "./actions/bootstrapWorkspace";

const modules = [
  { label: "COMMAND" },
  { label: "APPROVALS", href: "/approvals" },
  { label: "PROJECTS" },
  { label: "MEMORY" },
  { label: "CONSTRUCT" },
  { label: "WARGAME", href: "/wargame" },
  { label: "ARMORY" },
  { label: "VAULT" },
  { label: "TIMELINE" },
];

function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning, sir.";
  if (hour < 18) return "Good afternoon, sir.";
  return "Good evening, sir.";
}

export default async function Home() {
  const snapshot = await getCommandSnapshot();
  const topApproval = snapshot.approvals[0];
  const topBlocked = snapshot.blockedProjects[0];
  const recentEvent = snapshot.recentEvents[0];
  const needsBootstrap = snapshot.mode === "live" && snapshot.workspaceName === "No workspace yet";

  return (
    <main className="os-shell">
      <aside className="rail">
        <div className="rail-brand">ARCHITECT<span>OS</span></div>
        <nav>
          {modules.map((module, index) => module.href ? (
            <Link className="rail-link" href={module.href} key={module.label}>{module.label}</Link>
          ) : (
            <button className={index === 0 ? "active" : ""} key={module.label}>{module.label}</button>
          ))}
        </nav>
        <div className="rail-foot">LiNK CORE v0.4</div>
      </aside>

      <section className="command-stage">
        <header className="topbar">
          <div><small>{snapshot.workspaceName}</small><strong>COMMAND</strong></div>
          <div className="system-state"><span /> {snapshot.mode === "live" ? "PRESENCE MEMORY LIVE" : "SAFE PREVIEW"}</div>
        </header>

        <div className="hero-zone">
          <div className="hero-copy">
            <p className="kicker">COORDINATING INTELLIGENCE</p>
            <h1>{greeting()}</h1>
            <p>LiNK is online with persistent project context, canon precedence, operational events and permission-gated tool receipts.</p>
            {needsBootstrap ? (
              <form action={bootstrapWorkspace}>
                <button type="submit">INITIALISE ARCHITECT OS</button>
              </form>
            ) : (
              <div className="command-input"><span>ASK LiNK</span><input aria-label="Ask LiNK" placeholder="What requires my attention?" /><button>TRANSMIT</button></div>
            )}
          </div>
          <LinkPresence />
        </div>

        <section className="status-grid" aria-label="Operational briefing">
          <article><span>01</span><small>APPROVALS · {snapshot.approvals.length}</small><strong>{topApproval?.title ?? "No approvals waiting"}</strong><p>{topApproval?.summary ?? "LiNK has no unresolved approval requests."}</p></article>
          <article><span>02</span><small>BLOCKED · {snapshot.blockedProjects.length}</small><strong>{topBlocked?.name ?? "No blocked projects"}</strong><p>{topBlocked?.blockedReason ?? "The active project queue is clear."}</p></article>
          <article><span>03</span><small>MEMORY · {snapshot.canonCount} CANON</small><strong>{recentEvent?.title ?? "Presence Memory ready"}</strong><p>{recentEvent?.summary ?? "No new operational events since the last briefing."}</p></article>
        </section>
      </section>
    </main>
  );
}
