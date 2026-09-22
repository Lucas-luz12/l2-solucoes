import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { addCalendarDays, saoPauloToday } from "./dates";
import { effectiveStatus } from "./present";
import { createSeed } from "./seed";
import type {
  Client,
  ClientInput,
  Company,
  Proposal,
  ProposalInput,
  PublicProposal,
  Workspace,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "proposta.json");

let memory: Workspace | null = null;
let persistent = true;
let ready: Promise<void> | null = null;
let chain: Promise<unknown> = Promise.resolve();

export class StoreError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function ensureStorage() {
  if (ready) return ready;
  ready = (async () => {
    try {
      await mkdir(DATA_DIR, { recursive: true });
      const probe = path.join(DATA_DIR, ".write-probe");
      await writeFile(probe, "ok");
      await unlink(probe);
      persistent = true;
    } catch {
      persistent = false;
      memory = createSeed();
    }
  })();
  return ready;
}

async function readWorkspace(): Promise<Workspace> {
  await ensureStorage();
  if (!persistent) {
    memory ??= createSeed();
    return structuredClone(memory);
  }
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as Workspace;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return createSeed();
    throw error;
  }
}

async function writeWorkspace(workspace: Workspace) {
  await ensureStorage();
  if (!persistent) {
    memory = structuredClone(workspace);
    return;
  }
  try {
    await mkdir(DATA_DIR, { recursive: true });
    const temporary = path.join(DATA_DIR, `proposta.${process.pid}.tmp`);
    await writeFile(temporary, JSON.stringify(workspace, null, 2));
    const { rename } = await import("node:fs/promises");
    await rename(temporary, DATA_FILE);
  } catch {
    persistent = false;
    memory = structuredClone(workspace);
  }
}

function applyExpiry(workspace: Workspace, today: string) {
  let changed = false;
  const proposals = workspace.proposals.map((proposal) => {
    const status = effectiveStatus(proposal, today);
    if (status === proposal.status) return proposal;
    changed = true;
    return { ...proposal, status, updatedAt: new Date().toISOString() };
  });
  return { workspace: changed ? { ...workspace, proposals } : workspace, changed };
}

async function load() {
  const today = saoPauloToday();
  const current = await readWorkspace();
  const { workspace, changed } = applyExpiry(current, today);
  if (changed) await writeWorkspace(workspace);
  return workspace;
}

function clean(value: string, max: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanBlock(value: string, max: number) {
  return value.replace(/\r\n/g, "\n").trim().slice(0, max);
}

function requireText(value: string, label: string, min: number, max: number) {
  const text = clean(value, max);
  if (text.length < min) {
    throw new StoreError(`${label} precisa de pelo menos ${min} caracteres.`);
  }
  return text;
}

function nextNumber(proposals: Proposal[], now = new Date()) {
  const year = Number(saoPauloToday(now).slice(0, 4));
  const sequence = proposals.reduce((max, proposal) => {
    const match = proposal.number.match(/^PR-(\d{4})-(\d+)$/);
    if (!match || Number(match[1]) !== year) return max;
    return Math.max(max, Number(match[2]));
  }, 0);
  return `PR-${year}-${String(sequence + 1).padStart(3, "0")}`;
}

export async function getWorkspace() {
  return withLock(load);
}

export async function resetWorkspace() {
  return withLock(async () => {
    const seeded = createSeed();
    const { workspace } = applyExpiry(seeded, saoPauloToday());
    await writeWorkspace(workspace);
    return workspace;
  });
}

export async function saveCompany(input: Company) {
  return withLock(async () => {
    const workspace = await load();
    const name = requireText(input.name ?? "", "O nome da empresa", 2, 80);
    const email = clean(input.email ?? "", 120);
    if (email && !email.includes("@")) {
      throw new StoreError("Informe um e-mail válido.");
    }
    workspace.company = {
      name,
      document: clean(input.document ?? "", 40),
      email,
      phone: clean(input.phone ?? "", 30),
      city: clean(input.city ?? "", 80),
      pix: clean(input.pix ?? "", 120),
      site: clean(input.site ?? "", 160),
    };
    await writeWorkspace(workspace);
    return workspace;
  });
}

export async function saveClient(input: ClientInput) {
  return withLock(async () => {
    const workspace = await load();
    const name = requireText(input.name ?? "", "O nome do contato", 2, 80);
    const email = clean(input.email ?? "", 120);
    if (email && !email.includes("@")) {
      throw new StoreError("Informe um e-mail válido.");
    }
    const next: Omit<Client, "id" | "createdAt"> = {
      name,
      company: clean(input.company ?? "", 80),
      email,
      phone: clean(input.phone ?? "", 30),
      city: clean(input.city ?? "", 80),
    };

    if (input.id) {
      const index = workspace.clients.findIndex((client) => client.id === input.id);
      if (index === -1) throw new StoreError("Cliente não encontrado.", 404);
      workspace.clients[index] = { ...workspace.clients[index], ...next };
    } else {
      workspace.clients.unshift({
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        ...next,
      });
    }

    await writeWorkspace(workspace);
    return { workspace, clientId: input.id || workspace.clients[0].id };
  });
}

export async function deleteClient(id: string) {
  return withLock(async () => {
    const workspace = await load();
    if (workspace.proposals.some((proposal) => proposal.clientId === id)) {
      throw new StoreError("Este cliente tem propostas. Apague ou troque as propostas antes.");
    }
    const next = workspace.clients.filter((client) => client.id !== id);
    if (next.length === workspace.clients.length) {
      throw new StoreError("Cliente não encontrado.", 404);
    }
    workspace.clients = next;
    await writeWorkspace(workspace);
    return workspace;
  });
}

function normalizeProposal(input: ProposalInput, existing: Proposal | null, nowIso: string) {
  const title = requireText(input.title ?? "", "O título", 3, 140);
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new StoreError("Inclua pelo menos um item.");
  }
  if (input.items.length > 30) {
    throw new StoreError("Uma proposta pode ter no máximo 30 itens.");
  }

  const items = input.items.map((item) => {
    const description = requireText(item.description ?? "", "A descrição do item", 2, 240);
    const quantity = Number(item.quantity);
    const unitPriceCents = Math.round(Number(item.unitPriceCents));
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 10_000) {
      throw new StoreError(`Quantidade inválida em “${description}”.`);
    }
    if (!Number.isInteger(unitPriceCents) || unitPriceCents < 0 || unitPriceCents > 100_000_000_00) {
      throw new StoreError(`Valor inválido em “${description}”.`);
    }
    return {
      id: randomUUID(),
      description,
      quantity: Math.round(quantity * 100) / 100,
      unitPriceCents,
    };
  });

  const discountPercent = Math.round(Number(input.discountPercent));
  if (!Number.isInteger(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    throw new StoreError("O desconto precisa ser um número inteiro de 0 a 100.");
  }

  const validityDays = Math.round(Number(input.validityDays));
  if (!Number.isInteger(validityDays) || validityDays < 1 || validityDays > 90) {
    throw new StoreError("A validade precisa ficar entre 1 e 90 dias.");
  }

  return {
    title,
    summary: cleanBlock(input.summary ?? "", 2000),
    items,
    discountPercent,
    validityDays,
    paymentTerms: cleanBlock(input.paymentTerms ?? "", 500),
    notes: cleanBlock(input.notes ?? "", 2000),
    updatedAt: nowIso,
    createdAt: existing?.createdAt ?? nowIso,
  };
}

export async function saveProposal(input: ProposalInput) {
  return withLock(async () => {
    const workspace = await load();
    const client = workspace.clients.find((item) => item.id === input.clientId);
    if (!client) throw new StoreError("Escolha um cliente cadastrado.");

    const nowIso = new Date().toISOString();
    if (input.id) {
      const index = workspace.proposals.findIndex((proposal) => proposal.id === input.id);
      if (index === -1) throw new StoreError("Proposta não encontrada.", 404);
      const current = workspace.proposals[index];
      if (current.status === "aceita") {
        throw new StoreError("Proposta aceita fica registrada. Duplique para fazer uma nova versão.");
      }
      const normalized = normalizeProposal(input, current, nowIso);
      workspace.proposals[index] = { ...current, ...normalized, clientId: client.id };
      await writeWorkspace(workspace);
      return { workspace, proposalId: current.id };
    }

    const proposal: Proposal = {
      id: randomUUID(),
      number: nextNumber(workspace.proposals),
      token: randomBytes(9).toString("base64url"),
      clientId: client.id,
      status: "rascunho",
      validUntil: null,
      sentAt: null,
      viewedAt: null,
      respondedAt: null,
      responseName: null,
      responseNote: null,
      ...normalizeProposal(input, null, nowIso),
    };
    workspace.proposals.unshift(proposal);
    await writeWorkspace(workspace);
    return { workspace, proposalId: proposal.id };
  });
}

export async function deleteProposal(id: string) {
  return withLock(async () => {
    const workspace = await load();
    const next = workspace.proposals.filter((proposal) => proposal.id !== id);
    if (next.length === workspace.proposals.length) {
      throw new StoreError("Proposta não encontrada.", 404);
    }
    workspace.proposals = next;
    await writeWorkspace(workspace);
    return workspace;
  });
}

export async function sendProposal(id: string) {
  return withLock(async () => {
    const workspace = await load();
    const proposal = workspace.proposals.find((item) => item.id === id);
    if (!proposal) throw new StoreError("Proposta não encontrada.", 404);
    if (proposal.status === "aceita") {
      throw new StoreError("Proposta aceita não pode ser reenviada. Duplique para uma nova versão.");
    }
    if (proposal.items.length === 0) throw new StoreError("Inclua pelo menos um item antes de enviar.");
    const today = saoPauloToday();
    const nowIso = new Date().toISOString();
    proposal.status = "enviada";
    proposal.sentAt = nowIso;
    proposal.viewedAt = null;
    proposal.respondedAt = null;
    proposal.responseName = null;
    proposal.responseNote = null;
    proposal.validUntil = addCalendarDays(today, proposal.validityDays);
    proposal.updatedAt = nowIso;
    await writeWorkspace(workspace);
    return { workspace, proposalId: proposal.id, token: proposal.token };
  });
}

export async function duplicateProposal(id: string) {
  return withLock(async () => {
    const workspace = await load();
    const current = workspace.proposals.find((item) => item.id === id);
    if (!current) throw new StoreError("Proposta não encontrada.", 404);
    const nowIso = new Date().toISOString();
    const copy: Proposal = {
      ...structuredClone(current),
      id: randomUUID(),
      number: nextNumber(workspace.proposals),
      token: randomBytes(9).toString("base64url"),
      title: current.title.slice(0, 130) + " (cópia)",
      status: "rascunho",
      validUntil: null,
      sentAt: null,
      viewedAt: null,
      respondedAt: null,
      responseName: null,
      responseNote: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      items: current.items.map((item) => ({ ...item, id: randomUUID() })),
    };
    workspace.proposals.unshift(copy);
    await writeWorkspace(workspace);
    return { workspace, proposalId: copy.id };
  });
}

export async function getPublicProposal(token: string): Promise<PublicProposal> {
  const workspace = await getWorkspace();
  const proposal = workspace.proposals.find((item) => item.token === token);
  if (!proposal) throw new StoreError("Proposta não encontrada.", 404);
  const client = workspace.clients.find((item) => item.id === proposal.clientId);
  if (!client) throw new StoreError("Proposta não encontrada.", 404);
  return {
    company: workspace.company,
    client: { name: client.name, company: client.company, city: client.city },
    proposal,
  };
}

export async function markProposalViewed(token: string) {
  return withLock(async () => {
    const workspace = await load();
    const proposal = workspace.proposals.find((item) => item.token === token);
    if (!proposal) throw new StoreError("Proposta não encontrada.", 404);
    if (proposal.status === "enviada") {
      proposal.status = "visualizada";
      proposal.viewedAt = new Date().toISOString();
      proposal.updatedAt = proposal.viewedAt;
      await writeWorkspace(workspace);
    }
    const client = workspace.clients.find((item) => item.id === proposal.clientId);
    if (!client) throw new StoreError("Proposta não encontrada.", 404);
    return {
      company: workspace.company,
      client: { name: client.name, company: client.company, city: client.city },
      proposal,
    } satisfies PublicProposal;
  });
}

export async function respondProposal(
  token: string,
  decision: "aceita" | "recusada",
  name: string,
  note: string,
) {
  return withLock(async () => {
    const workspace = await load();
    const proposal = workspace.proposals.find((item) => item.token === token);
    if (!proposal) throw new StoreError("Proposta não encontrada.", 404);
    const today = saoPauloToday();
    if (effectiveStatus(proposal, today) === "expirada") {
      proposal.status = "expirada";
      proposal.updatedAt = new Date().toISOString();
      await writeWorkspace(workspace);
      throw new StoreError("O prazo desta proposta encerrou. Peça um link atualizado.");
    }
    if (proposal.status !== "enviada" && proposal.status !== "visualizada") {
      throw new StoreError("Esta proposta não está aberta para resposta.");
    }
    const responseName = requireText(name ?? "", "O seu nome", 2, 80);
    proposal.status = decision;
    proposal.respondedAt = new Date().toISOString();
    proposal.responseName = responseName;
    proposal.responseNote = cleanBlock(note ?? "", 500);
    proposal.updatedAt = proposal.respondedAt;
    if (!proposal.viewedAt) proposal.viewedAt = proposal.respondedAt;
    await writeWorkspace(workspace);
    const client = workspace.clients.find((item) => item.id === proposal.clientId);
    if (!client) throw new StoreError("Proposta não encontrada.", 404);
    return {
      company: workspace.company,
      client: { name: client.name, company: client.company, city: client.city },
      proposal,
    } satisfies PublicProposal;
  });
}
