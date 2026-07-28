import { redirect } from "next/navigation";
import { PortalShell } from "@/app/_components/portal-shell";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

type UserRow = {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
  last_login_at: string | Date | null;
  created_at: string | Date;
};

function formatDate(value: string | Date | null) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(value));
}

export default async function UsersPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin") {
    redirect("/dashboard");
  }

  const sql = getDb();
  const users = (await sql`
    SELECT id, email, name, role, status, last_login_at, created_at
    FROM users
    ORDER BY created_at DESC, id DESC
  `) as UserRow[];

  return (
    <PortalShell activePage="users" title="Users" user={session}>
      <div className="users-page-content">
        <div className="page-toolbar">
          <div>
            <h2>User list</h2>
            <p>
              {users.length} {users.length === 1 ? "user" : "users"} registered
            </p>
          </div>
        </div>

        <section className="users-panel" aria-label="Registered users">
          {users.length === 0 ? (
            <div className="users-empty">
              <h3>No users found</h3>
              <p>User accounts will appear here after they are registered.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="users-table">
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">User</th>
                    <th scope="col">Role</th>
                    <th scope="col">Status</th>
                    <th scope="col">Last login</th>
                    <th scope="col">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="user-id">#{user.id}</td>
                      <td>
                        <div className="user-identity">
                          <strong>{user.name}</strong>
                          <span>{user.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className="role-badge">{user.role}</span>
                      </td>
                      <td>
                        <span
                          className={`status-badge status-${user.status}`}
                        >
                          <span aria-hidden="true" />
                          {user.status}
                        </span>
                      </td>
                      <td className="date-cell">
                        {formatDate(user.last_login_at)}
                      </td>
                      <td className="date-cell">
                        {formatDate(user.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </PortalShell>
  );
}
