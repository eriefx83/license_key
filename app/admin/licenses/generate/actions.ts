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
  const pageUrl = "/admin/licenses/generate";

  if (
    customerName.length < 2 ||
    !customerEmail.includes("@") ||
    !Number.isInteger(productId) ||
    productId < 1 ||
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
  `) as { id: number }[];

  revalidatePath(pageUrl);
  redirect(`${pageUrl}?created=${rows[0].id}`);
}

export async function revokeLicense(licenseId: number) {
  await requireLicenseManager();

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

export async function deleteLicense(licenseId: number) {
  await requireLicenseManager();

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
