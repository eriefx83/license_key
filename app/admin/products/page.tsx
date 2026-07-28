import { redirect } from "next/navigation";
import { PortalShell } from "@/app/_components/portal-shell";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { addProduct } from "./actions";
import { ProductActionButtons } from "./product-action-buttons";

export const dynamic = "force-dynamic";

type ProductRow = {
  code: string;
  created_at: string | Date;
  id: number;
  license_count: number;
  license_prefix: string;
  name: string;
  status: string;
};

type ProductsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(value));
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const sql = getDb();
  const productRows = (await sql`
    SELECT
      products.id,
      products.name,
      products.code,
      products.license_prefix,
      products.status,
      products.created_at,
      (
        SELECT COUNT(*)::INTEGER
        FROM licenses
        WHERE licenses.product_id = products.id
      ) AS license_count
    FROM products
    ORDER BY products.created_at DESC, products.id DESC
  `) as ProductRow[];

  return (
    <PortalShell activePage="products" title="Products" user={session}>
      <div className="products-page-content">
        <div className="page-toolbar">
          <div>
            <h2>Add product</h2>
            <p>Create products and configure their license key prefix.</p>
          </div>
        </div>

        {params.success === "1" && (
          <div className="form-alert form-alert-success">
            Product added successfully.
          </div>
        )}

        {params.success === "deleted" && (
          <div className="form-alert form-alert-success">
            Product deleted successfully.
          </div>
        )}

        {params.error === "invalid" && (
          <div className="form-alert form-alert-error">
            Please complete all product details correctly.
          </div>
        )}

        {params.error === "code" && (
          <div className="form-alert form-alert-error">
            That product code is already in use.
          </div>
        )}

        {params.error === "prefix" && (
          <div className="form-alert form-alert-error">
            That license prefix is already in use.
          </div>
        )}

        {params.error === "used" && (
          <div className="form-alert form-alert-error">
            This product cannot be deleted while it has generated licenses.
          </div>
        )}

        <section className="product-form-panel">
          <form action={addProduct} className="product-form">
            <div className="form-grid product-form-grid">
              <label className="form-field">
                <span>Product name</span>
                <input
                  maxLength={80}
                  minLength={2}
                  name="name"
                  placeholder="Example Product"
                  required
                  type="text"
                />
              </label>

              <label className="form-field">
                <span>Product code</span>
                <input
                  maxLength={50}
                  minLength={2}
                  name="code"
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  placeholder="example-product"
                  required
                  type="text"
                />
                <small>Lowercase letters, numbers and hyphens only.</small>
              </label>

              <label className="form-field">
                <span>License prefix</span>
                <input
                  maxLength={12}
                  minLength={2}
                  name="license_prefix"
                  pattern="[A-Za-z0-9]{2,12}"
                  placeholder="EXAMPLE"
                  required
                  type="text"
                />
                <small>Used in keys such as EXAMPLE-XXXX-XXXX-XXXX.</small>
              </label>

              <label className="form-field">
                <span>Status</span>
                <select defaultValue="active" name="status" required>
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </label>
            </div>

            <div className="form-actions">
              <button className="save-button" type="submit">
                Add product
              </button>
            </div>
          </form>
        </section>

        <section className="users-panel products-panel">
          <div className="licenses-panel-heading">
            <div>
              <h3>Products</h3>
              <p>Products available in the license system.</p>
            </div>
            <span>{productRows.length} records</span>
          </div>

          {productRows.length === 0 ? (
            <div className="users-empty">
              <h3>No products yet</h3>
              <p>Your products will appear here.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="users-table products-table">
                <thead>
                  <tr>
                    <th scope="col">Product</th>
                    <th scope="col">Code</th>
                    <th scope="col">License prefix</th>
                    <th scope="col">Total licenses</th>
                    <th scope="col">Status</th>
                    <th scope="col">Created</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productRows.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="user-identity">
                          <strong>{product.name}</strong>
                          <span>Product ID #{product.id}</span>
                        </div>
                      </td>
                      <td>
                        <code className="product-code">{product.code}</code>
                      </td>
                      <td>
                        <span className="product-prefix">
                          {product.license_prefix}
                        </span>
                      </td>
                      <td>
                        <span className="product-license-count">
                          {product.license_count}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge status-${product.status}`}
                        >
                          <span aria-hidden="true" />
                          {product.status}
                        </span>
                      </td>
                      <td className="date-cell">
                        {formatDate(product.created_at)}
                      </td>
                      <td className="actions-cell">
                        <ProductActionButtons
                          licenseCount={product.license_count}
                          productId={product.id}
                          productName={product.name}
                        />
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
