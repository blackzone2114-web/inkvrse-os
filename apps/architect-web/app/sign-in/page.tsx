import { signIn } from "./actions";

interface SignInPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { error } = await searchParams;

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <p className="kicker">ARCHITECT OS · SECURE ACCESS</p>
        <h1>LiNK is standing by.</h1>
        <p>Authenticate to restore your workspace, Presence Memory, approvals and operational timeline.</p>

        <form action={signIn} className="auth-form">
          <label>
            EMAIL
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            PASSWORD
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          {error ? <p className="auth-error" role="alert">{error}</p> : null}
          <button type="submit">ENTER ARCHITECT OS</button>
        </form>

        <small>No service-role secrets are exposed to this page. Workspace access is enforced by database row-level security.</small>
      </section>
    </main>
  );
}
