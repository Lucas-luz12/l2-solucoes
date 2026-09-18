import { NextResponse } from "next/server";
import { jsonError, readJson, requireAdmin } from "@/lib/frota/http";
import { deleteDevice, updateDevice } from "@/lib/frota/store";
import type { DeviceArea } from "@/lib/frota/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const body = await readJson<{
      name?: string;
      operator?: string;
      area?: DeviceArea;
      policyId?: string;
      notes?: string;
      lockMessage?: string;
    }>(request);
    const device = await updateDevice(id, body);
    return NextResponse.json({ device });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Falha ao atualizar.", 400);
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    await deleteDevice(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Falha ao remover.", 400);
  }
}
