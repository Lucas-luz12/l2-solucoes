import { getPublicProposal, markProposalViewed, respondProposal, StoreError } from "@/lib/proposta/store";

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

export async function GET(_request: Request, context: TokenContext) {
  const { token } = await context.params;
  try {
    const proposal = await getPublicProposal(token);
    return Response.json(proposal);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request, context: TokenContext) {
  const { token } = await context.params;
  let body: { action?: string; name?: string; note?: string };
  try {
    body = (await request.json()) as { action?: string; name?: string; note?: string };
  } catch {
    return Response.json({ error: "Envie os dados em JSON." }, { status: 400 });
  }

  try {
    if (body.action === "view") {
      const proposal = await markProposalViewed(token);
      return Response.json(proposal);
    }
    if (body.action === "aceita" || body.action === "recusada") {
      const proposal = await respondProposal(token, body.action, body.name ?? "", body.note ?? "");
      return Response.json(proposal);
    }
    return Response.json({ error: "Ação desconhecida." }, { status: 400 });
  } catch (error) {
    return fail(error);
  }
}
