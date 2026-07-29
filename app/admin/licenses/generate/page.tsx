import { redirect } from "next/navigation";
import { PortalShell } from "@/app/_components/portal-shell";
import { getSession } from "@/lib/auth";
import { ensureUserProductAccessTable, getDb } from "@/lib/db";
import { generateLicense } from "./actions";
import { CopyLicenseButton } from "./copy-license-button";
import { LicenseAccountsManager } from "./license-accounts-manager";
import { LicenseActionButtons } from "./license-action-buttons";
import { LicenseLiveSearch } from "./license-live-search";

export const dynamic = "force-dynamic";

type LicenseRow = {
  created_at: string | Date;
  customer_email: string;
  customer_name: string;
  expires_at: string | Date | null;
  id: number;
  license_key: string;
  mt5_account_numbers: string[];
  product_name: string;
  status: string;
};

type ProductRow = {
  id: number;
  name: string;
};

type GenerateLicensePageProps = {
  searchParams: Promise<{
    accounts?: string;
    created?: string;
    email?: string;
    error?: string;
    q?: string;
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

  await ensureUserProductAccessTable();

  const params = await searchParams;
  const createdId = Number(params.created);
  const searchQuery = String(params.q ?? "").trim().slice(0, 100);
  const searchPattern = `%${searchQuery}%`;
  const sql = getDb();
  const [licenseRows, createdLicenseRows, productRows] = await Promise.all([
    searchQuery
      ? sql`
          SELECT
            licenses.id,
            licenses.license_key,
            licenses.customer_name,
            licenses.customer_email,
            licenses.product_name,
            licenses.status,
            licenses.expires_at,
            licenses.created_at,
            ARRAY(
              SELECT license_accounts.mt5_account_number
              FROM license_accounts
              WHERE license_accounts.license_id = licenses.id
              ORDER BY license_accounts.mt5_account_number
            ) AS mt5_account_numbers
          FROM licenses
          WHERE licenses.license_key ILIKE ${searchPattern}
             OR licenses.customer_name ILIKE ${searchPattern}
             OR licenses.customer_email ILIKE ${searchPattern}
             OR licenses.product_name ILIKE ${searchPattern}
             OR EXISTS (
               SELECT 1
               FROM license_accounts
               WHERE license_accounts.license_id = licenses.id
                 AND license_accounts.mt5_account_number ILIKE ${searchPattern}
             )
          ORDER BY licenses.created_at DESC, licenses.id DESC
          LIMIT 100
        `
      : sql`
          SELECT
            licenses.id,
            licenses.license_key,
            licenses.customer_name,
            licenses.customer_email,
            licenses.product_name,
            licenses.status,
            licenses.expires_at,
            licenses.created_at,
            ARRAY(
              SELECT license_accounts.mt5_account_number
              FROM license_accounts
              WHERE license_accounts.license_id = licenses.id
              ORDER BY license_accounts.mt5_account_number
            ) AS mt5_account_numbers
          FROM licenses
          ORDER BY licenses.created_at DESC, licenses.id DESC
          LIMIT 20
        `,
    Number.isInteger(createdId) && createdId > 0
      ? sql`
          SELECT
            licenses.id,
            licenses.license_key,
            licenses.customer_name,
            licenses.customer_email,
            licenses.product_name,
            licenses.status,
            licenses.expires_at,
            licenses.created_at,
            ARRAY(
              SELECT license_accounts.mt5_account_number
              FROM license_accounts
              WHERE license_accounts.license_id = licenses.id
              ORDER BY license_accounts.mt5_account_number
            ) AS mt5_account_numbers
          FROM licenses
          WHERE licenses.id = ${createdId}
          LIMIT 1
        `
      : Promise.resolve([]),
    sql`
      SELECT products.id, products.name
      FROM products
      WHERE products.status = 'active'
        AND (
          ${session.role} = 'admin'
          OR EXISTS (
            SELECT 1
            FROM user_product_access
            WHERE user_product_access.user_id = ${session.userId}
              AND user_product_access.product_id = products.id
          )
        )
      ORDER BY products.name ASC, products.id ASC
    `,
  ]);
  const licenses = licenseRows as LicenseRow[];
  const createdRows = createdLicenseRows as LicenseRow[];
  const products = productRows as ProductRow[];
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
            Please complete all license details correctly. MT5 account numbers
            must contain digits only.
          </div>
        )}

        {params.error === "accounts" && (
          <div className="form-alert form-alert-error">
            Unable to add MT5 accounts. Use numbers only and keep the total at
            50 accounts or fewer.
          </div>
        )}

        {params.accounts === "added" && params.email === "sent" && (
          <div className="form-alert form-alert-success" aria-live="polite">
            MT5 accounts added and the updated license email was sent
            successfully.
          </div>
        )}

        {params.accounts === "added" && params.email === "failed" && (
          <div className="form-alert form-alert-error" aria-live="polite">
            MT5 accounts were added, but the updated license email could not be
            sent. Use Send email to try again.
          </div>
        )}

        {params.accounts !== "added" && params.email === "sent" && (
          <div className="form-alert form-alert-success" aria-live="polite">
            License email sent successfully.
          </div>
        )}

        {params.accounts !== "added" && params.email === "failed" && (
          <div className="form-alert form-alert-error" aria-live="polite">
            License was saved, but the email could not be sent. Check the
            Resend configuration, then use Send email to try again.
          </div>
        )}

        {createdLicense && (
          <section className="generated-license" aria-live="polite">
            <div>
              <p className="eyebrow">License generated</p>
              <strong>{createdLicense.license_key}</strong>
              <span>
                {createdLicense.customer_name} · {createdLicense.product_name}
                {" · "}
                {createdLicense.mt5_account_numbers.length} MT5 account
                {createdLicense.mt5_account_numbers.length === 1 ? "" : "s"}
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
                <span>Product</span>
                <select
                  defaultValue={products[0] ? String(products[0].id) : ""}
                  disabled={products.length === 0}
                  name="product_id"
                  required
                >
                  {products.length === 0 && (
                    <option value="">No active products</option>
                  )}
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
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

              <label className="form-field form-field-full">
                <span>MT5 account numbers</span>
                <textarea
                  inputMode="numeric"
                  name="mt5_account_numbers"
                  placeholder="12345678, 87654321"
                  required
                  rows={3}
                />
                <small>
                  Separate multiple account numbers with commas, spaces or new
                  lines.
                </small>
              </label>
            </div>

            <div className="form-actions">
              <button
                className="save-button"
                disabled={products.length === 0}
                type="submit"
              >
                Generate license
              </button>
            </div>
          </form>
        </section>

        <section className="licenses-panel" aria-label="Recent licenses">
          <div className="licenses-panel-heading">
            <div>
              <h3>Recent licenses</h3>
              <p>
                {searchQuery
                  ? `Search results for “${searchQuery}”.`
                  : "Latest 20 generated license keys."}
              </p>
            </div>
            <span>
              {licenses.length} {searchQuery ? "results" : "records"}
            </span>
          </div>

          <LicenseLiveSearch
            initialQuery={searchQuery}
            key={searchQuery}
          />

          {licenses.length === 0 ? (
            <div className="users-empty">
              <h3>{searchQuery ? "No matching licenses" : "No licenses yet"}</h3>
              <p>
                {searchQuery
                  ? "Try another license key, customer, product or MT5 account."
                  : "Your generated license keys will appear here."}
              </p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="users-table licenses-table">
                <thead>
                  <tr>
                    <th scope="col">License key</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Product</th>
                    <th scope="col">MT5 accounts</th>
                    <th scope="col">Expires</th>
                    <th scope="col">Status</th>
                    <th scope="col">Created</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {licenses.map((license) => (
                    <tr key={license.id}>
                      <td>
                        <div className="license-key-with-copy">
                          <code className="license-key-cell">
                            {license.license_key}
                          </code>
                          <CopyLicenseButton
                            compact
                            value={license.license_key}
                          />
                        </div>
                      </td>
                      <td>
                        <div className="user-identity">
                          <strong>{license.customer_name}</strong>
                          <span>{license.customer_email}</span>
                        </div>
                      </td>
                      <td>{license.product_name}</td>
                      <td>
                        <div className="mt5-account-cell">
                          {license.mt5_account_numbers.length === 0 ? (
                            <span className="muted-value">—</span>
                          ) : (
                            <div className="mt5-account-list">
                              {license.mt5_account_numbers.map(
                                (accountNumber) => (
                                  <code key={accountNumber}>
                                    {accountNumber}
                                  </code>
                                ),
                              )}
                            </div>
                          )}
                          <LicenseAccountsManager
                            accountNumbers={license.mt5_account_numbers}
                            licenseId={license.id}
                            licenseKey={license.license_key}
                          />
                        </div>
                      </td>
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
                      <td className="actions-cell">
                        <LicenseActionButtons
                          licenseId={license.id}
                          licenseKey={license.license_key}
                          status={license.status}
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
