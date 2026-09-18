import { NextResponse } from "next/server";
import { isAdminRequest } from "./auth";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireAdmin() {
  if (!(await isAdminRequest())) {
    return jsonError("Sessão expirada. Entre novamente.", 401);
  }
  return null;
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("JSON inválido.");
  }
}
