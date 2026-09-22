import Link from "next/link";
import { formatBRL, dashboardStats } from "@/lib/proposta/present";
import { saoPauloToday } from "@/lib/proposta/dates";
import { createSeed } from "@/lib/proposta/seed";

export function Product() {
  const stats = dashboardStats(createSeed().proposals, saoPauloToday());

  return (
    <section id="produto" className="relative bg-surface-elevated py-24 md:py-32">
      <div id="downloads" className="sr-only" />
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="grid items-end gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-2xl">
            <p className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Produto
            </p>
            <h2 className="font-display text-3xl tracking-tight text-ink md:text-4xl">
              L² Proposta
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              Sistema para prestadores de serviço montarem o orçamento, enviarem um link e
              acompanharem o aceite. A demonstração abre no navegador, com clientes e propostas
              de exemplo — {formatBRL(stats.openCents)} em aberto para você percorrer o fluxo.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/app"
                className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-bright"
              >
                Abrir demonstração
              </Link>
              <Link
                href="/proposta"
                className="rounded-md border border-line bg-surface px-6 py-3 text-sm font-medium text-ink-soft transition-colors hover:border-accent hover:text-accent"
              >
                Ver o produto
              </Link>
            </div>
          </div>
          <ul className="divide-y divide-line border-y border-line">
            {[
              ["Link do cliente", "A proposta abre no celular, com itens, total e Pix."],
              ["Aceite na página", "O cliente aceita ou recusa. O painel registra o nome e o comentário."],
              ["Retorno no prazo", "Quem abriu e não respondeu, e o que vence em dois dias, aparece no painel."],
            ].map(([title, text]) => (
              <li key={title} className="py-5">
                <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-muted">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
