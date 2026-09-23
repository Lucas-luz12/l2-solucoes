import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const DUMMY_SALT = "l2-senha-inexistente";
const DUMMY_HASH = scryptSync("senha-inexistente", DUMMY_SALT, 32).toString("hex");

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string) {
  const actual = scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "hex");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(actual, expected);
}

/** Gasta o mesmo tempo de uma senha real quando a conta não existe. */
export function passwordMatches(password: string, hash?: string, salt?: string) {
  if (!hash || !salt) return verifyPassword(password, DUMMY_HASH, DUMMY_SALT) && false;
  return verifyPassword(password, hash, salt);
}
