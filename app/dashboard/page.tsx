import { redirect } from "next/navigation";
import Link from "next/link";
import { PortalShell } from "@/app/_components/portal-shell";
import { getSession } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <PortalShell activePage="dashboard" title="Dashboard" user={session}>
      <div className="dashboard-content dashboard-content-shell">
        {session.role === "admin" ? (
          <section className="admin-card" aria-labelledby="admin-users-title">
            <div className="admin-card-icon" aria-hidden="true">
              U
            </div>
            <div>
              <p className="eyebrow">Admin</p>
              <h2 id="admin-users-title">User management</h2>
              <p>View every registered user and their latest account status.</p>
            </div>
            <Link className="primary-link" href="/admin/users">
              View users
            </Link>
          </section>
        ) : (
          <section className="empty-dashboard" aria-labelledby="empty-title">
            <div className="empty-icon" aria-hidden="true">
              +
            </div>
            <h2 id="empty-title">Your dashboard is ready</h2>
            <p>
              License management features will be added here in the next phase.
            </p>
          </section>
        )}
      </div>
    </PortalShell>
  );
}
