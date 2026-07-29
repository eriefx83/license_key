import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PortalShell } from "@/app/_components/portal-shell";
import { EditUserForm } from "@/app/admin/users/[id]/edit/edit-user-form";
import type { ProductAccessOption } from "@/app/admin/users/product-access-selector";
import { getSession } from "@/lib/auth";
import { ensureUserProductAccessTable, getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

type EditUserPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

type EditableUser = {
  agent_limit: number;
  agent_type: string;
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
};

const errorMessages: Record<string, string> = {
  agent_limit: "Enter a valid agent limit of at least 1.",
  email: "That email address is already used by another account.",
  invalid: "Check the form and enter valid user details.",
  password: "A new password must contain at least 8 characters.",
  product_access: "One or more selected products are no longer available.",
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
    redirect("/admin/licenses/generate");
  }

  await ensureUserProductAccessTable();

  const { id: rawId } = await params;
  const { error, success } = await searchParams;
  const id = Number(rawId);

  if (!Number.isInteger(id) || id < 1) {
    notFound();
  }

  const sql = getDb();
  const [userRows, productRows, accessRows] = await Promise.all([
    sql`
      SELECT id, email, name, role, status, agent_type, agent_limit
      FROM users
      WHERE id = ${id}
      LIMIT 1
    `,
    sql`
      SELECT id, name, status
      FROM products
      ORDER BY name ASC, id ASC
    `,
    sql`
      SELECT product_id
      FROM user_product_access
      WHERE user_id = ${id}
      ORDER BY product_id ASC
    `,
  ]);
  const user = (userRows as EditableUser[])[0];
  const products = productRows as ProductAccessOption[];
  const selectedProductIds = (
    accessRows as { product_id: number | string }[]
  ).map((row) => Number(row.product_id));

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

        <EditUserForm
          products={products}
          selectedProductIds={selectedProductIds}
          user={user}
        />
      </div>
    </PortalShell>
  );
}
