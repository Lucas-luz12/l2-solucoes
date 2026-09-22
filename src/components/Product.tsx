import Link from "next/link";
import { dayStats, formatQty } from "@/lib/acougue/present";
import { createSeed } from "@/lib/acougue/seed";
import { addCalendarDays, saoPauloToday } from "@/lib/proposta/dates";

export function Product() {
  const today = saoPauloToday();
  const seed = createSeed();
  const stats = dayStats(seed.reservations, today);
  const tomorrow = dayStats(seed.reservations, addCalendarDays(today, 1));

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
              L² Reserva para açougue
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              A promoção sai do WhatsApp e do papel. O cliente escolhe o kit, marca a retirada,
              e o açougue vê quantas bandejas montar antes de abrir o balcão. Na demonstração de
              hoje já entram {stats.kits} kits e {formatQty(stats.kilos, "kg")} de corte.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/acougue"
                className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-bright"
              >
                Ver a vitrine
              </Link>
              <Link
                href="/acougue/painel"
                className="rounded-md border border-line bg-surface px-6 py-3 text-sm font-medium text-ink-soft transition-colors hover:border-accent hover:text-accent"
              >
                Abrir o painel
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted">
              Amanhã a fila de exemplo tem {tomorrow.kits} kits. Também seguimos com o{" "}
              <Link href="/proposta" className="font-medium text-accent hover:text-accent-bright">
                L² Proposta
              </Link>
              .
            </p>
          </div>
          <ul className="divide-y divide-line border-y border-line">
            {[
              ["Vitrine", "Kits em promoção e cortes por quilo, com o que ainda cabe no dia."],
              ["Reserva", "Nome, WhatsApp e horário de retirada. O cliente leva um código."],
              ["Preparo", "A soma do dia: quantos kits montar, quantos quilos cortar e quem busca em cada horário."],
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
