"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

const allowedStatuses = new Set(["active", "disabled"]);

type ExistingProductRow = {
  code: string;
  id: number;
  license_prefix: string;
};

function isValidProduct(
  name: string,
  code: string,
  licensePrefix: string,
  status: string,
) {
  return (
    name.length >= 2 &&
    name.length <= 80 &&
    code.length >= 2 &&
    code.length <= 50 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(code) &&
    /^[A-Z0-9]{2,12}$/.test(licensePrefix) &&
    allowedStatuses.has(status)
  );
}

async function requireAdmin() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin") {
    redirect("/admin/licenses/generate");
  }
}

export async function addProduct(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toLowerCase();
  const licensePrefix = String(formData.get("license_prefix") ?? "")
    .trim()
    .toUpperCase();
  const status = String(formData.get("status") ?? "");
  const pageUrl = "/admin/products";

  if (!isValidProduct(name, code, licensePrefix, status)) {
    redirect(`${pageUrl}?error=invalid`);
  }

  const sql = getDb();
  const existingRows = (await sql`
    SELECT id, code, license_prefix
    FROM products
    WHERE code = ${code}
       OR license_prefix = ${licensePrefix}
    LIMIT 1
  `) as ExistingProductRow[];
  const existingProduct = existingRows[0];

  if (existingProduct?.code === code) {
    redirect(`${pageUrl}?error=code`);
  }

  if (existingProduct?.license_prefix === licensePrefix) {
    redirect(`${pageUrl}?error=prefix`);
  }

  await sql`
    INSERT INTO products (name, code, license_prefix, status)
    VALUES (${name}, ${code}, ${licensePrefix}, ${status})
  `;

  revalidatePath(pageUrl);
  revalidatePath("/admin/licenses/generate");
  redirect(`${pageUrl}?success=1`);
}

export async function updateProduct(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toLowerCase();
  const licensePrefix = String(formData.get("license_prefix") ?? "")
    .trim()
    .toUpperCase();
  const status = String(formData.get("status") ?? "");
  const editUrl = `/admin/products/${id}/edit`;

  if (
    !Number.isInteger(id) ||
    id < 1 ||
    !isValidProduct(name, code, licensePrefix, status)
  ) {
    redirect(`${editUrl}?error=invalid`);
  }

  const sql = getDb();
  const productRows = (await sql`
    SELECT id, code, license_prefix
    FROM products
    WHERE id = ${id}
    LIMIT 1
  `) as ExistingProductRow[];

  if (!productRows[0]) {
    redirect("/admin/products");
  }

  const duplicateRows = (await sql`
    SELECT id, code, license_prefix
    FROM products
    WHERE id <> ${id}
      AND (code = ${code} OR license_prefix = ${licensePrefix})
    LIMIT 1
  `) as ExistingProductRow[];
  const duplicateProduct = duplicateRows[0];

  if (duplicateProduct?.code === code) {
    redirect(`${editUrl}?error=code`);
  }

  if (duplicateProduct?.license_prefix === licensePrefix) {
    redirect(`${editUrl}?error=prefix`);
  }

  await sql`
    UPDATE products
    SET
      name = ${name},
      code = ${code},
      license_prefix = ${licensePrefix},
      status = ${status},
      updated_at = NOW()
    WHERE id = ${id}
  `;

  revalidatePath("/admin/products");
  revalidatePath(editUrl);
  revalidatePath("/admin/licenses/generate");
  redirect(`${editUrl}?success=1`);
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const pageUrl = "/admin/products";

  if (!Number.isInteger(id) || id < 1) {
    redirect(`${pageUrl}?error=invalid`);
  }

  const sql = getDb();
  const rows = (await sql`
    SELECT
      products.id,
      COUNT(licenses.id)::INTEGER AS license_count
    FROM products
    LEFT JOIN licenses ON licenses.product_id = products.id
    WHERE products.id = ${id}
    GROUP BY products.id
    LIMIT 1
  `) as { id: number; license_count: number }[];
  const product = rows[0];

  if (!product) {
    redirect(pageUrl);
  }

  if (product.license_count > 0) {
    redirect(`${pageUrl}?error=used`);
  }

  await sql`
    DELETE FROM products
    WHERE id = ${id}
  `;

  revalidatePath(pageUrl);
  revalidatePath("/admin/licenses/generate");
  redirect(`${pageUrl}?success=deleted`);
}
