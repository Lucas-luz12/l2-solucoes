"use client";

import { useState, type FormEvent } from "react";
import type { Company } from "@/lib/proposta/types";
import { useWorkspace } from "./WorkspaceProvider";
import { fieldClass, primaryButtonClass, secondaryButtonClass } from "./ui";

export function SettingsView() {
  const { workspace, loading, error, saveCompany, resetDemo } = useWorkspace();
  const [form, setForm] = useState<Company | null>(workspace?.company ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading || (!form && !error)) return <p className="text-muted">Carregando a empresa…</p>;
  if (error || !workspace || !form) {
    return <p className="text-ink">{error || "Não foi possível abrir os dados."}</p>;
  }

  function update(patch: Partial<Company>) {
    setForm((current) => (current ? { ...current, ...patch } : current));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    setBusy(true);
    setMessage(null);
    try {
      await saveCompany(form);
      setMessage("Dados da empresa salvos. Eles aparecem na página que o cliente abre.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    if (!window.confirm("Isso apaga as alterações desta demonstração e volta aos dados de exemplo.")) return;
    setBusy(true);
    setMessage(null);
    try {
      const next = await resetDemo();
      setForm(next.company);
      setMessage("Demonstração restaurada.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Não foi possível restaurar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl">
      <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">Empresa</p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink">O que o cliente vê no topo</h1>
      <p className="mt-2 text-muted">
        Nome, cidade e Pix saem na proposta. O CNPJ desta demonstração é ilustrativo.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm font-medium text-ink-soft">
          Nome
          <input
            required
            value={form.name}
            onChange={(event) => update({ name: event.target.value })}
            className={`${fieldClass} mt-1.5`}
          />
        </label>
        <label className="block text-sm font-medium text-ink-soft">
          CNPJ
          <input
            value={form.document}
            onChange={(event) => update({ document: event.target.value })}
            className={`${fieldClass} mt-1.5`}
          />
        </label>
        <label className="block text-sm font-medium text-ink-soft">
          E-mail
          <input
            type="email"
            value={form.email}
            onChange={(event) => update({ email: event.target.value })}
            className={`${fieldClass} mt-1.5`}
          />
        </label>
        <label className="block text-sm font-medium text-ink-soft">
          Telefone
          <input
            value={form.phone}
            onChange={(event) => update({ phone: event.target.value })}
            className={`${fieldClass} mt-1.5`}
          />
        </label>
        <label className="block text-sm font-medium text-ink-soft">
          Cidade
          <input
            value={form.city}
            onChange={(event) => update({ city: event.target.value })}
            className={`${fieldClass} mt-1.5`}
          />
        </label>
        <label className="block text-sm font-medium text-ink-soft">
          Pix
          <input
            value={form.pix}
            onChange={(event) => update({ pix: event.target.value })}
            className={`${fieldClass} mt-1.5`}
          />
        </label>
        <label className="block text-sm font-medium text-ink-soft">
          Site
          <input
            value={form.site}
            onChange={(event) => update({ site: event.target.value })}
            className={`${fieldClass} mt-1.5`}
          />
        </label>
        {message ? <p className="text-sm text-ink-soft">{message}</p> : null}
        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" className={primaryButtonClass} disabled={busy}>
            Salvar empresa
          </button>
          <button type="button" className={secondaryButtonClass} disabled={busy} onClick={onReset}>
            Restaurar demonstração
          </button>
        </div>
      </form>
    </div>
  );
}
