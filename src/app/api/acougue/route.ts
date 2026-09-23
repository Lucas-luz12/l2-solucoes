import { readSession } from "@/lib/acougue/auth";
import {
  getShop,
  resetShop,
  saveItem,
  saveShop,
  setReservationStatus,
  StoreError,
} from "@/lib/acougue/store";
import type { CatalogInput, ReservationStatus, Shop } from "@/lib/acougue/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error: unknown) {
  if (error instanceof StoreError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: "Não foi possível concluir agora." }, { status: 500 });
}

async function sessionShop() {
  const session = await readSession();
  if (!session) throw new StoreError("Entre na conta do açougue.", 401);
  return session.shopId;
}

export async function GET() {
  try {
    return Response.json({ data: await getShop(await sessionShop()) });
  } catch (error) {
    return fail(error);
  }
}

type ActionBody = {
  action?: string;
  shop?: Shop;
  item?: CatalogInput;
  id?: string;
  status?: ReservationStatus;
};

export async function POST(request: Request) {
  let body: ActionBody;
  try {
    body = (await request.json()) as ActionBody;
  } catch {
    return Response.json({ error: "Envie os dados em JSON." }, { status: 400 });
  }

  try {
    const shopId = await sessionShop();
    switch (body.action) {
      case "save-shop": {
        if (!body.shop) return Response.json({ error: "Dados da loja ausentes." }, { status: 400 });
        return Response.json({ data: await saveShop(shopId, body.shop) });
      }
      case "save-item": {
        if (!body.item) return Response.json({ error: "Dados do item ausentes." }, { status: 400 });
        return Response.json({ data: await saveItem(shopId, body.item) });
      }
      case "set-status": {
        if (!body.id || !body.status) {
          return Response.json({ error: "Reserva ausente." }, { status: 400 });
        }
        return Response.json({ data: await setReservationStatus(shopId, body.id, body.status) });
      }
      case "reset":
        return Response.json({ data: await resetShop(shopId) });
      default:
        return Response.json({ error: "Ação desconhecida." }, { status: 400 });
    }
  } catch (error) {
    return fail(error);
  }
}
