"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

const allowedStatuses = new Set(["active", "disabled"]);

type ExistingProductRow = {
  code: string;
  license_prefix: string;
};

async function requireAdmin() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin") {
    redirect("/dashboard");
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

  if (
    name.length < 2 ||
    name.length > 80 ||
    code.length < 2 ||
    code.length > 50 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(code) ||
    !/^[A-Z0-9]{2,12}$/.test(licensePrefix) ||
    !allowedStatuses.has(status)
  ) {
    redirect(`${pageUrl}?error=invalid`);
  }

  const sql = getDb();
  const existingRows = (await sql`
    SELECT code, license_prefix
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
