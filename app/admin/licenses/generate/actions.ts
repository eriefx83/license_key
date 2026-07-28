"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

const allowedDurations = new Set(["30", "90", "180", "365", "lifetime"]);

function createLicenseKey() {
  const value = randomBytes(10).toString("hex").toUpperCase();
  return `LK-${value.match(/.{1,4}/g)?.join("-")}`;
}

export async function generateLicense(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin") {
    redirect("/dashboard");
  }

  const customerName = String(formData.get("customer_name") ?? "").trim();
  const customerEmail = String(formData.get("customer_email") ?? "")
    .trim()
    .toLowerCase();
  const productName = String(formData.get("product_name") ?? "").trim();
  const duration = String(formData.get("duration") ?? "");
  const pageUrl = "/admin/licenses/generate";

  if (
    customerName.length < 2 ||
    !customerEmail.includes("@") ||
    productName.length < 2 ||
    !allowedDurations.has(duration)
  ) {
    redirect(`${pageUrl}?error=invalid`);
  }

  const licenseKey = createLicenseKey();
  const durationDays = duration === "lifetime" ? null : Number(duration);
  const sql = getDb();
  const rows = (await sql`
    INSERT INTO licenses (
      license_key,
      customer_name,
      customer_email,
      product_name,
      status,
      expires_at,
      created_by
    )
    VALUES (
      ${licenseKey},
      ${customerName},
      ${customerEmail},
      ${productName},
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
