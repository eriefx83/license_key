"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

const allowedDurations = new Set(["30", "90", "180", "365", "lifetime"]);

type ProductRow = {
  id: number;
  license_prefix: string;
  name: string;
};

function createLicenseKey(prefix: string) {
  const value = randomBytes(6).toString("hex").toUpperCase();
  return `${prefix}-${value.match(/.{1,4}/g)?.join("-")}`;
}

function parseMt5AccountNumbers(value: FormDataEntryValue | null) {
  return [
    ...new Set(
      String(value ?? "")
        .split(/[\s,]+/)
        .map((accountNumber) => accountNumber.trim())
        .filter(Boolean),
    ),
  ];
}

async function requireLicenseManager() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin" && session.role !== "partner") {
    redirect("/dashboard");
  }

  return session;
}

export async function generateLicense(formData: FormData) {
  const session = await requireLicenseManager();

  const customerName = String(formData.get("customer_name") ?? "").trim();
  const customerEmail = String(formData.get("customer_email") ?? "")
    .trim()
    .toLowerCase();
  const productId = Number(formData.get("product_id"));
  const duration = String(formData.get("duration") ?? "");
  const mt5AccountNumbers = parseMt5AccountNumbers(
    formData.get("mt5_account_numbers"),
  );
  const pageUrl = "/admin/licenses/generate";

  if (
    customerName.length < 2 ||
    !customerEmail.includes("@") ||
    !Number.isInteger(productId) ||
    productId < 1 ||
    mt5AccountNumbers.length < 1 ||
    mt5AccountNumbers.length > 50 ||
    mt5AccountNumbers.some((value) => !/^\d{4,20}$/.test(value)) ||
    !allowedDurations.has(duration)
  ) {
    redirect(`${pageUrl}?error=invalid`);
  }

  const sql = getDb();
  const productRows = (await sql`
    SELECT id, name, license_prefix
    FROM products
    WHERE id = ${productId}
      AND status = 'active'
    LIMIT 1
  `) as ProductRow[];
  const product = productRows[0];

  if (!product) {
    redirect(`${pageUrl}?error=invalid`);
  }

  const licenseKey = createLicenseKey(product.license_prefix);
  const durationDays = duration === "lifetime" ? null : Number(duration);
  const rows = (await sql`
    WITH new_license AS (
      INSERT INTO licenses (
        license_key,
        customer_name,
        customer_email,
        product_id,
        product_name,
        status,
        expires_at,
        created_by
      )
      VALUES (
        ${licenseKey},
        ${customerName},
        ${customerEmail},
        ${product.id},
        ${product.name},
        'active',
        CASE
          WHEN ${durationDays}::INTEGER IS NULL THEN NULL
          ELSE NOW() + (${durationDays}::INTEGER * INTERVAL '1 day')
        END,
        ${session.userId}
      )
      RETURNING id
    ),
    new_accounts AS (
      INSERT INTO license_accounts (license_id, mt5_account_number)
      SELECT new_license.id, account.value
      FROM new_license
      CROSS JOIN LATERAL jsonb_array_elements_text(
        ${JSON.stringify(mt5AccountNumbers)}::JSONB
      ) AS account(value)
      RETURNING license_id
    )
    SELECT id
    FROM new_license
  `) as { id: number }[];

  revalidatePath(pageUrl);
  redirect(`${pageUrl}?created=${rows[0].id}`);
}

export async function addLicenseAccounts(formData: FormData) {
  await requireLicenseManager();

  const licenseId = Number(formData.get("license_id"));
  const accountNumbers = parseMt5AccountNumbers(
    formData.get("new_mt5_account_numbers"),
  );
  const pageUrl = "/admin/licenses/generate";

  if (
    !Number.isInteger(licenseId) ||
    licenseId < 1 ||
    accountNumbers.length < 1 ||
    accountNumbers.length > 50 ||
    accountNumbers.some((value) => !/^\d{4,20}$/.test(value))
  ) {
    redirect(`${pageUrl}?error=accounts`);
  }

  const sql = getDb();
  const rows = (await sql`
    SELECT
      licenses.id,
      license_accounts.mt5_account_number
    FROM licenses
    LEFT JOIN license_accounts
      ON license_accounts.license_id = licenses.id
    WHERE licenses.id = ${licenseId}
  `) as { id: number; mt5_account_number: string | null }[];

  if (rows.length === 0) {
    redirect(`${pageUrl}?error=accounts`);
  }

  const existingAccounts = new Set(
    rows
      .map((row) => row.mt5_account_number)
      .filter((value): value is string => Boolean(value)),
  );
  const newAccounts = accountNumbers.filter(
    (accountNumber) => !existingAccounts.has(accountNumber),
  );

  if (existingAccounts.size + newAccounts.length > 50) {
    redirect(`${pageUrl}?error=accounts`);
  }

  if (newAccounts.length > 0) {
    await sql`
      INSERT INTO license_accounts (license_id, mt5_account_number)
      SELECT ${licenseId}, account.value
      FROM jsonb_array_elements_text(
        ${JSON.stringify(newAccounts)}::JSONB
      ) AS account(value)
      ON CONFLICT (license_id, mt5_account_number) DO NOTHING
    `;
  }

  revalidatePath(pageUrl);
  redirect(pageUrl);
}

export async function revokeLicense(formData: FormData) {
  await requireLicenseManager();

  const licenseId = Number(formData.get("license_id"));

  if (!Number.isInteger(licenseId) || licenseId < 1) {
    redirect("/admin/licenses/generate?error=invalid");
  }

  const sql = getDb();
  await sql`
    UPDATE licenses
    SET status = 'revoked',
        updated_at = NOW()
    WHERE id = ${licenseId}
  `;

  revalidatePath("/admin/licenses/generate");
  redirect("/admin/licenses/generate");
}

export async function deleteLicense(formData: FormData) {
  await requireLicenseManager();

  const licenseId = Number(formData.get("license_id"));

  if (!Number.isInteger(licenseId) || licenseId < 1) {
    redirect("/admin/licenses/generate?error=invalid");
  }

  const sql = getDb();
  await sql`
    DELETE FROM licenses
    WHERE id = ${licenseId}
  `;

  revalidatePath("/admin/licenses/generate");
  redirect("/admin/licenses/generate");
}
