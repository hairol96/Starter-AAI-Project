"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";

// Sign in (design §2 rules 1–3, §5). Every failure — bad email, bad
// password, empty field — gets the exact same redirect, so the response
// never reveals which field was wrong (requirements U3 / AC-03).
export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = email === "" ? null : await db.user.findUnique({ where: { email } });
  const passwordOk =
    user !== null && password !== "" && (await bcrypt.compare(password, user.password));
  if (!user || !passwordOk) {
    redirect("/login?error=invalid");
  }

  await setSessionCookie(user.id, user.role);
  redirect(`/${user.role.toLowerCase()}`);
}

// Sign out (design §2 rule 10).
export async function logout() {
  await clearSessionCookie();
  redirect("/login");
}
