import { NextResponse } from "next/server";
import { readBearer } from "@/lib/frota/auth";
import { jsonError, readJson } from "@/lib/frota/http";
import { heartbeat } from "@/lib/frota/store";
import type { GeoPoint } from "@/lib/frota/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const token = readBearer(request);
    if (!token) return jsonError("Aparelho sem credencial.", 401);
    const body = await readJson<{
      location?: GeoPoint | null;
      battery?: number | null;
      charging?: boolean;
      model?: string;
      platform?: string;
      ackedCommandIds?: string[];
    }>(request);
    const result = await heartbeat({
      token,
      location: body.location,
      battery: body.battery,
      charging: body.charging,
      model: body.model,
      platform: body.platform,
      ackedCommandIds: body.ackedCommandIds,
    });
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Falha no sincronismo.", 401);
  }
}
