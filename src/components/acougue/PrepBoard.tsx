"use client";

import { useMemo, useState } from "react";
import { formatDate, saoPauloToday } from "@/lib/proposta/dates";
import {
  dayStats,
  formatBRL,
  formatQty,
  pickupLabel,
  prepLines,
  reservationTotalCents,
  STATUS_LABEL,
  upcomingDates,
  whatsappHref,
} from "@/lib/acougue/present";
import type { Reservation, ReservationStatus } from "@/lib/acougue/types";
import { useAcougue } from "./AcougueProvider";
import { secondaryButtonClass } from "@/components/proposta/ui";

const NEXT_STATUS: Partial<Record<ReservationStatus, { status: ReservationStatus; label: string }>> = {
  reservada: { status: "separada", label: "Separar" },
  separada: { status: "pronta", label: "Marcar pronta" },
  pronta: { status: "retirada", label: "Cliente retirou" },
};

export function PrepBoard() {
  const { data, setStatus } = useAcougue();
  const today = saoPauloToday();
  const dates = upcomingDates(7, today);
  const [date, setDate] = useState(today);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lines = useMemo(
    () => prepLines(data.reservations, data.items, date),
    [data.items, data.reservations, date],
  );
  const stats = dayStats(data.reservations, date);
  const reservations = data.reservations
    .filter((reservation) => reservation.pickupDate === date && reservation.status !== "cancelada")
    .sort((a, b) => {
      const slot = data.shop.slots.indexOf(a.slot) - data.shop.slots.indexOf(b.slot);
      if (slot !== 0) return slot;
      return a.customerName.localeCompare(b.customerName, "pt-BR");
    });

  async function update(id: string, status: ReservationStatus) {
    setBusyId(id);
    setError(null);
    try {
      await setStatus(id, status);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível atualizar.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">Preparo</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight text-ink">O que separar</h1>
          <p className="mt-2 text-muted">{pickupLabel(date, today)} · {formatDate(date)}</p>
        </div>
        <button type="button" className={`${secondaryButtonClass} no-print`} onClick={() => window.print()}>
          Imprimir lista
        </button>
      </div>

      <div className="no-print mt-6 flex gap-2 overflow-x-auto">
        {dates.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => setDate(day)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
              date === day ? "bg-ink text-white" : "bg-white text-ink-soft"
            }`}
          >
            {pickupLabel(day, today)}
          </button>
        ))}
      </div>

      <ul className="mt-8 grid gap-4 sm:grid-cols-3">
        <li className="rounded-md border border-line bg-white px-4 py-5">
          <p className="text-sm text-muted">Reservas em aberto</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">{stats.openCount}</p>
          <p className="mt-1 text-sm text-muted">
            {stats.pickedUp} já retirada{stats.pickedUp === 1 ? "" : "s"}
          </p>
        </li>
        <li className="rounded-md border border-line bg-white px-4 py-5">
          <p className="text-sm text-muted">Kits para montar</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">{stats.kits}</p>
        </li>
        <li className="rounded-md border border-line bg-white px-4 py-5">
          <p className="text-sm text-muted">Cortes em quilo</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">
            {stats.kilos.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg
          </p>
        </li>
      </ul>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ink">Lista de corte e montagem</h2>
        {lines.length === 0 ? (
          <p className="mt-4 text-muted">Nada em aberto para este dia. As retiradas já feitas saem desta conta.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {lines.map((line) => (
              <li key={line.itemId} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between">
                <div>
                  <p className="font-display text-lg font-semibold text-ink">
                    {formatQty(line.quantity, line.unit)} · {line.name}
                  </p>
                  <p className="text-sm text-muted">
                    {line.orders} {line.orders === 1 ? "reserva" : "reservas"}
                    {line.prepNote ? ` · ${line.prepNote}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold text-ink">Quem retira</h2>
        {error ? <p className="mt-3 text-sm text-[#9a4d45]">{error}</p> : null}
        <ul className="mt-4 space-y-4">
          {reservations.length === 0 ? <li className="text-muted">Nenhuma reserva neste dia.</li> : null}
          {reservations.map((reservation) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              shopName={data.shop.name}
              busy={busyId === reservation.id}
              onStatus={(status) => update(reservation.id, status)}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function ReservationCard({
  reservation,
  shopName,
  busy,
  onStatus,
}: {
  reservation: Reservation;
  shopName: string;
  busy: boolean;
  onStatus: (status: ReservationStatus) => void;
}) {
  const next = NEXT_STATUS[reservation.status];
  const message = [
    `Olá, ${reservation.customerName.split(" ")[0]}. Aqui é o ${shopName}.`,
    `Sua reserva ${reservation.code} (${reservation.slot}) está ${STATUS_LABEL[reservation.status].toLowerCase()}.`,
  ].join(" ");
  const whatsapp = whatsappHref(reservation.phone, message);

  return (
    <li className="rounded-md border border-line bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-medium text-ink">
            {reservation.customerName}{" "}
            <span className="text-sm font-normal text-muted">{reservation.code}</span>
          </p>
          <p className="text-sm text-muted">
            {reservation.slot} · {reservation.phone}
          </p>
        </div>
        <p className="text-sm font-medium text-accent">{STATUS_LABEL[reservation.status]}</p>
      </div>
      <ul className="mt-3 text-sm text-ink-soft">
        {reservation.items.map((item) => (
          <li key={`${reservation.id}-${item.itemId}`}>
            {formatQty(item.quantity, item.unit)} {item.name}
          </li>
        ))}
      </ul>
      {reservation.notes ? <p className="mt-2 text-sm text-ink">Obs.: {reservation.notes}</p> : null}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink">{formatBRL(reservationTotalCents(reservation))}</p>
        <div className="no-print flex flex-wrap gap-2">
          {next ? (
            <button type="button" className={secondaryButtonClass} disabled={busy} onClick={() => onStatus(next.status)}>
              {next.label}
            </button>
          ) : null}
          {reservation.status !== "retirada" && reservation.status !== "cancelada" ? (
            <button
              type="button"
              className="px-3 py-2 text-sm text-muted hover:text-ink"
              disabled={busy}
              onClick={() => onStatus("cancelada")}
            >
              Cancelar
            </button>
          ) : null}
          {whatsapp ? (
            <a href={whatsapp} target="_blank" rel="noreferrer" className="px-3 py-2 text-sm font-medium text-accent">
              WhatsApp
            </a>
          ) : null}
        </div>
      </div>
    </li>
  );
}
