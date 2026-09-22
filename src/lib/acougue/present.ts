import { addCalendarDays, formatDate, saoPauloToday } from "@/lib/proposta/dates";
import type {
  CatalogItem,
  ItemKind,
  Reservation,
  ReservationStatus,
  Unit,
} from "./types";

export const STATUS_LABEL: Record<ReservationStatus, string> = {
  reservada: "Reservada",
  separada: "Separando",
  pronta: "Pronta para retirar",
  retirada: "Retirada",
  cancelada: "Cancelada",
};

export const OPEN_STATUSES: ReservationStatus[] = ["reservada", "separada", "pronta"];

export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatQty(quantity: number, unit: Unit) {
  const value = quantity.toLocaleString("pt-BR", {
    minimumFractionDigits: unit === "kg" && !Number.isInteger(quantity) ? 1 : 0,
    maximumFractionDigits: 1,
  });
  return unit === "kg" ? `${value} kg` : `${value} un`;
}

export function lineTotalCents(quantity: number, priceCents: number) {
  return Math.round(quantity * priceCents);
}

export function reservationTotalCents(reservation: Pick<Reservation, "items">) {
  return reservation.items.reduce(
    (sum, item) => sum + lineTotalCents(item.quantity, item.priceCents),
    0,
  );
}

export function weekdayShort(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 15));
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    timeZone: "America/Sao_Paulo",
  })
    .format(date)
    .replace(".", "");
}

export function pickupLabel(iso: string, today = saoPauloToday()) {
  if (iso === today) return "Hoje";
  if (iso === addCalendarDays(today, 1)) return "Amanhã";
  return `${weekdayShort(iso)} ${formatDate(iso).slice(0, 5)}`;
}

export function upcomingDates(days = 7, today = saoPauloToday()) {
  return Array.from({ length: days }, (_, index) => addCalendarDays(today, index));
}

export function parseMoneyToCents(input: string) {
  const clean = input.trim().replace(/[\s\u00a0]/g, "");
  if (!clean) return null;
  let normalized = clean;
  if (clean.includes(",")) {
    normalized = clean.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(clean)) {
    normalized = clean.replace(/\./g, "");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

export function centsToInput(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function normalizeQuantity(quantity: number, unit: Unit) {
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  if (unit === "un") {
    if (!Number.isInteger(quantity) || quantity > 30) return null;
    return quantity;
  }
  const rounded = Math.round(quantity * 10) / 10;
  if (rounded < 0.5 || rounded > 40) return null;
  return rounded;
}

export function whatsappHref(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(text)}`;
}

export function reservationMessage(input: {
  shopName: string;
  code: string;
  customerName: string;
  pickupDate: string;
  slot: string;
  lines: string[];
  totalCents: number;
}) {
  return [
    `Olá, ${input.shopName}. Fiz uma reserva para retirada.`,
    `Código ${input.code}`,
    input.customerName,
    `${formatDate(input.pickupDate)}, ${input.slot}`,
    ...input.lines,
    `Total: ${formatBRL(input.totalCents)}`,
  ].join("\n");
}

export type PrepLine = {
  itemId: string;
  name: string;
  kind: ItemKind;
  unit: Unit;
  quantity: number;
  orders: number;
  prepNote: string;
};

export function prepLines(
  reservations: Reservation[],
  items: CatalogItem[],
  date: string,
): PrepLine[] {
  const notes = new Map(items.map((item) => [item.id, item.prepNote]));
  const map = new Map<string, PrepLine>();

  for (const reservation of reservations) {
    if (reservation.pickupDate !== date || !OPEN_STATUSES.includes(reservation.status)) continue;
    for (const line of reservation.items) {
      const current = map.get(line.itemId) ?? {
        itemId: line.itemId,
        name: line.name,
        kind: line.kind,
        unit: line.unit,
        quantity: 0,
        orders: 0,
        prepNote: notes.get(line.itemId) ?? "",
      };
      current.quantity = Math.round((current.quantity + line.quantity) * 10) / 10;
      current.orders += 1;
      map.set(line.itemId, current);
    }
  }

  return [...map.values()].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "kit" ? -1 : 1;
    return b.quantity - a.quantity;
  });
}

export function dayStats(reservations: Reservation[], date: string) {
  const ofDay = reservations.filter((reservation) => reservation.pickupDate === date);
  const open = ofDay.filter((reservation) => OPEN_STATUSES.includes(reservation.status));
  let kits = 0;
  let kilos = 0;
  for (const reservation of open) {
    for (const line of reservation.items) {
      if (line.kind === "kit") kits += line.quantity;
      if (line.unit === "kg") kilos += line.quantity;
    }
  }
  return {
    openCount: open.length,
    pickedUp: ofDay.filter((reservation) => reservation.status === "retirada").length,
    cancelled: ofDay.filter((reservation) => reservation.status === "cancelada").length,
    kits,
    kilos: Math.round(kilos * 10) / 10,
  };
}

export function remainingFor(item: CatalogItem, bookedQty: number) {
  if (item.dailyCap == null) return null;
  return Math.max(0, Math.round((item.dailyCap - bookedQty) * 10) / 10);
}

export function bookedOnDate(
  booked: Record<string, Record<string, number>>,
  date: string,
  itemId: string,
) {
  return booked[date]?.[itemId] ?? 0;
}
