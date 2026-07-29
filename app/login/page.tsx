import { redirect } from "next/navigation";
import { login } from "@/app/actions";
import { getSession } from "@/lib/auth";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();

  if (session) {
    redirect(
      session.role === "admin" || session.role === "partner"
        ? "/admin/licenses/generate"
        : "/dashboard",
    );
  }

  const { error } = await searchParams;

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="brand-mark" aria-hidden="true">
          XN
        </div>
        <p className="eyebrow">Secure Admin Access</p>
        <h1 id="login-title">Xeno Network</h1>
        <p className="subtitle">
          Sign in to access the license management portal.
        </p>

        {error === "invalid" ? (
          <p className="error-message" role="alert">
            Email or password is incorrect.
          </p>
        ) : null}

        <form action={login} className="login-form">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="admin@example.com"
            required
            autoFocus
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
          />

          <label className="remember-me" htmlFor="remember_me">
            <input id="remember_me" name="remember_me" type="checkbox" />
            <span>Remember me</span>
          </label>

          <button type="submit">Sign in</button>
        </form>

        <p className="testing-note">
          Testing environment · Authorized users only
        </p>
      </section>
    </main>
  );
}
