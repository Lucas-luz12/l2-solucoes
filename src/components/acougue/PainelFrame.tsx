"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ShopImage } from "./ShopImage";
import { useAcougue } from "./AcougueProvider";

const links = [
  { href: "/acougue/painel", label: "Preparo", exact: true },
  { href: "/acougue/painel/cardapio", label: "Cardápio", exact: false },
  { href: "/acougue/painel/loja", label: "Loja", exact: false },
];

export function PainelFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data } = useAcougue();
  const [copied, setCopied] = useState(false);
  const publicPath = `/acougue/${data.shop.slug}`;
  const empty = data.items.length === 0;

  async function copyLink() {
    const url = `${window.location.origin}${publicPath}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
  }

  async function logout() {
    await fetch("/api/acougue/conta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push("/acougue/entrar");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-surface">
      <header className="no-print border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            {data.shop.logoUrl ? (
              <ShopImage src={data.shop.logoUrl} alt="" className="h-10 w-10 rounded-md object-cover" />
            ) : null}
            <div>
              <Link href="/acougue/painel" className="font-display text-lg font-semibold tracking-tight text-ink">
                L² Reserva
              </Link>
              <p className="text-xs text-muted">{data.shop.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href={publicPath} className="font-medium text-accent hover:text-accent-bright">
              Ver vitrine
            </Link>
            <Link href="/privacidade" className="text-muted hover:text-accent">
              Privacidade
            </Link>
            <button type="button" onClick={logout} className="text-muted hover:text-accent">
              Sair
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 py-8 md:grid-cols-[180px_minmax(0,1fr)] md:px-8">
        <nav className="no-print flex gap-2 overflow-x-auto md:flex-col" aria-label="Painel do açougue">
          {links.map((link) => {
            const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium ${
                  active ? "bg-ink text-white" : "text-ink-soft hover:bg-white hover:text-accent"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="min-w-0">
          <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-white px-4 py-3">
            <p className="text-sm text-ink-soft">
              Link para o cliente: <span className="font-medium text-ink">{publicPath}</span>
            </p>
            <button type="button" onClick={copyLink} className="text-sm font-medium text-accent hover:text-accent-bright">
              {copied ? "Link copiado" : "Copiar link"}
            </button>
          </div>
          {empty ? (
            <p className="no-print mb-6 text-sm leading-relaxed text-muted">
              Comece pela Loja para enviar o logo, cadastre os produtos com foto no Cardápio e envie o link no WhatsApp.
              O cliente abre o link, reserva e retira com o código. Ele não cria conta.
            </p>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
