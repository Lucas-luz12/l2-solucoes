import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "l2_frota_admin";
export const DEVICE_COOKIE = "l2_frota_device";
export const DEFAULT_PIN = "2468";
const SESSION_HOURS = 12;

function secret() {
  return process.env.FROTA_SECRET || "l2-frota-dev-secret-change-me";
}

export function adminPin() {
  return process.env.FROTA_PIN || DEFAULT_PIN;
}

export function usingDefaultPin() {
  return !process.env.FROTA_PIN;
}

function sign(value: string) {
  const sig = createHmac("sha256", secret()).update(value).digest("hex");
  return `${value}.${sig}`;
}

function verify(signed: string | undefined | null): string | null {
  if (!signed) return null;
  const i = signed.lastIndexOf(".");
  if (i < 0) return null;
  const value = signed.slice(0, i);
  const sig = signed.slice(i + 1);
  const expected = createHmac("sha256", secret()).update(value).digest("hex");
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const expPart = value.split(":")[0];
  const exp = Number(expPart);
  if (!Number.isFinite(exp) || Date.now() > exp) return null;
  return value;
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newToken() {
  return randomBytes(24).toString("hex");
}

export function newId() {
  return randomBytes(8).toString("hex");
}

export function enrollmentCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function expiry() {
  return Date.now() + SESSION_HOURS * 60 * 60 * 1000;
}

export async function setAdminCookie() {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, sign(`${expiry()}:admin`), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAdminCookie() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}

export async function isAdminRequest() {
  const jar = await cookies();
  return Boolean(verify(jar.get(ADMIN_COOKIE)?.value));
}

export function pinMatches(pin: string) {
  const expected = adminPin();
  const a = Buffer.from(pin);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function setDeviceCookie(deviceId: string, token: string) {
  const jar = await cookies();
  jar.set(DEVICE_COOKIE, sign(`${expiry()}:${deviceId}:${hashToken(token)}`), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });
}

export function readBearer(request: Request) {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}
