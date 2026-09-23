"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/acougue/demo";
import { fieldClass, primaryButtonClass } from "@/components/proposta/ui";

async function submitAccount(body: Record<string, string | boolean>) {
  const response = await fetch("/api/acougue/conta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(payload.error || "Não foi possível entrar.");
}

export function LoginForm() {
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
      await submitAccount({ action: "login", email, password });
      router.push("/acougue/painel");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível entrar.");
      setBusy(false);
    }
  }

  return (
    <AccountShell
      title="Entrar no açougue"
      lead="A conta é do açougue. O cliente não se cadastra: ele só abre o link da vitrine."
    >
      <form onSubmit={onSubmit} className="space-y-4">
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
      <p className="mt-3 text-sm text-ink-soft">
        Ainda sem conta?{" "}
        <Link href="/acougue/criar" className="font-medium text-accent hover:text-accent-bright">
          Criar a conta do açougue
        </Link>
      </p>
    </AccountShell>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [ownerName, setOwnerName] = useState("");
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await submitAccount({ action: "register", ownerName, shopName, email, password, privacyAccepted: accepted });
      router.push("/acougue/painel");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível criar a conta.");
      setBusy(false);
    }
  }

  return (
    <AccountShell
      title="Criar a conta do açougue"
      lead="Você entra no painel, sobe o logo, cadastra os produtos com foto e copia o link. O cliente reserva nesse link com nome e WhatsApp."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-ink-soft">
          Seu nome
          <input
            required
            value={ownerName}
            onChange={(event) => setOwnerName(event.target.value)}
            className={`${fieldClass} mt-1.5`}
          />
        </label>
        <label className="block text-sm font-medium text-ink-soft">
          Nome do açougue
          <input
            required
            value={shopName}
            onChange={(event) => setShopName(event.target.value)}
            className={`${fieldClass} mt-1.5`}
            placeholder="Açougue da Vila"
          />
        </label>
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
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={`${fieldClass} mt-1.5`}
          />
        </label>
        <label className="flex items-start gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            className="mt-1"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            required
          />
          <span>
            Concordo com o{" "}
            <Link href="/privacidade" className="font-medium text-accent hover:text-accent-bright">
              aviso de privacidade
            </Link>
            . A conta guarda e-mail e senha para entrar no painel. Os dados de quem reserva ficam com o açougue.
          </span>
        </label>
        {error ? <p className="text-sm text-[#9a4d45]">{error}</p> : null}
        <button type="submit" className={`${primaryButtonClass} w-full`} disabled={busy || !accepted}>
          Criar conta e abrir o painel
        </button>
      </form>
      <p className="mt-6 text-sm text-ink-soft">
        Já tem conta?{" "}
        <Link href="/acougue/entrar" className="font-medium text-accent hover:text-accent-bright">
          Entrar
        </Link>
      </p>
    </AccountShell>
  );
}

function AccountShell({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface px-4 py-12">
      <div className="mx-auto max-w-md rounded-md border border-line bg-white px-6 py-8">
        <Link href="/acougue" className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">
          L² Reserva
        </Link>
        <h1 className="mt-3 font-display text-3xl tracking-tight text-ink">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{lead}</p>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
