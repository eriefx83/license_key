"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession, setSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/password";

const allowedRoles = ["admin", "partner", "agent", "customer", "support"];
const allowedStatuses = ["active", "disabled"];
const allowedAgentTypes = ["limited", "unlimited"];

type ExistingUser = {
  id: number;
};

export async function updateUser(formData: FormData) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin") {
    redirect("/dashboard");
  }

  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "");
  const status = String(formData.get("status") ?? "");
  const password = String(formData.get("password") ?? "");
  const submittedAgentType = String(formData.get("agent_type") ?? "");
  const submittedAgentLimit = Number(formData.get("agent_limit") ?? 5);
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
  `;

  if (id === session.userId) {
    await setSession({ id, email, name, role });
  }

  revalidatePath("/admin/users");
  revalidatePath(editUrl);
  redirect(`${editUrl}?success=1`);
}
