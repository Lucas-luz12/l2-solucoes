import { NextResponse } from "next/server";
import { jsonError, readJson, requireAdmin } from "@/lib/frota/http";
import { saveSettings } from "@/lib/frota/store";
import type { FrotaSettings } from "@/lib/frota/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const settings = await saveSettings(await readJson<Partial<FrotaSettings>>(request));
    return NextResponse.json({ settings });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Falha ao salvar a central.");
  }
}
