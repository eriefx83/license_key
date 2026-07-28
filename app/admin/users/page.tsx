import Link from "next/link";
import { redirect } from "next/navigation";
import { PortalShell } from "@/app/_components/portal-shell";
import { NewUserForm } from "@/app/admin/users/new-user-form";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

type UserRow = {
  agent_limit: number;
  agent_type: string;
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
  last_login_at: string | Date | null;
  created_at: string | Date;
};

type UsersPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  agent_limit: "Enter a valid account limit of at least 1.",
  email: "That email address is already used by another account.",
  invalid:
    "Check all fields, make sure both passwords match and use at least 8 characters.",
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

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin") {
    redirect("/dashboard");
  }

  const query = await searchParams;
  const sql = getDb();
  const users = (await sql`
    SELECT
      id,
      email,
      name,
      role,
      status,
      agent_type,
      agent_limit,
      last_login_at,
      created_at
    FROM users
    ORDER BY created_at DESC, id DESC
  `) as UserRow[];

  return (
    <PortalShell activePage="users" title="Users" user={session}>
      <div className="users-page-content">
        {query.error && errorMessages[query.error] && (
          <div className="form-alert form-alert-error" role="alert">
            {errorMessages[query.error]}
          </div>
        )}

        {query.success === "created" && (
          <div className="form-alert form-alert-success" role="status">
            New user created successfully.
          </div>
        )}

        <NewUserForm />

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
                    <th scope="col">Agent access</th>
                    <th scope="col">Status</th>
                    <th scope="col">Last login</th>
                    <th scope="col">Created</th>
                    <th scope="col">
                      <span className="visually-hidden">Actions</span>
                    </th>
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
                        {user.role === "agent" ? (
                          <div className="agent-access">
                            <strong>{user.agent_type}</strong>
                            {user.agent_type === "limited" && (
                              <span>Limit: {user.agent_limit}</span>
                            )}
                          </div>
                        ) : (
                          <span className="not-applicable">—</span>
                        )}
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
                      <td className="actions-cell">
                        <Link
                          className="edit-button"
                          href={`/admin/users/${user.id}/edit`}
                        >
                          Edit
                        </Link>
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
