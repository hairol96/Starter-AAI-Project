// The signed hrms_session cookie (design §2 rules 6–9).
// The browser carries the whole session: base64url(payload) + "." + HMAC.
// Nothing is trusted until the signature and the expiry verify server-side.
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";

export const SESSION_COOKIE = "hrms_session";

// Interview A3: a session lasts at most 12 hours.
export const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;

export type SessionPayload = {
  userId: number;
  role: Role;
  exp: number; // epoch milliseconds
};

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or too short — set it in .env (see 02-design.md §5).",
    );
  }
  return value;
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

/** Build the cookie value for a fresh session. */
export function createSessionToken(userId: number, role: Role): string {
  const payload: SessionPayload = {
    userId,
    role,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

/** The only way to trust a token: check signature, shape and expiry. */
export function verifySessionToken(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, signature] = parts;

  const expected = Buffer.from(sign(data));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return null;
  }

  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (
    typeof payload?.userId !== "number" ||
    typeof payload?.exp !== "number" ||
    typeof payload?.role !== "string"
  ) {
    return null;
  }
  if (payload.exp <= Date.now()) return null; // expired, even if well signed
  return payload;
}

/** Read the current session from the request's cookies (rule 8 re-reads the user). */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Set the cookie after a successful login. Flags per design §2 rule 9. */
export async function setSessionCookie(userId: number, role: Role): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(userId, role), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/** Sign out. */
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
