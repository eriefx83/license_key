import { redirect } from "next/navigation";
import { logout } from "@/app/actions";
import { getSession } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "admin" || session.role === "partner") {
    redirect("/admin/licenses/generate");
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="access-title">
        <div className="brand-mark" aria-hidden="true">
          XN
        </div>
        <p className="eyebrow">Xeno Network</p>
        <h1 id="access-title">Portal access unavailable</h1>
        <p className="subtitle">
          Access for the {session.role} role will be added in a later phase.
        </p>
        <form action={logout} className="login-form">
          <button type="submit">Log out</button>
        </form>
      </section>
    </main>
  );
}
