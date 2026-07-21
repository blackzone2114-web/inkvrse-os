import { signIn, signUp } from "./actions";

interface SignInPageProps {
  searchParams: Promise<{ error?: string; message?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { error, message } = await searchParams;

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <p className="kicker">ARCHITECT OS · SECURE ACCESS</p>
        <h1>LiNK is standing by.</h1>
        <p>Authenticate to restore your workspace, Presence Memory, approvals and operational timeline.</p>

        <form className="auth-form">
          <label>
            EMAIL
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            PASSWORD
            <input name="password" type="password" autoComplete="current-password" minLength={8} required />
          </label>
          {error ? <p className="auth-error" role="alert">{error}</p> : null}
          {message ? <p role="status">{message}</p> : null}
          <button formAction={signIn} type="submit">ENTER ARCHITECT OS</button>
          <button formAction={signUp} type="submit">CREATE OWNER ACCOUNT</button>
        </form>

        <small>No service-role secrets are exposed to this page. Workspace access is enforced by database row-level security.</small>
      </section>
    </main>
  );
}
