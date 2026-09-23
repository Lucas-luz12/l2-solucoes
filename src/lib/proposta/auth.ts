import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";

const COOKIE = "l2_proposta";
const MAX_AGE = 60 * 60 * 24 * 14;

export type PropostaSession = {
  email: string;
};

function secret() {
  return process.env.PROPOSTA_SESSION_SECRET || process.env.ACOUGUE_SESSION_SECRET || "l2-proposta-demonstracao";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function encodePropostaSession(session: PropostaSession) {
  const body = Buffer.from(JSON.stringify({ ...session, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodePropostaSession(token: string | undefined): PropostaSession | null {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = sign(body);
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as PropostaSession & {
      exp?: number;
    };
    if (!parsed.email || typeof parsed.exp !== "number" || parsed.exp < Date.now()) return null;
    return { email: parsed.email };
  } catch {
    return null;
  }
}

export async function readPropostaSession() {
  const jar = await cookies();
  return decodePropostaSession(jar.get(COOKIE)?.value);
}

async function secureCookie() {
  const headerStore = await headers();
  return headerStore.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https";
}

export async function setPropostaSession(session: PropostaSession) {
  const jar = await cookies();
  jar.set(COOKIE, encodePropostaSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: await secureCookie(),
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearPropostaSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
