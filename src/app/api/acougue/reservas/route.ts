import { createReservation, StoreError } from "@/lib/acougue/store";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import type { ReservationInput } from "@/lib/acougue/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: ReservationInput;
  try {
    body = (await request.json()) as ReservationInput;
  } catch {
    return Response.json({ error: "Envie os dados em JSON." }, { status: 400 });
  }

  try {
    if (!rateLimit(`reserva:${clientIp(request)}`, 10, 10 * 60 * 1000)) return tooManyRequests();
    const result = await createReservation(body);
    return Response.json({ code: result.reservation.code });
  } catch (error) {
    if (error instanceof StoreError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error(error);
    return Response.json({ error: "Não foi possível concluir a reserva." }, { status: 500 });
  }
}
