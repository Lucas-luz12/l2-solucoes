import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/frota/http";
import { resetDemoData } from "@/lib/frota/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const snapshot = await resetDemoData();
    return NextResponse.json(snapshot);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Falha ao restaurar exemplos.");
  }
}
