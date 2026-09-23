import { clearPropostaSession, setPropostaSession } from "@/lib/proposta/auth";
import { loginOperator, StoreError } from "@/lib/proposta/store";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/security/rate-limit";

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
  email?: string;
  password?: string;
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
      await clearPropostaSession();
      return Response.json({ ok: true });
    }
    if (body.action === "login") {
      if (!rateLimit(`proposta-login:${clientIp(request)}`, 8, 15 * 60 * 1000)) return tooManyRequests();
      const result = await loginOperator(body.email ?? "", body.password ?? "");
      await setPropostaSession({ email: result.email });
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Ação desconhecida." }, { status: 400 });
  } catch (error) {
    return fail(error);
  }
}
