"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { Client } from "@/lib/proposta/types";
import { useWorkspace } from "./WorkspaceProvider";
import { fieldClass, primaryButtonClass, secondaryButtonClass } from "./ui";

const emptyForm = {
  id: "",
  name: "",
  company: "",
  email: "",
  phone: "",
  city: "",
};

export function ClientsView() {
  const { workspace, loading, error, saveClient, deleteClient } = useWorkspace();
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const clients = workspace?.clients ?? [];
    const term = query.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((client) =>
      [client.name, client.company, client.email, client.city, client.phone]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [query, workspace]);

  function edit(client: Client) {
    setMessage(null);
    setForm({
      id: client.id,
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      city: client.city,
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await saveClient({
        id: form.id || null,
        name: form.name,
        company: form.company,
        email: form.email,
        phone: form.phone,
        city: form.city,
      });
      setMessage(form.id ? "Cliente atualizado." : "Cliente cadastrado.");
      if (!form.id) setForm(emptyForm);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!form.id) return;
    if (!window.confirm("Apagar este cliente e as propostas ligadas a ele?")) return;
    setBusy(true);
    setMessage(null);
    try {
      await deleteClient(form.id);
      setForm(emptyForm);
      setMessage("Cliente apagado.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Não foi possível apagar.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-muted">Carregando clientes…</p>;
  if (error || !workspace) return <p className="text-ink">{error || "Não foi possível abrir os clientes."}</p>;

  return (
    <div>
      <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">Clientes</p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink">Quem recebe a proposta</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Cadastre só o que a proposta precisa. O link público mostra nome e cidade, e esconde e-mail e telefone. Apagar o cliente também apaga as propostas ligadas a ele.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome, empresa ou cidade"
            className={fieldClass}
            aria-label="Buscar clientes"
          />
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {visible.length === 0 ? (
              <li className="py-6 text-muted">Nenhum cliente com esse filtro.</li>
            ) : (
              visible.map((client) => (
                <li key={client.id}>
                  <button
                    type="button"
                    onClick={() => edit(client)}
                    className={`flex w-full flex-col items-start gap-1 py-4 text-left transition-colors hover:text-accent ${
                      form.id === client.id ? "text-accent" : "text-ink"
                    }`}
                  >
                    <span className="font-medium">{client.company || client.name}</span>
                    <span className="text-sm text-muted">
                      {client.name}
                      {client.city ? ` · ${client.city}` : ""}
                      {client.phone ? ` · ${client.phone}` : ""}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        <form onSubmit={onSubmit} className="h-fit space-y-4 rounded-md border border-line bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-ink">
              {form.id ? "Editar cliente" : "Novo cliente"}
            </h2>
            {form.id ? (
              <button
                type="button"
                className="text-sm font-medium text-accent"
                onClick={() => {
                  setForm(emptyForm);
                  setMessage(null);
                }}
              >
                Limpar
              </button>
            ) : null}
          </div>
          <label className="block text-sm font-medium text-ink-soft">
            Contato
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className={`${fieldClass} mt-1.5`}
              placeholder="Nome de quem decide"
            />
          </label>
          <label className="block text-sm font-medium text-ink-soft">
            Empresa
            <input
              value={form.company}
              onChange={(event) => setForm({ ...form, company: event.target.value })}
              className={`${fieldClass} mt-1.5`}
              placeholder="Nome fantasia"
            />
          </label>
          <label className="block text-sm font-medium text-ink-soft">
            E-mail
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className={`${fieldClass} mt-1.5`}
              placeholder="contato@empresa.com"
            />
          </label>
          <label className="block text-sm font-medium text-ink-soft">
            WhatsApp
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              className={`${fieldClass} mt-1.5`}
              placeholder="(11) 90000-0000"
            />
          </label>
          <label className="block text-sm font-medium text-ink-soft">
            Cidade
            <input
              value={form.city}
              onChange={(event) => setForm({ ...form, city: event.target.value })}
              className={`${fieldClass} mt-1.5`}
              placeholder="Cidade, UF"
            />
          </label>
          {message ? <p className="text-sm text-ink-soft">{message}</p> : null}
          <div className="flex flex-wrap gap-3">
            <button type="submit" className={primaryButtonClass} disabled={busy}>
              Salvar cliente
            </button>
            {form.id ? (
              <button type="button" className={secondaryButtonClass} disabled={busy} onClick={onDelete}>
                Apagar
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
