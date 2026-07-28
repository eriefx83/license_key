import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PortalShell } from "@/app/_components/portal-shell";
import { updateUser } from "@/app/admin/users/actions";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

type EditUserPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

type EditableUser = {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
};

const errorMessages: Record<string, string> = {
  email: "That email address is already used by another account.",
  invalid: "Check the form and enter valid user details.",
  password: "A new password must contain at least 8 characters.",
  self: "You cannot remove your own admin access or disable your own account.",
};

export default async function EditUserPage({
  params,
  searchParams,
}: EditUserPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin") {
    redirect("/dashboard");
  }

  const { id: rawId } = await params;
  const { error, success } = await searchParams;
  const id = Number(rawId);

  if (!Number.isInteger(id) || id < 1) {
    notFound();
  }

  const sql = getDb();
  const rows = (await sql`
    SELECT id, email, name, role, status
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `) as EditableUser[];
  const user = rows[0];

  if (!user) {
    notFound();
  }

  return (
    <PortalShell activePage="users" title="Edit user" user={session}>
      <div className="edit-user-content">
        <div className="edit-page-heading">
          <div>
            <Link className="back-link" href="/admin/users">
              ← Back to users
            </Link>
            <h2>Edit {user.name}</h2>
            <p>Update account details, access level and login password.</p>
          </div>
          <span className="user-id edit-user-id">#{user.id}</span>
        </div>

        {error && errorMessages[error] && (
          <div className="form-alert form-alert-error" role="alert">
            {errorMessages[error]}
          </div>
        )}

        {success === "1" && (
          <div className="form-alert form-alert-success" role="status">
            User details updated successfully.
          </div>
        )}

        <form className="edit-user-form" action={updateUser}>
          <input name="id" type="hidden" value={user.id} />

          <div className="form-grid">
            <label className="form-field">
              <span>Name</span>
              <input
                defaultValue={user.name}
                minLength={2}
                name="name"
                required
                type="text"
              />
            </label>

            <label className="form-field">
              <span>Email address</span>
              <input
                autoComplete="email"
                defaultValue={user.email}
                name="email"
                required
                type="email"
              />
            </label>

            <label className="form-field">
              <span>Role</span>
              <select defaultValue={user.role} name="role" required>
                <option value="admin">Admin</option>
                <option value="partner">Partner</option>
                <option value="agent">Agent</option>
                <option value="customer">Customer</option>
                <option value="support">Support</option>
              </select>
            </label>

            <label className="form-field">
              <span>Status</span>
              <select defaultValue={user.status} name="status" required>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>

            <label className="form-field form-field-full">
              <span>New password</span>
              <input
                autoComplete="new-password"
                minLength={8}
                name="password"
                placeholder="Leave blank to keep the current password"
                type="password"
              />
              <small>Only enter a value when you want to reset the password.</small>
            </label>
          </div>

          <div className="form-actions">
            <Link className="secondary-link" href="/admin/users">
              Cancel
            </Link>
            <button className="save-button" type="submit">
              Save changes
            </button>
          </div>
        </form>
      </div>
    </PortalShell>
  );
}
