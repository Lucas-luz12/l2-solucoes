import Link from "next/link";
import { Wordmark } from "./Wordmark";

const links = [
  { href: "/acougue", label: "Açougue" },
  { href: "/proposta", label: "Proposta" },
  { href: "/#servicos", label: "Serviços" },
  { href: "/#contato", label: "Contato" },
];

export function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 md:px-8">
        <Link
          href="/"
          className="transition-opacity hover:opacity-80"
          aria-label="L² Soluções — início"
        >
          <Wordmark size="sm" />
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Principal">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-soft/75 transition-colors hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/#contato"
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-bright"
        >
          Falar conosco
        </Link>
      </div>
    </header>
  );
}
