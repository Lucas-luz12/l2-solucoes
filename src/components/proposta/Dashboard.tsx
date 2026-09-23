"use client";

import Link from "next/link";
import { monthLabel, saoPauloToday, formatDate } from "@/lib/proposta/dates";
import {
  clientName,
  dashboardStats,
  followUps,
  formatBRL,
  pipelineCounts,
  proposalTotalCents,
  withEffectiveStatus,
} from "@/lib/proposta/present";
import { useWorkspace } from "./WorkspaceProvider";
import { primaryButtonClass, StatusPill } from "./ui";

export function Dashboard() {
  const { workspace, loading, error, refresh } = useWorkspace();

  if (loading) return <p className="text-muted">Carregando a operação…</p>;
  if (error || !workspace) {
    return (
      <div className="rounded-md border border-line bg-white p-6">
        <p className="text-ink">{error || "Não foi possível abrir o painel."}</p>
        <button type="button" className={`${primaryButtonClass} mt-4`} onClick={() => refresh()}>
          Tentar de novo
        </button>
      </div>
    );
  }

  const today = saoPauloToday();
  const proposals = workspace.proposals.map((proposal) => withEffectiveStatus(proposal, today));
  const stats = dashboardStats(proposals, today);
  const reminders = followUps({ ...workspace, proposals }, today);
  const pipeline = pipelineCounts(proposals, today);
  const maxCount = Math.max(1, ...pipeline.map((item) => item.count));
  const recent = [...proposals]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  const cards = [
    {
      label: "Em aberto",
      value: formatBRL(stats.openCents),
      detail: stats.openCount === 1 ? "1 proposta com o cliente" : `${stats.openCount} propostas com o cliente`,
    },
    {
      label: "Aceitas no mês",
      value: formatBRL(stats.acceptedMonthCents),
      detail:
        stats.acceptedMonthCount === 1
          ? "1 proposta aceita"
          : `${stats.acceptedMonthCount} propostas aceitas`,
    },
    {
      label: "Taxa de fechamento",
      value: stats.winRate === null ? "—" : `${stats.winRate}%`,
      detail:
        stats.decidedCount === 0
          ? "Ainda não há proposta decidida"
          : `${stats.decidedCount} decididas, entre aceitas, recusas e vencidas`,
    },
    {
      label: "Para retomar",
      value: String(reminders.length),
      detail: reminders.length === 0 ? "Nada parado agora" : "Pedem um retorno",
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Painel
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-tight text-ink">O que está em jogo</h1>
          <p className="mt-2 text-muted">{monthLabel()}</p>
        </div>
        <Link href="/app/propostas/nova" className={primaryButtonClass}>
          Nova proposta
        </Link>
      </div>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <li key={card.label} className="rounded-md border border-line bg-white px-4 py-5">
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">{card.value}</p>
            <p className="mt-2 text-sm text-muted">{card.detail}</p>
          </li>
        ))}
      </ul>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section>
          <h2 className="font-display text-xl font-semibold text-ink">Para retomar hoje</h2>
          {reminders.length === 0 ? (
            <p className="mt-4 text-muted">
              Nada parado. As propostas enviadas estão dentro do prazo e sem abertura sem resposta.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {reminders.map((item) => (
                <li key={item.id} className="py-4">
                  <p className="leading-relaxed text-ink-soft">{item.text}</p>
                  <Link
                    href={`/app/propostas/${item.proposalId}`}
                    className="mt-2 inline-block text-sm font-medium text-accent hover:text-accent-bright"
                  >
                    Abrir proposta
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-md border border-line bg-white p-5">
          <h2 className="font-display text-xl font-semibold text-ink">Funil</h2>
          <ul className="mt-5 space-y-3">
            {pipeline.map((item) => (
              <li key={item.status}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="text-ink-soft">{item.label}</span>
                  <span className="font-medium text-ink">{item.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface">
                  <div
                    className="h-1.5 rounded-full bg-accent"
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-12">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-xl font-semibold text-ink">Movimentação recente</h2>
          <Link href="/app/propostas" className="text-sm font-medium text-accent hover:text-accent-bright">
            Ver todas
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {recent.map((proposal) => (
            <li key={proposal.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
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
                  {proposal.number} · {clientName(workspace.clients, proposal.clientId)} ·{" "}
                  {formatDate(proposal.updatedAt)}
                </p>
              </div>
              <p className="font-display text-lg font-semibold text-ink">
                {formatBRL(proposalTotalCents(proposal))}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
