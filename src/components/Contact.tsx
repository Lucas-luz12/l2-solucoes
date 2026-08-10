"use client";

import { FormEvent, useState } from "react";

const CONTACT_EMAIL = "contato@l2solucoes.com.br";

export function Contact() {
  const [sending, setSending] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const nome = String(data.get("nome") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const mensagem = String(data.get("mensagem") ?? "").trim();

    const subject = encodeURIComponent(`Contato pelo site — ${nome}`);
    const body = encodeURIComponent(
      `Nome: ${nome}\nE-mail: ${email}\n\nMensagem:\n${mensagem}`,
    );

    setSending(true);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    window.setTimeout(() => setSending(false), 1500);
  }

  return (
    <section id="contato" className="bg-surface py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="grid items-end gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Contato
            </p>
            <h2 className="font-display text-3xl tracking-tight text-ink md:text-5xl">
              Vamos falar do seu próximo sistema
            </h2>
            <p className="mt-5 max-w-lg text-lg text-muted">
              Conte o desafio em poucas linhas. Respondemos com uma leitura
              honesta do que faz sentido construir.
            </p>
            <p className="mt-6 text-sm text-muted">
              E-mail:{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-accent transition-colors hover:text-accent-bright"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="nome" className="mb-2 block text-sm font-medium text-ink-soft">
                Nome
              </label>
              <input
                id="nome"
                name="nome"
                required
                className="w-full rounded-md border border-line bg-surface-elevated px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink-soft">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-md border border-line bg-surface-elevated px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent"
                placeholder="voce@empresa.com"
              />
            </div>
            <div>
              <label htmlFor="mensagem" className="mb-2 block text-sm font-medium text-ink-soft">
                Mensagem
              </label>
              <textarea
                id="mensagem"
                name="mensagem"
                required
                rows={4}
                className="w-full resize-y rounded-md border border-line bg-surface-elevated px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent"
                placeholder="O que você precisa construir?"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-bright disabled:opacity-70 sm:w-auto"
            >
              {sending ? "Abrindo e-mail…" : "Enviar mensagem"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
