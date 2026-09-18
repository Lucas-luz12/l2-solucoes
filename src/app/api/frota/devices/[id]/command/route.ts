import { NextResponse } from "next/server";
import { jsonError, readJson, requireAdmin } from "@/lib/frota/http";
import { issueCommand } from "@/lib/frota/store";
import type { CommandType } from "@/lib/frota/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES: CommandType[] = ["lock", "unlock", "locate", "ring", "message"];

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const body = await readJson<{ type?: CommandType; message?: string }>(request);
    if (!body.type || !TYPES.includes(body.type)) {
      return jsonError("Comando inválido.");
    }
    const device = await issueCommand(id, body.type, body.message);
    return NextResponse.json({ device });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Falha no comando.", 400);
  }
}
