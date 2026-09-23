"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/proposta/dates";
import {
  formatBRL,
  lineTotalCents,
  proposalDiscountCents,
  proposalSubtotalCents,
  proposalTotalCents,
} from "@/lib/proposta/present";
import type { PublicProposal } from "@/lib/proposta/types";
import { fieldClass, primaryButtonClass, secondaryButtonClass } from "./ui";

export function PublicProposalView({ initial }: { initial: PublicProposal }) {
  const [data, setData] = useState(initial);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initial.proposal.status !== "enviada") return;
    let active = true;
    fetch(`/api/public/${initial.proposal.token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "view" }),
    })
      .then(async (response) => {
        if (!response.ok || !active) return;
        const next = (await response.json()) as PublicProposal;
        setData(next);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [initial.proposal.status, initial.proposal.token]);

  const { company, client, proposal } = data;
  const open = proposal.status === "enviada" || proposal.status === "visualizada";
  const clientLabel = client.company || client.name;

  async function respond(action: "aceita" | "recusada") {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/public/${proposal.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, name, note, privacyAccepted: accepted }),
      });
      const body = (await response.json()) as PublicProposal & { error?: string };
      if (!response.ok) throw new Error(body.error || "Não foi possível registrar a resposta.");
      setData(body);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível registrar a resposta.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface px-4 py-10 text-ink md:py-16">
      <article className="mx-auto max-w-3xl bg-white px-5 py-8 shadow-[0_20px_60px_rgba(26,36,48,0.06)] md:px-10 md:py-12">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-6">
          <div>
            <p className="font-display text-2xl font-semibold tracking-tight">{company.name}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {[company.city, company.document, company.email, company.phone].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-accent">
              Proposta {proposal.number}
            </p>
            <p className="mt-2 text-sm text-muted">Emitida em {formatDate(proposal.sentAt || proposal.createdAt)}</p>
            {proposal.validUntil ? (
              <p className="text-sm text-muted">Válida até {formatDate(proposal.validUntil)}</p>
            ) : null}
          </div>
        </header>

        {proposal.status === "rascunho" ? (
          <p className="no-print mt-6 rounded-md border border-line bg-surface px-4 py-3 text-sm text-muted">
            Prévia de rascunho. O aceite fica disponível depois que a proposta for marcada como enviada.
          </p>
        ) : null}

        <section className="mt-8">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted">Para</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight">{proposal.title}</h1>
          <p className="mt-2 text-ink-soft">
            {clientLabel}
            {client.company ? ` · ${client.name}` : ""}
            {client.city ? ` · ${client.city}` : ""}
          </p>
          {proposal.summary ? (
            <p className="mt-5 whitespace-pre-wrap leading-relaxed text-ink-soft">{proposal.summary}</p>
          ) : null}
        </section>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2 font-medium">Item</th>
                <th className="py-2 text-right font-medium">Qtd.</th>
                <th className="py-2 text-right font-medium">Unitário</th>
                <th className="py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {proposal.items.map((item) => (
                <tr key={item.id} className="border-b border-line/80">
                  <td className="py-3 pr-4 text-ink">{item.description}</td>
                  <td className="py-3 text-right text-muted">
                    {item.quantity.toLocaleString("pt-BR")}
                  </td>
                  <td className="py-3 text-right text-muted">{formatBRL(item.unitPriceCents)}</td>
                  <td className="py-3 text-right font-medium text-ink">{formatBRL(lineTotalCents(item))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="mt-6 ml-auto w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between gap-4 text-muted">
            <dt>Subtotal</dt>
            <dd>{formatBRL(proposalSubtotalCents(proposal))}</dd>
          </div>
          {proposal.discountPercent > 0 ? (
            <div className="flex justify-between gap-4 text-muted">
              <dt>Desconto ({proposal.discountPercent}%)</dt>
              <dd>− {formatBRL(proposalDiscountCents(proposal))}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4 border-t border-line pt-3 font-display text-2xl font-semibold text-ink">
            <dt>Total</dt>
            <dd>{formatBRL(proposalTotalCents(proposal))}</dd>
          </div>
        </dl>

        <section className="mt-10 grid gap-6 border-t border-line pt-6 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-muted">Pagamento</h2>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed text-ink-soft">
              {proposal.paymentTerms || "A combinar."}
            </p>
            {company.pix ? <p className="mt-3 text-sm text-ink">Pix: {company.pix}</p> : null}
          </div>
          <div>
            <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-muted">Observações</h2>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed text-ink-soft">
              {proposal.notes || "Sem observações adicionais."}
            </p>
          </div>
        </section>

        <section className="no-print mt-10 border-t border-line pt-6">
          {proposal.status === "aceita" ? (
            <div className="rounded-md border border-[#1f7a4d]/20 bg-[#e7f5ee] px-4 py-4">
              <p className="font-display text-xl font-semibold text-[#1f7a4d]">Proposta aceita</p>
              <p className="mt-2 text-sm text-ink-soft">
                {proposal.responseName} confirmou
                {proposal.respondedAt ? ` em ${formatDate(proposal.respondedAt)}` : ""}.
                {proposal.responseNote ? ` ${proposal.responseNote}` : ""}
              </p>
            </div>
          ) : null}
          {proposal.status === "recusada" ? (
            <div className="rounded-md border border-[#9a4d45]/20 bg-[#f8ecea] px-4 py-4">
              <p className="font-display text-xl font-semibold text-[#9a4d45]">Proposta recusada</p>
              <p className="mt-2 text-sm text-ink-soft">
                {proposal.responseName} registrou a recusa
                {proposal.responseNote ? `: ${proposal.responseNote}` : "."}
              </p>
            </div>
          ) : null}
          {proposal.status === "expirada" ? (
            <p className="rounded-md border border-line bg-surface px-4 py-4 text-ink-soft">
              O prazo desta proposta encerrou. Peça um link atualizado para {company.name}.
            </p>
          ) : null}
          {open ? (
            <div>
              <h2 className="font-display text-xl font-semibold">Sua resposta</h2>
              <p className="mt-2 text-sm text-muted">
                Aceitar registra o sim para {company.name}. Não é uma assinatura com validade jurídica.
              </p>
              <label className="mt-4 block text-sm font-medium text-ink-soft">
                Seu nome
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={`${fieldClass} mt-1.5`}
                  placeholder="Quem está respondendo"
                />
              </label>
              <label className="mt-4 block text-sm font-medium text-ink-soft">
                Comentário
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  className={`${fieldClass} mt-1.5 resize-y`}
                  placeholder="Opcional. Um ajuste de prazo, um sim com condição."
                />
              </label>
              <label className="mt-4 flex items-start gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={accepted}
                  onChange={(event) => setAccepted(event.target.checked)}
                />
                <span>
                  Concordo em registrar meu nome nesta resposta para {company.name}.{" "}
                  <Link href="/privacidade" className="font-medium text-accent">
                    Aviso de privacidade
                  </Link>
                </span>
              </label>
              {error ? <p className="mt-3 text-sm text-[#9a4d45]">{error}</p> : null}
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className={primaryButtonClass}
                  disabled={busy || !accepted}
                  onClick={() => respond("aceita")}
                >
                  Aceitar proposta
                </button>
                <button
                  type="button"
                  className={secondaryButtonClass}
                  disabled={busy || !accepted}
                  onClick={() => respond("recusada")}
                >
                  Recusar
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs text-muted">
          <p>
            {company.site ? company.site.replace(/^https?:\/\//, "") : company.name}
          </p>
          <button type="button" className="no-print font-medium text-accent" onClick={() => window.print()}>
            Imprimir ou salvar PDF
          </button>
        </footer>
      </article>
    </div>
  );
}
