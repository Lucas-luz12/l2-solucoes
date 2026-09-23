"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/proposta/demo";
import { fieldClass, primaryButtonClass } from "./ui";

export function OperatorLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/proposta/conta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Não foi possível entrar.");
      router.push("/app");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível entrar.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface px-4 py-12">
      <div className="mx-auto max-w-md rounded-md border border-line bg-white px-6 py-8">
        <Link href="/proposta" className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">
          L² Proposta
        </Link>
        <h1 className="mt-3 font-display text-3xl tracking-tight text-ink">Entrar na empresa</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          O painel guarda nome, e-mail e telefone dos clientes. Só entra quem tem a senha desta conta.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block text-sm font-medium text-ink-soft">
            E-mail
            <input
              required
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={`${fieldClass} mt-1.5`}
            />
          </label>
          <label className="block text-sm font-medium text-ink-soft">
            Senha
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`${fieldClass} mt-1.5`}
            />
          </label>
          {error ? <p className="text-sm text-[#9a4d45]">{error}</p> : null}
          <button type="submit" className={`${primaryButtonClass} w-full`} disabled={busy}>
            Entrar no painel
          </button>
        </form>
        <p className="mt-6 text-sm leading-relaxed text-muted">
          Demonstração: {DEMO_EMAIL} · senha {DEMO_PASSWORD}
        </p>
        <p className="mt-3 text-sm">
          <Link href="/privacidade" className="font-medium text-accent hover:text-accent-bright">
            Aviso de privacidade
          </Link>
        </p>
      </div>
    </div>
  );
}
