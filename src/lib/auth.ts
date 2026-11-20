// The only doors a page or action may use (design §2 rules 4–5 and 8, §5).
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  division: string;
  designation: string;
};

// The password column is deliberately not selected (design §6).
const SAFE_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  division: true,
  designation: true,
} as const;

/** Session + database, both trusted (rule 8). Never redirects. */
export async function getSignedInUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: SAFE_FIELDS,
  });
  if (!user || user.role !== session.role) return null; // user gone or role changed
  return user;
}

/** Pages and actions call this first; logged-out visitors go to /login. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getSignedInUser();
  if (!user) redirect("/login");
  return user;
}

/** A logged-in user with the wrong role is bounced to their own home. */
export async function requireRole(role: Role): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== role) {
    redirect(`/${user.role.toLowerCase()}?notice=not-authorized`);
  }
  return user;
}
