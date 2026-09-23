import { readPropostaSession } from "@/lib/proposta/auth";
import {
  deleteClient,
  deleteProposal,
  duplicateProposal,
  getWorkspace,
  presentWorkspace,
  resetWorkspace,
  saveClient,
  saveCompany,
  saveProposal,
  sendProposal,
  StoreError,
} from "@/lib/proposta/store";
import type { ClientInput, Company, ProposalInput, Workspace } from "@/lib/proposta/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error: unknown) {
  if (error instanceof StoreError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: "Não foi possível concluir agora." }, { status: 500 });
}

function jsonWorkspace<T extends { workspace: Workspace }>(payload: T) {
  return Response.json({ ...payload, workspace: presentWorkspace(payload.workspace) });
}

async function requireOperator() {
  const session = await readPropostaSession();
  if (!session) throw new StoreError("Entre na conta da empresa.", 401);
  const workspace = await getWorkspace();
  if (workspace.operator?.email !== session.email) {
    throw new StoreError("Entre na conta da empresa.", 401);
  }
}

export async function GET() {
  try {
    await requireOperator();
    const workspace = await getWorkspace();
    return jsonWorkspace({ workspace });
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
    await requireOperator();
    switch (body.action) {
      case "save-company": {
        if (!body.company) return Response.json({ error: "Dados da empresa ausentes." }, { status: 400 });
        const workspace = await saveCompany(body.company);
        return jsonWorkspace({ workspace });
      }
      case "save-client": {
        if (!body.client) return Response.json({ error: "Dados do cliente ausentes." }, { status: 400 });
        const result = await saveClient(body.client);
        return jsonWorkspace(result);
      }
      case "delete-client": {
        if (!body.id) return Response.json({ error: "Cliente ausente." }, { status: 400 });
        const workspace = await deleteClient(body.id);
        return jsonWorkspace({ workspace });
      }
      case "save-proposal": {
        if (!body.proposal) return Response.json({ error: "Dados da proposta ausentes." }, { status: 400 });
        const result = await saveProposal(body.proposal);
        return jsonWorkspace(result);
      }
      case "delete-proposal": {
        if (!body.id) return Response.json({ error: "Proposta ausente." }, { status: 400 });
        const workspace = await deleteProposal(body.id);
        return jsonWorkspace({ workspace });
      }
      case "send-proposal": {
        if (!body.id) return Response.json({ error: "Proposta ausente." }, { status: 400 });
        const result = await sendProposal(body.id);
        return jsonWorkspace(result);
      }
      case "duplicate-proposal": {
        if (!body.id) return Response.json({ error: "Proposta ausente." }, { status: 400 });
        const result = await duplicateProposal(body.id);
        return jsonWorkspace(result);
      }
      case "reset": {
        const workspace = await resetWorkspace();
        return jsonWorkspace({ workspace });
      }
      default:
        return Response.json({ error: "Ação desconhecida." }, { status: 400 });
    }
  } catch (error) {
    return fail(error);
  }
}
