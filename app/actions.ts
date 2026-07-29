"use server";

import { redirect } from "next/navigation";
import {
  clearSession,
  setSession,
  validateCredentials,
} from "@/lib/auth";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const rememberMe = formData.get("remember_me") === "on";

  const user = await validateCredentials(email, password);

  if (!user) {
    redirect("/login?error=invalid");
  }

  await setSession(user, rememberMe);
  redirect(
    user.role === "admin" || user.role === "partner"
      ? "/admin/licenses/generate"
      : "/dashboard",
  );
}

export async function logout() {
  await clearSession();
  redirect("/login");
}
