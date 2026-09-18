import { NextResponse } from "next/server";
import { jsonError, readJson, requireAdmin } from "@/lib/frota/http";
import { savePolicy } from "@/lib/frota/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const policy = await savePolicy(await readJson(request));
    return NextResponse.json({ policy });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Falha ao salvar política.");
  }
}
