"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useWorkspace } from "./WorkspaceProvider";

const links = [
  { href: "/app", label: "Painel", exact: true },
  { href: "/app/propostas", label: "Propostas", exact: false },
  { href: "/app/clientes", label: "Clientes", exact: false },
  { href: "/app/ajustes", label: "Empresa", exact: false },
];

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { workspace } = useWorkspace();

  async function logout() {
    await fetch("/api/proposta/conta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push("/app/entrar");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-surface">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div>
            <Link href="/app" className="font-display text-lg font-semibold tracking-tight text-ink">
              L² Proposta
            </Link>
            <p className="text-xs text-muted">{workspace?.company.name ?? "Demonstração"}</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/proposta" className="text-muted transition-colors hover:text-accent">
              O produto
            </Link>
            <Link href="/privacidade" className="text-muted transition-colors hover:text-accent">
              Privacidade
            </Link>
            <button type="button" onClick={logout} className="font-medium text-ink-soft hover:text-accent">
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-accent/20 bg-accent/10">
        <p className="mx-auto max-w-6xl px-4 py-2.5 text-sm text-ink-soft md:px-8">
          Demonstração com pessoas fictícias. Os dados dos clientes ficam nesta conta.{" "}
          <Link href="/app/ajustes" className="font-medium text-accent hover:text-accent-bright">
            Restaurar em Empresa
          </Link>
          .
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 py-8 md:grid-cols-[180px_minmax(0,1fr)] md:px-8">
        <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible" aria-label="Painel">
          {links.map((link) => {
            const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
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
