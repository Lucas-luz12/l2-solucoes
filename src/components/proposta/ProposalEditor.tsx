"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { formatDate } from "@/lib/proposta/dates";
import {
  centsToInput,
  clientById,
  formatBRL,
  parseMoneyToCents,
  parseQuantity,
  proposalMessage,
  whatsappHref,
} from "@/lib/proposta/present";
import type { ProposalInput } from "@/lib/proposta/types";
import { useWorkspace } from "./WorkspaceProvider";
import { fieldClass, primaryButtonClass, secondaryButtonClass, StatusPill } from "./ui";

type DraftItem = {
  key: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

type Draft = {
  clientId: string;
  title: string;
  summary: string;
  items: DraftItem[];
  discountPercent: string;
  validityDays: string;
  paymentTerms: string;
  notes: string;
};

function blankItem(): DraftItem {
  return {
    key: crypto.randomUUID(),
    description: "",
    quantity: "1",
    unitPrice: "",
  };
}

function emptyDraft(clientId: string): Draft {
  return {
    clientId,
    title: "",
    summary: "",
    items: [blankItem()],
    discountPercent: "0",
    validityDays: "7",
    paymentTerms: "50% na aprovação e 50% na entrega.",
    notes: "O escopo acima fecha a primeira versão. Itens fora desta lista viram um novo orçamento.",
  };
}

function toInput(draft: Draft): ProposalInput {
  if (!draft.clientId) throw new Error("Escolha um cliente.");
  const title = draft.title.trim();
  if (title.length < 3) throw new Error("Dê um título com pelo menos 3 caracteres.");

  const items = draft.items.map((item, index) => {
    const description = item.description.trim();
    const label = description || `Item ${index + 1}`;
    if (description.length < 2) throw new Error(`Descreva o item ${index + 1}.`);
    const quantity = parseQuantity(item.quantity);
    const unitPriceCents = parseMoneyToCents(item.unitPrice);
    if (quantity == null) throw new Error(`Quantidade inválida em “${label}”. Use 1 ou 1,5.`);
    if (unitPriceCents == null) throw new Error(`Valor inválido em “${label}”. Use 1500 ou 1.500,00.`);
    return { description, quantity, unitPriceCents };
  });

  const discountPercent = Number(draft.discountPercent);
  if (!Number.isInteger(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    throw new Error("O desconto precisa ser um número inteiro de 0 a 100.");
  }
  const validityDays = Number(draft.validityDays);
  if (!Number.isInteger(validityDays) || validityDays < 1 || validityDays > 90) {
    throw new Error("A validade precisa ficar entre 1 e 90 dias.");
  }

  return {
    clientId: draft.clientId,
    title,
    summary: draft.summary.trim(),
    items,
    discountPercent,
    validityDays,
    paymentTerms: draft.paymentTerms.trim(),
    notes: draft.notes.trim(),
  };
}

function liveTotals(draft: Draft) {
  let subtotal = 0;
  for (const item of draft.items) {
    const quantity = parseQuantity(item.quantity);
    const unitPriceCents = parseMoneyToCents(item.unitPrice);
    if (quantity == null || unitPriceCents == null) return null;
    subtotal += Math.round(quantity * unitPriceCents);
  }
  const discountPercent = Number(draft.discountPercent);
  if (!Number.isInteger(discountPercent) || discountPercent < 0 || discountPercent > 100) return null;
  const discount = Math.round((subtotal * discountPercent) / 100);
  return { subtotal, discount, total: subtotal - discount };
}

export function ProposalEditor({ proposalId }: { proposalId: string | null }) {
  const router = useRouter();
  const { workspace, loading, error, saveProposal, sendProposal, duplicateProposal, deleteProposal } =
    useWorkspace();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const proposal = workspace?.proposals.find((item) => item.id === proposalId) ?? null;
  const locked = proposal?.status === "aceita";
  const formKey = proposalId ?? "nova";

  if (workspace && loadedFor !== formKey) {
    setLoadedFor(formKey);
    setMessage(null);
    if (proposalId && !proposal) {
      setDraft(null);
    } else if (proposal) {
      setDraft({
        clientId: proposal.clientId,
        title: proposal.title,
        summary: proposal.summary,
        items: proposal.items.map((item) => ({
          key: item.id,
          description: item.description,
          quantity: String(item.quantity).replace(".", ","),
          unitPrice: centsToInput(item.unitPriceCents),
        })),
        discountPercent: String(proposal.discountPercent),
        validityDays: String(proposal.validityDays),
        paymentTerms: proposal.paymentTerms,
        notes: proposal.notes,
      });
    } else {
      setDraft(emptyDraft(workspace.clients[0]?.id ?? ""));
    }
  }

  const totals = useMemo(() => (draft ? liveTotals(draft) : null), [draft]);
  const client = workspace && draft ? clientById(workspace.clients, draft.clientId) : null;
  const publicUrl =
    proposal && typeof window !== "undefined" ? `${window.location.origin}/p/${proposal.token}` : "";

  function updateItem(key: string, patch: Partial<DraftItem>) {
    if (!draft) return;
    setDraft({
      ...draft,
      items: draft.items.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    });
  }

  async function onSave(event?: FormEvent) {
    event?.preventDefault();
    if (!draft || locked) return null;
    setBusy(true);
    setMessage(null);
    try {
      const id = await saveProposal({ ...toInput(draft), id: proposalId });
      setMessage("Proposta salva.");
      if (!proposalId) router.replace(`/app/propostas/${id}`);
      return id;
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Não foi possível salvar.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function onSend() {
    if (!draft || locked) return;
    setBusy(true);
    setMessage(null);
    try {
      const id = proposalId ?? (await saveProposal({ ...toInput(draft), id: null }));
      if (proposalId) await saveProposal({ ...toInput(draft), id: proposalId });
      await sendProposal(id);
      setMessage(
        proposal && proposal.status !== "rascunho"
          ? "Link reenviado e prazo renovado."
          : "Proposta marcada como enviada. Copie o link ou abra o WhatsApp.",
      );
      if (!proposalId) router.replace(`/app/propostas/${id}`);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Não foi possível enviar.");
    } finally {
      setBusy(false);
    }
  }

  async function onDuplicate() {
    if (!proposalId) return;
    setBusy(true);
    try {
      const id = await duplicateProposal(proposalId);
      router.push(`/app/propostas/${id}`);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Não foi possível duplicar.");
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!proposalId) return;
    if (!window.confirm("Apagar esta proposta?")) return;
    setBusy(true);
    try {
      await deleteProposal(proposalId);
      router.push("/app/propostas");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Não foi possível apagar.");
      setBusy(false);
    }
  }

  async function onCopy() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
    } catch {
      setMessage("Não foi possível copiar. Selecione o link e copie manualmente.");
    }
  }

  if (loading || (workspace && loadedFor !== formKey)) {
    return <p className="text-muted">Carregando proposta…</p>;
  }
  if (error || !workspace) return <p className="text-ink">{error || "Não foi possível abrir a proposta."}</p>;
  if (proposalId && !proposal) {
    return (
      <div>
        <p className="text-ink">Essa proposta não está na demonstração.</p>
        <Link href="/app/propostas" className={`${secondaryButtonClass} mt-4`}>
          Voltar à lista
        </Link>
      </div>
    );
  }
  if (!draft) return null;

  const whatsapp =
    client && proposal && totals
      ? whatsappHref(
          client.phone,
          proposalMessage({
            clientName: client.name,
            number: proposal.number,
            title: proposal.title,
            totalCents: totals.total,
            url: publicUrl,
            companyName: workspace.company.name,
          }),
        )
      : null;

  return (
    <form onSubmit={onSave}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/app/propostas" className="text-sm font-medium text-accent hover:text-accent-bright">
            Todas as propostas
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl tracking-tight text-ink">
              {proposal ? proposal.number : "Nova proposta"}
            </h1>
            {proposal ? <StatusPill status={proposal.status} /> : null}
          </div>
          {proposal?.validUntil ? (
            <p className="mt-2 text-sm text-muted">Válida até {formatDate(proposal.validUntil)}</p>
          ) : (
            <p className="mt-2 text-sm text-muted">Rascunho ainda sem prazo no link do cliente.</p>
          )}
        </div>
      </div>

      {locked ? (
        <p className="mt-6 rounded-md border border-[#1f7a4d]/20 bg-[#e7f5ee] px-4 py-3 text-sm text-[#1f7a4d]">
          {proposal?.responseName || "O cliente"} aceitou
          {proposal?.respondedAt ? ` em ${formatDate(proposal.respondedAt)}` : ""}.
          {proposal?.responseNote ? ` “${proposal.responseNote}”` : ""} Duplique se precisar de outra versão.
        </p>
      ) : null}

      {proposal?.status === "visualizada" && !locked ? (
        <p className="mt-6 rounded-md border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-ink-soft">
          O cliente já abriu este link. Salvar muda o que ele vê na próxima visita.
        </p>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-5">
          <label className="block text-sm font-medium text-ink-soft">
            Cliente
            <select
              required
              disabled={locked}
              value={draft.clientId}
              onChange={(event) => setDraft({ ...draft, clientId: event.target.value })}
              className={`${fieldClass} mt-1.5`}
            >
              <option value="">Selecione</option>
              {workspace.clients.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.company ? `${item.company} — ${item.name}` : item.name}
                </option>
              ))}
            </select>
          </label>
          {workspace.clients.length === 0 ? (
            <p className="text-sm text-muted">
              <Link href="/app/clientes" className="font-medium text-accent">
                Cadastre um cliente
              </Link>{" "}
              antes de fechar a proposta.
            </p>
          ) : null}

          <label className="block text-sm font-medium text-ink-soft">
            Título
            <input
              required
              disabled={locked}
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              className={`${fieldClass} mt-1.5`}
              placeholder="O que você está vendendo, em uma linha"
            />
          </label>

          <label className="block text-sm font-medium text-ink-soft">
            Contexto
            <textarea
              disabled={locked}
              rows={3}
              value={draft.summary}
              onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
              className={`${fieldClass} mt-1.5 resize-y`}
              placeholder="O problema que esta proposta resolve"
            />
          </label>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-medium text-ink-soft">Itens</h2>
              {!locked ? (
                <button
                  type="button"
                  className="text-sm font-medium text-accent"
                  onClick={() => setDraft({ ...draft, items: [...draft.items, blankItem()] })}
                >
                  Adicionar item
                </button>
              ) : null}
            </div>
            <ul className="space-y-3">
              {draft.items.map((item, index) => {
                const quantity = parseQuantity(item.quantity);
                const unit = parseMoneyToCents(item.unitPrice);
                const line = quantity != null && unit != null ? Math.round(quantity * unit) : null;
                return (
                  <li key={item.key} className="rounded-md border border-line bg-white p-3">
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_88px_128px_auto]">
                      <input
                        aria-label={`Descrição do item ${index + 1}`}
                        disabled={locked}
                        value={item.description}
                        onChange={(event) => updateItem(item.key, { description: event.target.value })}
                        className={fieldClass}
                        placeholder="Descrição"
                      />
                      <input
                        aria-label={`Quantidade do item ${index + 1}`}
                        disabled={locked}
                        value={item.quantity}
                        onChange={(event) => updateItem(item.key, { quantity: event.target.value })}
                        className={fieldClass}
                        inputMode="decimal"
                      />
                      <input
                        aria-label={`Valor do item ${index + 1}`}
                        disabled={locked}
                        value={item.unitPrice}
                        onChange={(event) => updateItem(item.key, { unitPrice: event.target.value })}
                        className={fieldClass}
                        inputMode="decimal"
                        placeholder="0,00"
                      />
                      <div className="flex items-center justify-between gap-3 md:justify-end">
                        <span className="text-sm font-medium text-ink">{line == null ? "—" : formatBRL(line)}</span>
                        {!locked && draft.items.length > 1 ? (
                          <button
                            type="button"
                            className="text-sm text-muted hover:text-ink"
                            onClick={() =>
                              setDraft({
                                ...draft,
                                items: draft.items.filter((entry) => entry.key !== item.key),
                              })
                            }
                          >
                            Tirar
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-ink-soft">
              Desconto (%)
              <input
                disabled={locked}
                value={draft.discountPercent}
                onChange={(event) => setDraft({ ...draft, discountPercent: event.target.value })}
                className={`${fieldClass} mt-1.5`}
                inputMode="numeric"
              />
            </label>
            <label className="block text-sm font-medium text-ink-soft">
              Validade ao enviar (dias)
              <input
                disabled={locked}
                value={draft.validityDays}
                onChange={(event) => setDraft({ ...draft, validityDays: event.target.value })}
                className={`${fieldClass} mt-1.5`}
                inputMode="numeric"
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-ink-soft">
            Condição de pagamento
            <textarea
              disabled={locked}
              rows={2}
              value={draft.paymentTerms}
              onChange={(event) => setDraft({ ...draft, paymentTerms: event.target.value })}
              className={`${fieldClass} mt-1.5 resize-y`}
            />
          </label>
          <label className="block text-sm font-medium text-ink-soft">
            Observações
            <textarea
              disabled={locked}
              rows={3}
              value={draft.notes}
              onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
              className={`${fieldClass} mt-1.5 resize-y`}
            />
          </label>
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-6">
          <div className="rounded-md border border-line bg-white p-5">
            <p className="text-sm text-muted">Total</p>
            <p className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
              {totals ? formatBRL(totals.total) : "—"}
            </p>
            <dl className="mt-4 space-y-1 text-sm text-muted">
              <div className="flex justify-between gap-3">
                <dt>Subtotal</dt>
                <dd>{totals ? formatBRL(totals.subtotal) : "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Desconto</dt>
                <dd>{totals ? formatBRL(totals.discount) : "—"}</dd>
              </div>
            </dl>
            {message ? <p className="mt-4 text-sm leading-relaxed text-ink-soft">{message}</p> : null}
            <div className="mt-5 flex flex-col gap-2">
              {!locked ? (
                <button type="submit" className={primaryButtonClass} disabled={busy}>
                  Salvar
                </button>
              ) : null}
              {!locked ? (
                <button type="button" className={secondaryButtonClass} disabled={busy} onClick={onSend}>
                  {proposal && proposal.status !== "rascunho" ? "Reenviar e renovar" : "Marcar como enviada"}
                </button>
              ) : null}
              {proposalId ? (
                <button type="button" className={secondaryButtonClass} disabled={busy} onClick={onDuplicate}>
                  Duplicar
                </button>
              ) : null}
              {proposalId && !locked ? (
                <button type="button" className="py-2 text-sm text-muted hover:text-ink" disabled={busy} onClick={onDelete}>
                  Apagar
                </button>
              ) : null}
            </div>
          </div>

          {proposal ? (
            <div className="rounded-md border border-line bg-white p-5">
              <p className="text-sm font-medium text-ink">Link do cliente</p>
              <p className="mt-1 text-sm text-muted">
                {proposal.status === "rascunho"
                  ? "A prévia abre, mas o cliente só consegue aceitar depois do envio."
                  : "É este endereço que segue no WhatsApp."}
              </p>
              <input readOnly value={publicUrl} className={`${fieldClass} mt-3 text-xs`} aria-label="Link da proposta" />
              <div className="mt-3 flex flex-col gap-2">
                <button type="button" className={secondaryButtonClass} onClick={onCopy}>
                  {copied ? "Link copiado" : "Copiar link"}
                </button>
                <a href={publicUrl} target="_blank" rel="noreferrer" className={secondaryButtonClass}>
                  Abrir página
                </a>
                {whatsapp && proposal.status !== "rascunho" ? (
                  <a href={whatsapp} target="_blank" rel="noreferrer" className={primaryButtonClass}>
                    Abrir no WhatsApp
                  </a>
                ) : null}
                {!client?.phone && proposal.status !== "rascunho" ? (
                  <p className="text-xs text-muted">Cadastre o WhatsApp do cliente para abrir a conversa pronta.</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </form>
  );
}
