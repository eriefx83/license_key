import { redirect } from "next/navigation";
import { PortalShell } from "@/app/_components/portal-shell";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { generateLicense } from "./actions";
import { CopyLicenseButton } from "./copy-license-button";

export const dynamic = "force-dynamic";

type LicenseRow = {
  created_at: string | Date;
  customer_email: string;
  customer_name: string;
  expires_at: string | Date | null;
  id: number;
  license_key: string;
  product_name: string;
  status: string;
};

type GenerateLicensePageProps = {
  searchParams: Promise<{
    created?: string;
    error?: string;
  }>;
};

function formatDate(value: string | Date | null) {
  if (!value) {
    return "Lifetime";
  }

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(value));
}

export default async function GenerateLicensePage({
  searchParams,
}: GenerateLicensePageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin" && session.role !== "partner") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const createdId = Number(params.created);
  const sql = getDb();
  const [licenseRows, createdLicenseRows] = await Promise.all([
    sql`
      SELECT
        id,
        license_key,
        customer_name,
        customer_email,
        product_name,
        status,
        expires_at,
        created_at
      FROM licenses
      ORDER BY created_at DESC, id DESC
      LIMIT 20
    `,
    Number.isInteger(createdId) && createdId > 0
      ? sql`
          SELECT
            id,
            license_key,
            customer_name,
            customer_email,
            product_name,
            status,
            expires_at,
            created_at
          FROM licenses
          WHERE id = ${createdId}
          LIMIT 1
        `
      : Promise.resolve([]),
  ]);
  const licenses = licenseRows as LicenseRow[];
  const createdRows = createdLicenseRows as LicenseRow[];
  const createdLicense = createdRows[0];

  return (
    <PortalShell
      activePage="licenses"
      title="Generate License"
      user={session}
    >
      <div className="license-page-content">
        <div className="page-toolbar">
          <div>
            <h2>Generate license key</h2>
            <p>Create and save a new customer license.</p>
          </div>
        </div>

        {params.error === "invalid" && (
          <div className="form-alert form-alert-error">
            Please complete all license details correctly.
          </div>
        )}

        {createdLicense && (
          <section className="generated-license" aria-live="polite">
            <div>
              <p className="eyebrow">License generated</p>
              <strong>{createdLicense.license_key}</strong>
              <span>
                {createdLicense.customer_name} · {createdLicense.product_name}
              </span>
            </div>
            <CopyLicenseButton value={createdLicense.license_key} />
          </section>
        )}

        <section className="license-generator-panel">
          <form action={generateLicense} className="license-form">
            <div className="form-grid">
              <label className="form-field">
                <span>Customer name</span>
                <input
                  minLength={2}
                  name="customer_name"
                  placeholder="Enter customer name"
                  required
                  type="text"
                />
              </label>

              <label className="form-field">
                <span>Customer email</span>
                <input
                  autoComplete="email"
                  name="customer_email"
                  placeholder="customer@example.com"
                  required
                  type="email"
                />
              </label>

              <label className="form-field">
                <span>Product name</span>
                <input
                  defaultValue="GoldTrap EA"
                  minLength={2}
                  name="product_name"
                  required
                  type="text"
                />
              </label>

              <label className="form-field">
                <span>License duration</span>
                <select defaultValue="lifetime" name="duration" required>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                  <option value="365">1 year</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </label>
            </div>

            <div className="form-actions">
              <button className="save-button" type="submit">
                Generate license
              </button>
            </div>
          </form>
        </section>

        <section className="licenses-panel" aria-label="Recent licenses">
          <div className="licenses-panel-heading">
            <div>
              <h3>Recent licenses</h3>
              <p>Latest 20 generated license keys.</p>
            </div>
            <span>{licenses.length} records</span>
          </div>

          {licenses.length === 0 ? (
            <div className="users-empty">
              <h3>No licenses yet</h3>
              <p>Your generated license keys will appear here.</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="users-table licenses-table">
                <thead>
                  <tr>
                    <th scope="col">License key</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Product</th>
                    <th scope="col">Expires</th>
                    <th scope="col">Status</th>
                    <th scope="col">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {licenses.map((license) => (
                    <tr key={license.id}>
                      <td>
                        <code className="license-key-cell">
                          {license.license_key}
                        </code>
                      </td>
                      <td>
                        <div className="user-identity">
                          <strong>{license.customer_name}</strong>
                          <span>{license.customer_email}</span>
                        </div>
                      </td>
                      <td>{license.product_name}</td>
                      <td className="date-cell">
                        {formatDate(license.expires_at)}
                      </td>
                      <td>
                        <span
                          className={`status-badge status-${license.status}`}
                        >
                          <span aria-hidden="true" />
                          {license.status}
                        </span>
                      </td>
                      <td className="date-cell">
                        {formatDate(license.created_at)}
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
