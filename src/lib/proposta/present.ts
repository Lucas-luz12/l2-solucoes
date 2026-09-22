import { calendarDaysUntil, relativePast, sameMonth } from "./dates";
import type { Client, LineItem, Proposal, ProposalStatus, Workspace } from "./types";

export const STATUS_LABEL: Record<ProposalStatus, string> = {
  rascunho: "Rascunho",
  enviada: "Enviada",
  visualizada: "Aberta pelo cliente",
  aceita: "Aceita",
  recusada: "Recusada",
  expirada: "Expirada",
};

export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function lineTotalCents(item: Pick<LineItem, "quantity" | "unitPriceCents">) {
  return Math.round(item.quantity * item.unitPriceCents);
}

export function proposalSubtotalCents(proposal: Pick<Proposal, "items">) {
  return proposal.items.reduce((sum, item) => sum + lineTotalCents(item), 0);
}

export function proposalDiscountCents(proposal: Pick<Proposal, "items" | "discountPercent">) {
  const subtotal = proposalSubtotalCents(proposal);
  const percent = Math.min(100, Math.max(0, proposal.discountPercent));
  return Math.round(subtotal * (percent / 100));
}

export function proposalTotalCents(proposal: Pick<Proposal, "items" | "discountPercent">) {
  return Math.max(0, proposalSubtotalCents(proposal) - proposalDiscountCents(proposal));
}

export function effectiveStatus(proposal: Proposal, today: string): ProposalStatus {
  if (
    proposal.status === "aceita" ||
    proposal.status === "recusada" ||
    proposal.status === "rascunho"
  ) {
    return proposal.status;
  }
  if (proposal.validUntil && proposal.validUntil < today) return "expirada";
  return proposal.status;
}

export function withEffectiveStatus(proposal: Proposal, today: string): Proposal {
  const status = effectiveStatus(proposal, today);
  return status === proposal.status ? proposal : { ...proposal, status };
}

export function clientName(clients: Client[], clientId: string) {
  const client = clients.find((item) => item.id === clientId);
  if (!client) return "Cliente removido";
  return client.company ? `${client.company}` : client.name;
}

export function clientById(clients: Client[], clientId: string) {
  return clients.find((item) => item.id === clientId) ?? null;
}

export type FollowUp = {
  id: string;
  proposalId: string;
  tone: "attention" | "neutral";
  text: string;
};

export function followUps(workspace: Workspace, today: string, now = new Date()): FollowUp[] {
  const items: FollowUp[] = [];

  for (const proposal of workspace.proposals) {
    const status = effectiveStatus(proposal, today);
    const who = clientName(workspace.clients, proposal.clientId);
    const title = proposal.title;

    if (status === "expirada") {
      items.push({
        id: `${proposal.id}-expired`,
        proposalId: proposal.id,
        tone: "neutral",
        text: `${who} deixou “${title}” vencer. Dá para renovar o prazo e reenviar o mesmo link.`,
      });
      continue;
    }

    if (!proposal.validUntil || (status !== "enviada" && status !== "visualizada")) continue;

    const daysLeft = calendarDaysUntil(proposal.validUntil, now);
    if (status === "visualizada") {
      const when = proposal.viewedAt ? relativePast(proposal.viewedAt, now) : "recentemente";
      items.push({
        id: `${proposal.id}-viewed`,
        proposalId: proposal.id,
        tone: "attention",
        text: `${who} abriu “${title}” ${when} e ainda não respondeu.`,
      });
    } else if (daysLeft <= 2) {
      const when =
        daysLeft < 0
          ? "venceu"
          : daysLeft === 0
            ? "vence hoje"
            : daysLeft === 1
              ? "vence amanhã"
              : `vence em ${daysLeft} dias`;
      items.push({
        id: `${proposal.id}-due`,
        proposalId: proposal.id,
        tone: "attention",
        text: `“${title}” para ${who} ${when}. Vale um retorno antes que o link perca a validade.`,
      });
    } else if (proposal.sentAt) {
      const sentDays = -calendarDaysUntil(proposal.sentAt.slice(0, 10), now);
      if (sentDays >= 3) {
        items.push({
          id: `${proposal.id}-silent`,
          proposalId: proposal.id,
          tone: "neutral",
          text: `${who} recebeu “${title}” ${relativePast(proposal.sentAt, now)} e ainda não abriu.`,
        });
      }
    }
  }

  return items.slice(0, 5);
}

export type DashboardStats = {
  openCents: number;
  openCount: number;
  acceptedMonthCents: number;
  acceptedMonthCount: number;
  winRate: number | null;
  decidedCount: number;
};

export function dashboardStats(proposals: Proposal[], today: string, now = new Date()): DashboardStats {
  let openCents = 0;
  let openCount = 0;
  let acceptedMonthCents = 0;
  let acceptedMonthCount = 0;
  let won = 0;
  let decided = 0;

  for (const proposal of proposals) {
    const status = effectiveStatus(proposal, today);
    const total = proposalTotalCents(proposal);
    if (status === "enviada" || status === "visualizada") {
      openCents += total;
      openCount += 1;
    }
    if (status === "aceita" || status === "recusada" || status === "expirada") {
      decided += 1;
      if (status === "aceita") won += 1;
    }
    if (
      status === "aceita" &&
      proposal.respondedAt &&
      sameMonth(proposal.respondedAt, now)
    ) {
      acceptedMonthCents += total;
      acceptedMonthCount += 1;
    }
  }

  return {
    openCents,
    openCount,
    acceptedMonthCents,
    acceptedMonthCount,
    winRate: decided === 0 ? null : Math.round((won / decided) * 100),
    decidedCount: decided,
  };
}

export function pipelineCounts(proposals: Proposal[], today: string) {
  const order: ProposalStatus[] = [
    "rascunho",
    "enviada",
    "visualizada",
    "aceita",
    "recusada",
    "expirada",
  ];
  return order.map((status) => ({
    status,
    label: STATUS_LABEL[status],
    count: proposals.filter((proposal) => effectiveStatus(proposal, today) === status).length,
  }));
}

export function whatsappHref(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(text)}`;
}

export function proposalMessage(input: {
  clientName: string;
  number: string;
  title: string;
  totalCents: number;
  url: string;
  companyName: string;
}) {
  const first = input.clientName.trim().split(/\s+/)[0] || "olá";
  return [
    `Olá, ${first}. Segue a proposta ${input.number} — ${input.title}.`,
    `Valor: ${formatBRL(input.totalCents)}.`,
    input.url,
    `Qualquer ajuste, responda por aqui. ${input.companyName}.`,
  ].join("\n");
}

export function parseMoneyToCents(input: string) {
  const clean = input.trim().replace(/[\s\u00a0]/g, "");
  if (!clean) return null;
  let normalized = clean;
  if (clean.includes(",")) {
    normalized = clean.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(clean)) {
    normalized = clean.replace(/\./g, "");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

export function parseQuantity(input: string) {
  const normalized = input.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0 || value > 10_000) return null;
  return Math.round(value * 100) / 100;
}

export function centsToInput(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
