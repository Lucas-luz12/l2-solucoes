import { NextResponse } from "next/server";
import { pinMatches, setAdminCookie, usingDefaultPin } from "@/lib/frota/auth";
import { jsonError, readJson } from "@/lib/frota/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await readJson<{ pin?: string }>(request);
    if (!pinMatches(String(body.pin || ""))) {
      return jsonError("PIN incorreto.", 401);
    }
    await setAdminCookie();
    return NextResponse.json({ ok: true, usingDefaultPin: usingDefaultPin() });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Falha no login.", 400);
  }
}
