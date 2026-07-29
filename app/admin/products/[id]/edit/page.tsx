import Link from "next/link";
import { redirect } from "next/navigation";
import { PortalShell } from "@/app/_components/portal-shell";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { updateProduct } from "../../actions";

export const dynamic = "force-dynamic";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

type ProductRow = {
  code: string;
  id: number;
  license_prefix: string;
  name: string;
  status: string;
};

export default async function EditProductPage({
  params,
  searchParams,
}: EditProductPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin") {
    redirect("/admin/licenses/generate");
  }

  const { id: rawId } = await params;
  const query = await searchParams;
  const id = Number(rawId);

  if (!Number.isInteger(id) || id < 1) {
    redirect("/admin/products");
  }

  const sql = getDb();
  const rows = (await sql`
    SELECT id, name, code, license_prefix, status
    FROM products
    WHERE id = ${id}
    LIMIT 1
  `) as ProductRow[];
  const product = rows[0];

  if (!product) {
    redirect("/admin/products");
  }

  return (
    <PortalShell activePage="products" title="Edit Product" user={session}>
      <div className="edit-user-content">
        <Link className="back-link" href="/admin/products">
          ← Back to products
        </Link>

        <div className="edit-page-heading">
          <div>
            <h2>Edit product</h2>
            <p>Update product information and license key prefix.</p>
          </div>
          <span className="user-id">Product ID #{product.id}</span>
        </div>

        {query.success === "1" && (
          <div className="form-alert form-alert-success">
            Product updated successfully.
          </div>
        )}

        {query.error === "invalid" && (
          <div className="form-alert form-alert-error">
            Please complete all product details correctly.
          </div>
        )}

        {query.error === "code" && (
          <div className="form-alert form-alert-error">
            That product code is already in use.
          </div>
        )}

        {query.error === "prefix" && (
          <div className="form-alert form-alert-error">
            That license prefix is already in use.
          </div>
        )}

        <form action={updateProduct} className="edit-user-form">
          <input name="id" type="hidden" value={product.id} />
          <div className="form-grid">
            <label className="form-field">
              <span>Product name</span>
              <input
                defaultValue={product.name}
                maxLength={80}
                minLength={2}
                name="name"
                required
                type="text"
              />
            </label>

            <label className="form-field">
              <span>Product code</span>
              <input
                defaultValue={product.code}
                maxLength={50}
                minLength={2}
                name="code"
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                required
                type="text"
              />
            </label>

            <label className="form-field">
              <span>License prefix</span>
              <input
                defaultValue={product.license_prefix}
                maxLength={12}
                minLength={2}
                name="license_prefix"
                pattern="[A-Za-z0-9]{2,12}"
                required
                type="text"
              />
            </label>

            <label className="form-field">
              <span>Status</span>
              <select defaultValue={product.status} name="status" required>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>
          </div>

          <div className="form-actions">
            <Link className="secondary-link" href="/admin/products">
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
