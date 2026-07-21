import { LinkPresence } from "@/components/link-presence/LinkPresence";

const modules = ["COMMAND", "PROJECTS", "MEMORY", "CONSTRUCT", "WARGAME", "ARMORY", "VAULT", "TIMELINE"];

export default function Home() {
  return (
    <main className="os-shell">
      <aside className="rail">
        <div className="rail-brand">ARCHITECT<span>OS</span></div>
        <nav>
          {modules.map((module, index) => (
            <button className={index === 0 ? "active" : ""} key={module}>{module}</button>
          ))}
        </nav>
        <div className="rail-foot">LiNK CORE v0.1</div>
      </aside>

      <section className="command-stage">
        <header className="topbar">
          <div><small>OPERATIONAL VIEW</small><strong>COMMAND</strong></div>
          <div className="system-state"><span /> SYSTEM ONLINE</div>
        </header>

        <div className="hero-zone">
          <div className="hero-copy">
            <p className="kicker">COORDINATING INTELLIGENCE</p>
            <h1>LiNK is online.</h1>
            <p>Voice presence, canon memory, project command and permission-gated tools. Click the emblem or say “LiNK” when wake-word support is connected.</p>
            <div className="command-input"><span>ASK LiNK</span><input aria-label="Ask LiNK" placeholder="What requires my attention?" /><button>TRANSMIT</button></div>
          </div>
          <LinkPresence />
        </div>

        <section className="status-grid">
          <article><span>01</span><small>PRIORITY</small><strong>LiNK foundation build</strong><p>Voice presence and command shell are active on the feature branch.</p></article>
          <article><span>02</span><small>MEMORY</small><strong>Canon protection</strong><p>Logo, naming and activation greeting are locked as source-of-truth rules.</p></article>
          <article><span>03</span><small>ARMORY</small><strong>Connections pending</strong><p>GitHub is active. Supabase, LiveKit, Gmail and Calendar are next.</p></article>
        </section>
      </section>
    </main>
  );
}
