import { NextResponse } from "next/server";
import { jsonError, readJson, requireAdmin } from "@/lib/frota/http";
import { checkinDevice, checkoutDevice, markLost } from "@/lib/frota/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  try {
    const body = await readJson<{
      action?: "checkout" | "checkin" | "lost";
      operator?: string;
      destination?: string;
      expectedReturnAt?: string | null;
    }>(request);
    if (body.action === "checkout") {
      const device = await checkoutDevice(id, {
        operator: String(body.operator || ""),
        destination: String(body.destination || ""),
        expectedReturnAt: body.expectedReturnAt || null,
      });
      return NextResponse.json({ device });
    }
    if (body.action === "checkin") {
      return NextResponse.json({ device: await checkinDevice(id) });
    }
    if (body.action === "lost") {
      return NextResponse.json({ device: await markLost(id) });
    }
    return jsonError("Ação inválida.");
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Falha no ciclo do aparelho.");
  }
}
