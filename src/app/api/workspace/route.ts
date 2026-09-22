import {
  deleteClient,
  deleteProposal,
  duplicateProposal,
  getWorkspace,
  resetWorkspace,
  saveClient,
  saveCompany,
  saveProposal,
  sendProposal,
  StoreError,
} from "@/lib/proposta/store";
import type { ClientInput, Company, ProposalInput } from "@/lib/proposta/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error: unknown) {
  if (error instanceof StoreError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: "Não foi possível concluir agora." }, { status: 500 });
}

export async function GET() {
  try {
    const workspace = await getWorkspace();
    return Response.json({ workspace });
  } catch (error) {
    return fail(error);
  }
}

type ActionBody = {
  action?: string;
  company?: Company;
  client?: ClientInput;
  id?: string;
  proposal?: ProposalInput;
};

export async function POST(request: Request) {
  let body: ActionBody;
  try {
    body = (await request.json()) as ActionBody;
  } catch {
    return Response.json({ error: "Envie os dados em JSON." }, { status: 400 });
  }

  try {
    switch (body.action) {
      case "save-company": {
        if (!body.company) return Response.json({ error: "Dados da empresa ausentes." }, { status: 400 });
        const workspace = await saveCompany(body.company);
        return Response.json({ workspace });
      }
      case "save-client": {
        if (!body.client) return Response.json({ error: "Dados do cliente ausentes." }, { status: 400 });
        const result = await saveClient(body.client);
        return Response.json(result);
      }
      case "delete-client": {
        if (!body.id) return Response.json({ error: "Cliente ausente." }, { status: 400 });
        const workspace = await deleteClient(body.id);
        return Response.json({ workspace });
      }
      case "save-proposal": {
        if (!body.proposal) return Response.json({ error: "Dados da proposta ausentes." }, { status: 400 });
        const result = await saveProposal(body.proposal);
        return Response.json(result);
      }
      case "delete-proposal": {
        if (!body.id) return Response.json({ error: "Proposta ausente." }, { status: 400 });
        const workspace = await deleteProposal(body.id);
        return Response.json({ workspace });
      }
      case "send-proposal": {
        if (!body.id) return Response.json({ error: "Proposta ausente." }, { status: 400 });
        const result = await sendProposal(body.id);
        return Response.json(result);
      }
      case "duplicate-proposal": {
        if (!body.id) return Response.json({ error: "Proposta ausente." }, { status: 400 });
        const result = await duplicateProposal(body.id);
        return Response.json(result);
      }
      case "reset": {
        const workspace = await resetWorkspace();
        return Response.json({ workspace });
      }
      default:
        return Response.json({ error: "Ação desconhecida." }, { status: 400 });
    }
  } catch (error) {
    return fail(error);
  }
}
