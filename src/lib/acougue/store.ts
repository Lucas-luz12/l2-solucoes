import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { addCalendarDays, saoPauloToday } from "@/lib/proposta/dates";
import { normalizeQuantity } from "./present";
import { createSeed } from "./seed";
import type {
  AcougueData,
  CatalogInput,
  CatalogItem,
  PublicCatalog,
  Reservation,
  ReservationInput,
  ReservationStatus,
  Shop,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "acougue.json");
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

let memory: AcougueData | null = null;
let persistent = true;
let ready: Promise<void> | null = null;
let chain: Promise<unknown> = Promise.resolve();

export class StoreError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function ensureStorage() {
  if (ready) return ready;
  ready = (async () => {
    try {
      await mkdir(DATA_DIR, { recursive: true });
      const probe = path.join(DATA_DIR, ".write-probe-acougue");
      await writeFile(probe, "ok");
      await unlink(probe);
      persistent = true;
    } catch {
      persistent = false;
      memory = createSeed();
    }
  })();
  return ready;
}

async function readData(): Promise<AcougueData> {
  await ensureStorage();
  if (!persistent) {
    memory ??= createSeed();
    return structuredClone(memory);
  }
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as AcougueData;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return createSeed();
    throw error;
  }
}

async function writeData(data: AcougueData) {
  await ensureStorage();
  if (!persistent) {
    memory = structuredClone(data);
    return;
  }
  try {
    await mkdir(DATA_DIR, { recursive: true });
    const temporary = path.join(DATA_DIR, `acougue.${process.pid}.tmp`);
    await writeFile(temporary, JSON.stringify(data, null, 2));
    await rename(temporary, DATA_FILE);
  } catch {
    persistent = false;
    memory = structuredClone(data);
  }
}

function clean(value: string, max: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanBlock(value: string, max: number) {
  return value.replace(/\r\n/g, "\n").trim().slice(0, max);
}

function requireText(value: string, label: string, min: number, max: number) {
  const text = clean(value, max);
  if (text.length < min) throw new StoreError(`${label} precisa de pelo menos ${min} caracteres.`);
  return text;
}

function makeCode(existing: Set<string>) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const bytes = randomBytes(6);
    let code = "";
    for (const byte of bytes) code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
    if (!existing.has(code)) return code;
  }
  throw new StoreError("Não foi possível gerar o código da reserva.");
}

function bookedQty(data: AcougueData, date: string, itemId: string, exceptId?: string) {
  return data.reservations.reduce((sum, reservation) => {
    if (reservation.pickupDate !== date || reservation.status === "cancelada") return sum;
    if (exceptId && reservation.id === exceptId) return sum;
    const quantity = reservation.items
      .filter((item) => item.itemId === itemId)
      .reduce((lineSum, item) => lineSum + item.quantity, 0);
    return Math.round((sum + quantity) * 10) / 10;
  }, 0);
}

function normalizeCap(cap: number, unit: "un" | "kg") {
  if (!Number.isFinite(cap) || cap <= 0 || cap > 500) return null;
  if (unit === "un") return Number.isInteger(cap) ? cap : null;
  return Math.round(cap * 10) / 10;
}

export async function getAcougue() {
  return withLock(readData);
}

export async function getPublicCatalog(): Promise<PublicCatalog> {
  const data = await getAcougue();
  const today = saoPauloToday();
  const last = addCalendarDays(today, 13);
  const booked: PublicCatalog["booked"] = {};
  for (const reservation of data.reservations) {
    if (reservation.status === "cancelada") continue;
    if (reservation.pickupDate < today || reservation.pickupDate > last) continue;
    const day = booked[reservation.pickupDate] ?? {};
    for (const line of reservation.items) {
      day[line.itemId] = Math.round(((day[line.itemId] ?? 0) + line.quantity) * 10) / 10;
    }
    booked[reservation.pickupDate] = day;
  }
  return {
    shop: data.shop,
    items: data.items.filter((item) => item.active).sort((a, b) => a.sort - b.sort),
    booked,
  };
}

export async function getReservationByCode(code: string) {
  const data = await getAcougue();
  const reservation = data.reservations.find((item) => item.code.toLowerCase() === code.toLowerCase());
  if (!reservation) throw new StoreError("Reserva não encontrada.", 404);
  return { shop: data.shop, reservation };
}

export async function resetAcougue() {
  return withLock(async () => {
    const data = createSeed();
    await writeData(data);
    return data;
  });
}

export async function saveShop(input: Shop) {
  return withLock(async () => {
    const data = await readData();
    const slots = (input.slots ?? [])
      .map((slot) => clean(slot, 40))
      .filter(Boolean)
      .slice(0, 8);
    if (slots.length === 0) throw new StoreError("Informe pelo menos um horário de retirada.");
    const name = requireText(input.name ?? "", "O nome do açougue", 2, 80);
    const whatsapp = clean(input.whatsapp ?? "", 30);
    data.shop = {
      name,
      tagline: clean(input.tagline ?? "", 140),
      address: clean(input.address ?? "", 120),
      city: clean(input.city ?? "", 80),
      phone: clean(input.phone ?? "", 30),
      whatsapp,
      hours: cleanBlock(input.hours ?? "", 240),
      pickupNote: cleanBlock(input.pickupNote ?? "", 400),
      slots,
    };
    await writeData(data);
    return data;
  });
}

export async function saveItem(input: CatalogInput) {
  return withLock(async () => {
    const data = await readData();
    const name = requireText(input.name ?? "", "O nome", 2, 80);
    const priceCents = Math.round(Number(input.priceCents));
    if (!Number.isInteger(priceCents) || priceCents < 0 || priceCents > 100_000_00) {
      throw new StoreError("Informe um preço válido.");
    }
    const unit = input.unit === "kg" ? "kg" : "un";
    const kind = input.kind === "corte" ? "corte" : "kit";
    let dailyCap: number | null = null;
    if (input.dailyCap != null) {
      const normalized = normalizeCap(Number(input.dailyCap), unit);
      if (normalized == null) {
        throw new StoreError("O limite do dia precisa ser maior que zero, ou fique em branco.");
      }
      dailyCap = normalized;
    }
    const next: Omit<CatalogItem, "id" | "sort"> = {
      kind,
      name,
      description: cleanBlock(input.description ?? "", 400),
      priceCents,
      unit,
      serves: clean(input.serves ?? "", 40),
      prepNote: cleanBlock(input.prepNote ?? "", 240),
      active: Boolean(input.active),
      promo: Boolean(input.promo),
      dailyCap,
    };
    if (input.id) {
      const index = data.items.findIndex((item) => item.id === input.id);
      if (index === -1) throw new StoreError("Item não encontrado.", 404);
      data.items[index] = { ...data.items[index], ...next };
    } else {
      const sort = data.items.reduce((max, item) => Math.max(max, item.sort), 0) + 1;
      data.items.push({ id: randomUUID(), sort, ...next });
    }
    data.items.sort((a, b) => a.sort - b.sort);
    await writeData(data);
    return data;
  });
}

export async function createReservation(input: ReservationInput) {
  return withLock(async () => {
    const data = await readData();
    const customerName = requireText(input.customerName ?? "", "O seu nome", 2, 80);
    const phone = clean(input.phone ?? "", 30);
    if (phone.replace(/\D/g, "").length < 10) {
      throw new StoreError("Informe um telefone com DDD para o açougue confirmar a retirada.");
    }
    const today = saoPauloToday();
    const pickupDate = clean(input.pickupDate ?? "", 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(pickupDate) || pickupDate < today || pickupDate > addCalendarDays(today, 14)) {
      throw new StoreError("Escolha uma data de retirada entre hoje e os próximos 14 dias.");
    }
    const slot = clean(input.slot ?? "", 40);
    if (!data.shop.slots.includes(slot)) throw new StoreError("Escolha um horário de retirada.");
    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new StoreError("Escolha pelo menos um kit ou corte.");
    }
    if (input.items.length > 20) throw new StoreError("A reserva pode ter no máximo 20 itens.");

    const requested = new Map<string, number>();
    for (const line of input.items) {
      const quantity = Number(line.quantity);
      requested.set(line.itemId, (requested.get(line.itemId) ?? 0) + quantity);
    }

    const lines = [...requested.entries()].map(([itemId, rawQuantity]) => {
      const item = data.items.find((entry) => entry.id === itemId && entry.active);
      if (!item) throw new StoreError("Um dos itens saiu da vitrine. Atualize a página.");
      const quantity = normalizeQuantity(rawQuantity, item.unit);
      if (quantity == null) {
        throw new StoreError(
          item.unit === "kg"
            ? `Em ${item.name}, peça entre 0,5 kg e 40 kg.`
            : `Em ${item.name}, peça de 1 a 30 unidades.`,
        );
      }
      if (item.dailyCap != null) {
        const used = bookedQty(data, pickupDate, item.id);
        if (Math.round((used + quantity) * 10) / 10 > item.dailyCap) {
          const left = Math.max(0, Math.round((item.dailyCap - used) * 10) / 10);
          throw new StoreError(
            left <= 0
              ? `${item.name} esgotou para este dia.`
              : `${item.name}: restam ${String(left).replace(".", ",")} ${item.unit} neste dia.`,
          );
        }
      }
      return {
        itemId: item.id,
        name: item.name,
        kind: item.kind,
        unit: item.unit,
        quantity,
        priceCents: item.priceCents,
      };
    });

    const reservation: Reservation = {
      id: randomUUID(),
      code: makeCode(new Set(data.reservations.map((item) => item.code))),
      customerName,
      phone,
      pickupDate,
      slot,
      notes: cleanBlock(input.notes ?? "", 300),
      items: lines,
      status: "reservada",
      createdAt: new Date().toISOString(),
    };
    data.reservations.unshift(reservation);
    await writeData(data);
    return { data, reservation };
  });
}

const STATUS_FLOW: ReservationStatus[] = ["reservada", "separada", "pronta", "retirada", "cancelada"];

export async function setReservationStatus(id: string, status: ReservationStatus) {
  return withLock(async () => {
    if (!STATUS_FLOW.includes(status)) throw new StoreError("Situação inválida.");
    const data = await readData();
    const reservation = data.reservations.find((item) => item.id === id);
    if (!reservation) throw new StoreError("Reserva não encontrada.", 404);
    reservation.status = status;
    await writeData(data);
    return data;
  });
}
