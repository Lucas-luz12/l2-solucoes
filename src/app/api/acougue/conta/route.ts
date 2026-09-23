import { clearSessionCookie, setSessionCookie } from "@/lib/acougue/auth";
import { loginAccount, registerAccount, StoreError } from "@/lib/acougue/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error: unknown) {
  if (error instanceof StoreError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: "Não foi possível concluir agora." }, { status: 500 });
}

type Body = {
  action?: string;
  ownerName?: string;
  email?: string;
  password?: string;
  shopName?: string;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Envie os dados em JSON." }, { status: 400 });
  }

  try {
    if (body.action === "logout") {
      await clearSessionCookie();
      return Response.json({ ok: true });
    }
    if (body.action === "login") {
      const result = await loginAccount(body.email ?? "", body.password ?? "");
      await setSessionCookie({ accountId: result.accountId, shopId: result.shopId });
      return Response.json({ ok: true, slug: result.shop.slug });
    }
    if (body.action === "register") {
      const result = await registerAccount({
        ownerName: body.ownerName ?? "",
        email: body.email ?? "",
        password: body.password ?? "",
        shopName: body.shopName ?? "",
      });
      await setSessionCookie({ accountId: result.accountId, shopId: result.shopId });
      return Response.json({ ok: true, slug: result.shop.slug });
    }
    return Response.json({ error: "Ação desconhecida." }, { status: 400 });
  } catch (error) {
    return fail(error);
  }
}
