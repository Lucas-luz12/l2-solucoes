import { getPublicProposal, markProposalViewed, respondProposal, StoreError } from "@/lib/proposta/store";
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

type TokenContext = { params: Promise<{ token: string }> };

export async function GET(request: Request, context: TokenContext) {
  const { token } = await context.params;
  try {
    if (!rateLimit(`proposta-publica:${clientIp(request)}`, 40, 10 * 60 * 1000)) return tooManyRequests();
    const proposal = await getPublicProposal(token);
    return Response.json(proposal);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request, context: TokenContext) {
  const { token } = await context.params;
  let body: { action?: string; name?: string; note?: string; privacyAccepted?: boolean };
  try {
    body = (await request.json()) as { action?: string; name?: string; note?: string; privacyAccepted?: boolean };
  } catch {
    return Response.json({ error: "Envie os dados em JSON." }, { status: 400 });
  }

  try {
    if (!rateLimit(`proposta-resposta:${clientIp(request)}`, 20, 10 * 60 * 1000)) return tooManyRequests();
    if (body.action === "view") {
      const proposal = await markProposalViewed(token);
      return Response.json(proposal);
    }
    if (body.action === "aceita" || body.action === "recusada") {
      const proposal = await respondProposal(token, body.action, body.name ?? "", body.note ?? "", Boolean(body.privacyAccepted));
      return Response.json(proposal);
    }
    return Response.json({ error: "Ação desconhecida." }, { status: 400 });
  } catch (error) {
    return fail(error);
  }
}
