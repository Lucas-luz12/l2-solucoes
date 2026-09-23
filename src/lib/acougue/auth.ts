import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { hashPassword, verifyPassword } from "@/lib/security/password";

export { hashPassword, verifyPassword };

const COOKIE = "l2_reserva";
const MAX_AGE = 60 * 60 * 24 * 30;

export type Session = {
  accountId: string;
  shopId: string;
};

function secret() {
  return process.env.ACOUGUE_SESSION_SECRET || "l2-reserva-demonstracao";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function encodeSession(session: Session) {
  const body = Buffer.from(
    JSON.stringify({ ...session, exp: Date.now() + MAX_AGE * 1000 }),
  ).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeSession(token: string | undefined): Session | null {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = sign(body);
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Session & {
      exp?: number;
    };
    if (!parsed.accountId || !parsed.shopId || typeof parsed.exp !== "number") return null;
    if (parsed.exp < Date.now()) return null;
    return { accountId: parsed.accountId, shopId: parsed.shopId };
  } catch {
    return null;
  }
}

export async function readSession() {
  const jar = await cookies();
  return decodeSession(jar.get(COOKIE)?.value);
}

export async function setSessionCookie(session: Session) {
  const headerStore = await headers();
  const secure = headerStore.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https";
  const jar = await cookies();
  jar.set(COOKIE, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
