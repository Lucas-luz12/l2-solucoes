import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/proposta/dates";
import {
  formatBRL,
  formatQty,
  reservationMessage,
  reservationTotalCents,
  STATUS_LABEL,
  whatsappHref,
} from "@/lib/acougue/present";
import { getReservationByCode, StoreError } from "@/lib/acougue/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  return { title: `Reserva ${code.toUpperCase()} · L² Reserva` };
}

export default async function ReservationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  let result;
  try {
    result = await getReservationByCode(code);
  } catch (error) {
    if (error instanceof StoreError && error.status === 404) notFound();
    throw error;
  }

  const { shop, reservation } = result;
  const total = reservationTotalCents(reservation);
  const message = reservationMessage({
    shopName: shop.name,
    code: reservation.code,
    customerName: reservation.customerName,
    pickupDate: reservation.pickupDate,
    slot: reservation.slot,
    lines: reservation.items.map((item) => `${formatQty(item.quantity, item.unit)} ${item.name}`),
    totalCents: total,
  });
  const whatsapp = whatsappHref(shop.whatsapp, message);

  return (
    <div className="min-h-screen bg-surface px-4 py-12">
      <article className="mx-auto max-w-xl rounded-md border border-line bg-white px-6 py-8">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">
          {shop.name}
        </p>
        <h1 className="mt-3 font-display text-3xl tracking-tight text-ink">Reserva {reservation.code}</h1>
        <p className="mt-2 text-lg text-accent">{STATUS_LABEL[reservation.status]}</p>
        <p className="mt-4 text-ink-soft">
          {reservation.customerName} retira em {formatDate(reservation.pickupDate)}, {reservation.slot}.
        </p>
        <ul className="mt-6 divide-y divide-line border-y border-line text-sm">
          {reservation.items.map((item) => (
            <li key={item.itemId} className="flex justify-between gap-4 py-3">
              <span>
                {formatQty(item.quantity, item.unit)} {item.name}
              </span>
              <span>{formatBRL(Math.round(item.quantity * item.priceCents))}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 font-display text-2xl font-semibold text-ink">{formatBRL(total)}</p>
        {reservation.notes ? <p className="mt-3 text-sm text-muted">Obs.: {reservation.notes}</p> : null}
        <p className="mt-4 text-sm leading-relaxed text-muted">
          {shop.address}, {shop.city}. {shop.pickupNote}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {whatsapp ? (
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-bright"
            >
              Avisar no WhatsApp
            </a>
          ) : null}
          <Link
            href="/acougue"
            className="inline-flex rounded-md border border-line px-4 py-2.5 text-sm font-medium text-ink-soft hover:border-accent hover:text-accent"
          >
            Voltar à vitrine
          </Link>
        </div>
      </article>
    </div>
  );
}
