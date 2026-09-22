"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAcougue } from "./AcougueProvider";

const links = [
  { href: "/acougue/painel", label: "Preparo", exact: true },
  { href: "/acougue/painel/cardapio", label: "Cardápio", exact: false },
  { href: "/acougue/painel/loja", label: "Loja", exact: false },
];

export function PainelFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data } = useAcougue();

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-surface">
      <header className="no-print border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div>
            <Link href="/acougue/painel" className="font-display text-lg font-semibold tracking-tight text-ink">
              L² Reserva
            </Link>
            <p className="text-xs text-muted">{data.shop.name}</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/acougue" className="font-medium text-accent hover:text-accent-bright">
              Ver vitrine
            </Link>
            <Link href="/" className="text-muted hover:text-accent">
              Site
            </Link>
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
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
