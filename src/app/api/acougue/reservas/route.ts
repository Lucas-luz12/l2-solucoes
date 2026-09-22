import { createReservation, StoreError } from "@/lib/acougue/store";
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
