import { NextResponse } from "next/server";
import { isAdminRequest, usingDefaultPin } from "@/lib/frota/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const ok = await isAdminRequest();
  return NextResponse.json({
    ok,
    usingDefaultPin: usingDefaultPin(),
  });
}
