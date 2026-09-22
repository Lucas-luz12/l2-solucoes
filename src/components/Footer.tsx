import Link from "next/link";
import { Wordmark } from "./Wordmark";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-surface-elevated">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <Wordmark size="sm" />
          <p className="mt-3 text-sm text-muted">
            Tecnologia · Processos · Resultados
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-muted md:items-end">
          <Link href="/acougue" className="font-medium text-accent hover:text-accent-bright">
            L² Reserva
          </Link>
          <Link href="/proposta" className="hover:text-accent">
            L² Proposta
          </Link>
          <p>© {year} L² Soluções. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
