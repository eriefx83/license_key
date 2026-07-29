"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession, setSession } from "@/lib/auth";
import { ensureUserProductAccessTable, getDb } from "@/lib/db";
import { setNewUserCredentials } from "@/lib/new-user-credentials";
import { hashPassword } from "@/lib/password";

const allowedRoles = ["admin", "partner", "agent", "customer", "support"];
const allowedStatuses = ["active", "disabled"];
const allowedAgentTypes = ["limited", "unlimited"];

type ExistingUser = {
  id: number;
};

type InsertedUser = {
  id: number;
};

function parseProductIds(formData: FormData) {
  return [
    ...new Set(
      formData
        .getAll("product_ids")
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  ];
}

async function productIdsAreValid(productIds: number[]) {
  if (productIds.length === 0) {
    return true;
  }

  const sql = getDb();
  const rows = (await sql`
    SELECT COUNT(*)::INTEGER AS product_count
    FROM products
    WHERE id IN (
      SELECT value::BIGINT
      FROM jsonb_array_elements_text(
        ${JSON.stringify(productIds)}::JSONB
      ) AS selected(value)
    )
  `) as { product_count: number }[];

  return Number(rows[0]?.product_count ?? 0) === productIds.length;
}

async function requireAdmin() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin") {
    redirect("/dashboard");
  }

  await ensureUserProductAccessTable();

  return session;
}

export async function createUser(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");
  const role = String(formData.get("role") ?? "");
  const status = String(formData.get("status") ?? "");
  const submittedAgentType = String(formData.get("agent_type") ?? "");
  const submittedAgentLimit = Number(formData.get("agent_limit") ?? 5);
  const productIds = parseProductIds(formData);
  const agentType =
    role === "agent" && allowedAgentTypes.includes(submittedAgentType)
      ? submittedAgentType
      : "limited";
  const agentLimit =
    role === "agent" && agentType === "limited" ? submittedAgentLimit : 5;
  const usersUrl = "/admin/users";

  if (
    name.length < 2 ||
    !email.includes("@") ||
    password.length < 8 ||
    password !== confirmPassword ||
    !allowedRoles.includes(role) ||
    !allowedStatuses.includes(status)
  ) {
    redirect(`${usersUrl}?error=invalid`);
  }

  if (
    role === "agent" &&
    (!allowedAgentTypes.includes(submittedAgentType) ||
      (agentType === "limited" &&
        (!Number.isInteger(agentLimit) || agentLimit < 1)))
  ) {
    redirect(`${usersUrl}?error=agent_limit`);
  }

  if (!(await productIdsAreValid(productIds))) {
    redirect(`${usersUrl}?error=product_access`);
  }

  const sql = getDb();
  const duplicateRows = (await sql`
    SELECT id
    FROM users
    WHERE LOWER(email) = ${email}
    LIMIT 1
  `) as ExistingUser[];

  if (duplicateRows[0]) {
    redirect(`${usersUrl}?error=email`);
  }

  const passwordHash = await hashPassword(password);

  const insertedRows = (await sql`
    WITH new_user AS (
      INSERT INTO users (
        name,
        email,
        password_hash,
        role,
        status,
        agent_type,
        agent_limit
      )
      VALUES (
        ${name},
        ${email},
        ${passwordHash},
        ${role},
        ${status},
        ${agentType},
        ${agentLimit}
      )
      RETURNING id
    ),
    new_access AS (
      INSERT INTO user_product_access (user_id, product_id)
      SELECT new_user.id, selected.value::BIGINT
      FROM new_user
      CROSS JOIN LATERAL jsonb_array_elements_text(
        ${JSON.stringify(productIds)}::JSONB
      ) AS selected(value)
      RETURNING user_id
    )
    SELECT id
    FROM new_user
  `) as InsertedUser[];
  const insertedUser = insertedRows[0];

  if (!insertedUser) {
    redirect(`${usersUrl}?error=invalid`);
  }

  await setNewUserCredentials({
    accountLimit: agentLimit,
    agentType,
    email,
    id: Number(insertedUser.id),
    name,
    password,
    role,
    status,
  });

  revalidatePath(usersUrl);
  redirect(`${usersUrl}?success=created`);
}

export async function updateUser(formData: FormData) {
  const session = await requireAdmin();

  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "");
  const status = String(formData.get("status") ?? "");
  const password = String(formData.get("password") ?? "");
  const submittedAgentType = String(formData.get("agent_type") ?? "");
  const submittedAgentLimit = Number(formData.get("agent_limit") ?? 5);
  const productIds = parseProductIds(formData);
  const agentType =
    role === "agent" && allowedAgentTypes.includes(submittedAgentType)
      ? submittedAgentType
      : "limited";
  const agentLimit =
    role === "agent" && agentType === "limited" ? submittedAgentLimit : 5;
  const editUrl = `/admin/users/${id}/edit`;

  if (
    !Number.isInteger(id) ||
    id < 1 ||
    name.length < 2 ||
    !email.includes("@") ||
    !allowedRoles.includes(role) ||
    !allowedStatuses.includes(status)
  ) {
    redirect(`${editUrl}?error=invalid`);
  }

  if (id === session.userId && (role !== "admin" || status !== "active")) {
    redirect(`${editUrl}?error=self`);
  }

  if (password && password.length < 8) {
    redirect(`${editUrl}?error=password`);
  }

  if (
    role === "agent" &&
    (!allowedAgentTypes.includes(submittedAgentType) ||
      (agentType === "limited" &&
        (!Number.isInteger(agentLimit) || agentLimit < 1)))
  ) {
    redirect(`${editUrl}?error=agent_limit`);
  }

  if (!(await productIdsAreValid(productIds))) {
    redirect(`${editUrl}?error=product_access`);
  }

  const sql = getDb();
  const existingRows = (await sql`
    SELECT id
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `) as ExistingUser[];

  if (!existingRows[0]) {
    redirect("/admin/users");
  }

  const duplicateRows = (await sql`
    SELECT id
    FROM users
    WHERE LOWER(email) = ${email}
      AND id <> ${id}
    LIMIT 1
  `) as ExistingUser[];

  if (duplicateRows[0]) {
    redirect(`${editUrl}?error=email`);
  }

  const passwordHash = password ? await hashPassword(password) : null;

  await sql`
    WITH updated_user AS (
      UPDATE users
      SET
        name = ${name},
        email = ${email},
        role = ${role},
        status = ${status},
        agent_type = ${agentType},
        agent_limit = ${agentLimit},
        password_hash = COALESCE(${passwordHash}, password_hash),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id
    ),
    removed_access AS (
      DELETE FROM user_product_access
      WHERE user_id IN (SELECT id FROM updated_user)
        AND product_id NOT IN (
          SELECT value::BIGINT
          FROM jsonb_array_elements_text(
            ${JSON.stringify(productIds)}::JSONB
          ) AS retained(value)
        )
    ),
    new_access AS (
      INSERT INTO user_product_access (user_id, product_id)
      SELECT updated_user.id, selected.value::BIGINT
      FROM updated_user
      CROSS JOIN LATERAL jsonb_array_elements_text(
        ${JSON.stringify(productIds)}::JSONB
      ) AS selected(value)
      ON CONFLICT (user_id, product_id) DO NOTHING
      RETURNING user_id
    )
    SELECT id
    FROM updated_user
  `;

  if (id === session.userId) {
    await setSession({ id, email, name, role });
  }

  revalidatePath("/admin/users");
  revalidatePath(editUrl);
  redirect(`${editUrl}?success=1`);
}

export async function deleteUser(formData: FormData) {
  const session = await requireAdmin();

  const id = Number(formData.get("id"));
  const usersUrl = "/admin/users";

  if (!Number.isInteger(id) || id < 1) {
    redirect(`${usersUrl}?error=invalid`);
  }

  if (id === session.userId) {
    redirect(`${usersUrl}?error=self_delete`);
  }

  const sql = getDb();
  await sql`
    DELETE FROM users
    WHERE id = ${id}
  `;

  revalidatePath(usersUrl);
  redirect(`${usersUrl}?success=deleted`);
}
