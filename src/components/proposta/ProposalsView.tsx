"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDate, saoPauloToday } from "@/lib/proposta/dates";
import { clientName, formatBRL, proposalTotalCents, withEffectiveStatus } from "@/lib/proposta/present";
import type { ProposalStatus } from "@/lib/proposta/types";
import { useWorkspace } from "./WorkspaceProvider";
import { fieldClass, primaryButtonClass, StatusPill } from "./ui";

const filters: { id: "todas" | "abertas" | "aceitas" | "perdidas" | "rascunhos"; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "abertas", label: "Em aberto" },
  { id: "aceitas", label: "Aceitas" },
  { id: "perdidas", label: "Perdidas" },
  { id: "rascunhos", label: "Rascunhos" },
];

function matches(status: ProposalStatus, filter: (typeof filters)[number]["id"]) {
  if (filter === "todas") return true;
  if (filter === "abertas") return status === "enviada" || status === "visualizada";
  if (filter === "aceitas") return status === "aceita";
  if (filter === "perdidas") return status === "recusada" || status === "expirada";
  return status === "rascunho";
}

export function ProposalsView() {
  const { workspace, loading, error } = useWorkspace();
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("todas");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    if (!workspace) return [];
    const term = query.trim().toLowerCase();
    const today = saoPauloToday();
    return workspace.proposals.map((proposal) => withEffectiveStatus(proposal, today))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .filter((proposal) => matches(proposal.status, filter))
      .filter((proposal) => {
        if (!term) return true;
        const who = clientName(workspace.clients, proposal.clientId);
        return `${proposal.number} ${proposal.title} ${who}`.toLowerCase().includes(term);
      });
  }, [filter, query, workspace]);

  if (loading) return <p className="text-muted">Carregando propostas…</p>;
  if (error || !workspace) return <p className="text-ink">{error || "Não foi possível abrir as propostas."}</p>;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Propostas
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-tight text-ink">O que você colocou na mesa</h1>
        </div>
        <Link href="/app/propostas/nova" className={primaryButtonClass}>
          Nova proposta
        </Link>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar propostas">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              onClick={() => setFilter(item.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === item.id ? "bg-ink text-white" : "bg-white text-ink-soft hover:text-accent"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar número, cliente ou título"
          aria-label="Buscar propostas"
          className={`${fieldClass} sm:max-w-xs`}
        />
      </div>

      <ul className="mt-6 divide-y divide-line border-y border-line">
        {rows.length === 0 ? (
          <li className="py-8 text-muted">Nenhuma proposta nesse recorte.</li>
        ) : (
          rows.map((proposal) => (
            <li key={proposal.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/app/propostas/${proposal.id}`}
                    className="font-medium text-ink hover:text-accent"
                  >
                    {proposal.title}
                  </Link>
                  <StatusPill status={proposal.status} />
                </div>
                <p className="mt-1 text-sm text-muted">
                  {proposal.number} · {clientName(workspace.clients, proposal.clientId)} · atualizada em{" "}
                  {formatDate(proposal.updatedAt)}
                </p>
              </div>
              <p className="font-display text-lg font-semibold text-ink">
                {formatBRL(proposalTotalCents(proposal))}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
