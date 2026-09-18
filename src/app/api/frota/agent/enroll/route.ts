import { NextResponse } from "next/server";
import { newToken, setDeviceCookie } from "@/lib/frota/auth";
import { jsonError, readJson } from "@/lib/frota/http";
import { enrollDevice } from "@/lib/frota/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await readJson<{
      code?: string;
      model?: string;
      platform?: string;
    }>(request);
    const token = newToken();
    const { device, snapshot } = await enrollDevice({
      code: String(body.code || ""),
      model: body.model,
      platform: body.platform,
      token,
    });
    await setDeviceCookie(device.id, token);
    return NextResponse.json({ token, snapshot });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Não foi possível parear.", 400);
  }
}
