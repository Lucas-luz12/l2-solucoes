import { NextResponse } from "next/server";
import { jsonError, readJson, requireAdmin } from "@/lib/frota/http";
import { createDevice, getSnapshot } from "@/lib/frota/store";
import type { DeviceArea } from "@/lib/frota/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const snapshot = await getSnapshot();
  return NextResponse.json(snapshot);
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await readJson<{
      name?: string;
      operator?: string;
      area?: DeviceArea;
      policyId?: string;
      notes?: string;
    }>(request);
    const device = await createDevice({
      name: String(body.name || ""),
      operator: String(body.operator || ""),
      area: body.area || "operacao",
      policyId: String(body.policyId || "politica-operacao"),
      notes: body.notes,
    });
    return NextResponse.json({ device });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Não foi possível cadastrar.");
  }
}
