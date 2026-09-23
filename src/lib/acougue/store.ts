import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { addCalendarDays, dateDaysAgo, saoPauloToday } from "@/lib/proposta/dates";
import { hashPassword, passwordMatches } from "@/lib/security/password";
import { normalizeQuantity } from "./present";
import { DEMO_EMAIL, DEMO_PASSWORD } from "./demo";
import { createDatabase, createSeed } from "./seed";
import type {
  AcougueData,
  CatalogInput,
  CatalogItem,
  Database,
  PublicCatalog,
  Reservation,
  ReservationInput,
  ReservationStatus,
  Shop,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "acougue.json");
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const RETENTION_DAYS = 30;

export const RESERVED_SLUGS = new Set(["painel", "entrar", "criar", "r", "conta", "midia", "api"]);

const SEED_PHOTOS: Record<string, string> = {
  kit_churrasco: "/acougue/kit-churrasco.png",
  kit_feijoada: "/acougue/kit-feijoada.png",
  kit_costela: "/acougue/kit-costela.png",
  corte_picanha: "/acougue/corte-picanha.png",
  corte_cupim: "/acougue/corte-cupim.png",
  corte_linguica: "/acougue/corte-linguica.png",
  corte_moida: "/acougue/corte-moida.png",
};

let memory: Database | null = null;
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
      memory = createDatabase();
    }
  })();
  return ready;
}

function isDatabase(value: unknown): value is Database {
  if (!value || typeof value !== "object") return false;
  const record = value as Database;
  return Array.isArray(record.accounts) && Array.isArray(record.shops);
}

function safeMediaUrl(url: string | null | undefined, shopId: string) {
  if (!url) return null;
  const value = url.trim();
  if (value.includes("..") || value.includes("\\") || value.includes("?")) return null;
  if (/^\/acougue\/[a-z0-9-]+\.(png|jpe?g|webp)$/i.test(value)) return value;
  const prefix = `/api/acougue/midia/${shopId}/`;
  if (!value.startsWith(prefix)) return null;
  const file = value.slice(prefix.length);
  if (/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(file)) return value;
  return null;
}

function normalizeShop(shop: Partial<Shop> | undefined, fallback: Shop): Shop {
  const source = shop ?? {};
  const id = source.id || fallback.id;
  const slug = source.slug || fallback.slug;
  const rawLogo = source.logoUrl === undefined ? (slug === "estrela" ? fallback.logoUrl : null) : source.logoUrl;
  return {
    id,
    slug,
    logoUrl: safeMediaUrl(rawLogo, id),
    name: source.name || fallback.name,
    tagline: source.tagline ?? fallback.tagline,
    address: source.address ?? "",
    city: source.city ?? "",
    phone: source.phone ?? "",
    whatsapp: source.whatsapp ?? "",
    hours: source.hours ?? "",
    pickupNote: source.pickupNote || fallback.pickupNote,
    slots: Array.isArray(source.slots) && source.slots.length > 0 ? source.slots : fallback.slots,
  };
}

function migrateLegacy(raw: Partial<AcougueData>): Database {
  const seed = createSeed();
  const shop = normalizeShop(raw.shop, seed.shop);
  const items = (raw.items ?? seed.items).map((item) => ({
    ...item,
    photoUrl: item.photoUrl ? safeMediaUrl(item.photoUrl, shop.id) ?? SEED_PHOTOS[item.id] ?? null : SEED_PHOTOS[item.id] ?? null,
  }));
  const password = hashPassword(DEMO_PASSWORD);
  return {
    accounts: [
      {
        id: "acc_estrela",
        email: DEMO_EMAIL,
        ownerName: shop.name || "Açougue Estrela",
        passwordHash: password.hash,
        passwordSalt: password.salt,
        shopId: shop.id,
        createdAt: new Date().toISOString(),
      },
    ],
    shops: [
      {
        shop,
        items,
        reservations: raw.reservations ?? [],
      },
    ],
  };
}

function normalizeDatabase(data: Database): Database {
  const seed = createSeed();
  return {
    accounts: data.accounts ?? [],
    shops: (data.shops ?? []).map((entry) => {
      const shop = normalizeShop(entry.shop, { ...seed.shop, id: entry.shop?.id || randomUUID(), slug: entry.shop?.slug || "acougue" });
      return {
        shop,
        items: (entry.items ?? []).map((item) => ({
          ...item,
          photoUrl: safeMediaUrl(item.photoUrl, shop.id),
        })),
        reservations: entry.reservations ?? [],
      };
    }),
  };
}

async function readData(): Promise<Database> {
  await ensureStorage();
  if (!persistent) {
    memory ??= createDatabase();
    return structuredClone(memory);
  }
  try {
    const raw = JSON.parse(await readFile(DATA_FILE, "utf8")) as unknown;
    if (isDatabase(raw)) {
      const data = normalizeDatabase(raw);
      if (anonymizeExpired(data)) await writeData(data);
      return data;
    }
    const migrated = migrateLegacy(raw as Partial<AcougueData>);
    await writeData(migrated);
    return migrated;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return createDatabase();
    throw error;
  }
}

async function writeData(data: Database) {
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

function findShop(data: Database, shopId: string) {
  const shop = data.shops.find((entry) => entry.shop.id === shopId);
  if (!shop) throw new StoreError("Açougue não encontrado.", 404);
  return shop;
}

function findShopBySlug(data: Database, slug: string) {
  const shop = data.shops.find((entry) => entry.shop.slug === slug);
  if (!shop) throw new StoreError("Açougue não encontrado.", 404);
  return shop;
}

export function isReservedSlug(slug: string) {
  return RESERVED_SLUGS.has(slug);
}

function slugify(name: string) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "acougue";
}

function uniqueSlug(data: Database, name: string) {
  const base = slugify(name);
  let candidate = RESERVED_SLUGS.has(base) ? `${base}-loja` : base;
  let suffix = 2;
  const taken = new Set(data.shops.map((entry) => entry.shop.slug));
  while (taken.has(candidate) || RESERVED_SLUGS.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function anonymizeExpired(data: Database, now = new Date()) {
  const cutoff = dateDaysAgo(RETENTION_DAYS, now);
  let changed = false;
  for (const shop of data.shops) {
    for (const reservation of shop.reservations) {
      if (reservation.pickupDate > cutoff) continue;
      if (reservation.customerName === "Cliente removido" && !reservation.phone && !reservation.notes) continue;
      reservation.customerName = "Cliente removido";
      reservation.phone = "";
      reservation.notes = "";
      changed = true;
    }
  }
  return changed;
}

function makeCode(existing: Set<string>) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const bytes = randomBytes(8);
    let code = "";
    for (const byte of bytes) code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
    if (!existing.has(code)) return code;
  }
  throw new StoreError("Não foi possível gerar o código da reserva.");
}

function bookedQty(data: AcougueData, date: string, itemId: string) {
  return data.reservations.reduce((sum, reservation) => {
    if (reservation.pickupDate !== date || reservation.status === "cancelada") return sum;
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

function publicCatalog(data: AcougueData): PublicCatalog {
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

export async function getShop(shopId: string) {
  return withLock(async () => findShop(await readData(), shopId));
}

export async function getPublicCatalog(slug: string): Promise<PublicCatalog> {
  return withLock(async () => publicCatalog(findShopBySlug(await readData(), slug)));
}

export async function getReservationByCode(slug: string, code: string) {
  return withLock(async () => {
    const data = findShopBySlug(await readData(), slug);
    const reservation = data.reservations.find((item) => item.code.toLowerCase() === code.toLowerCase());
    if (!reservation) throw new StoreError("Reserva não encontrada.", 404);
    return { shop: data.shop, reservation };
  });
}

export async function findReservation(code: string) {
  return withLock(async () => {
    const database = await readData();
    for (const entry of database.shops) {
      const reservation = entry.reservations.find((item) => item.code.toLowerCase() === code.toLowerCase());
      if (reservation) return { shop: entry.shop, reservation };
    }
    return null;
  });
}

export type RegisterInput = {
  ownerName: string;
  email: string;
  password: string;
  shopName: string;
  privacyAccepted?: boolean;
};

export async function registerAccount(input: RegisterInput) {
  return withLock(async () => {
    const data = await readData();
    if (!input.privacyAccepted) {
      throw new StoreError("Confirme o aviso de privacidade para criar a conta.");
    }
    const ownerName = requireText(input.ownerName ?? "", "O seu nome", 2, 80);
    const shopName = requireText(input.shopName ?? "", "O nome do açougue", 2, 80);
    const email = clean(input.email ?? "", 120).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new StoreError("Informe um e-mail válido.");
    if (data.accounts.some((account) => account.email === email)) {
      throw new StoreError("Já existe uma conta com este e-mail.");
    }
    const password = input.password ?? "";
    if (password.length < 8 || password.length > 200) {
      throw new StoreError("A senha precisa ter pelo menos 8 caracteres.");
    }
    const shopId = `shop_${randomUUID()}`;
    const passwordRecord = hashPassword(password);
    const shop: Shop = {
      id: shopId,
      slug: uniqueSlug(data, shopName),
      logoUrl: null,
      name: shopName,
      tagline: "Reserve e retire no balcão",
      address: "",
      city: "",
      phone: "",
      whatsapp: "",
      hours: "",
      pickupNote:
        "A reserva segura o pedido até o fim do horário escolhido. O pagamento é feito na retirada.",
      slots: ["09h–11h", "11h–13h", "16h–18h"],
    };
    const bundle: AcougueData = { shop, items: [], reservations: [] };
    data.accounts.push({
      id: `acc_${randomUUID()}`,
      email,
      ownerName,
      passwordHash: passwordRecord.hash,
      passwordSalt: passwordRecord.salt,
      shopId,
      createdAt: new Date().toISOString(),
      privacyAcceptedAt: new Date().toISOString(),
    });
    data.shops.push(bundle);
    await writeData(data);
    const account = data.accounts[data.accounts.length - 1];
    return { accountId: account.id, shopId, shop };
  });
}

export async function loginAccount(emailInput: string, password: string) {
  return withLock(async () => {
    const data = await readData();
    const email = clean(emailInput ?? "", 120).toLowerCase();
    const account = data.accounts.find((entry) => entry.email === email);
    const shop = account ? data.shops.find((entry) => entry.shop.id === account.shopId) : undefined;
    const matches = passwordMatches(password ?? "", account?.passwordHash, account?.passwordSalt);
    if (!account || !shop || !matches) {
      throw new StoreError("E-mail ou senha não conferem.", 401);
    }
    return { accountId: account.id, shopId: account.shopId, shop: shop.shop };
  });
}

export async function resetShop(shopId: string) {
  return withLock(async () => {
    const data = await readData();
    const current = findShop(data, shopId);
    if (current.shop.slug !== "estrela") {
      throw new StoreError("A restauração vale só para a loja de demonstração.");
    }
    const seed = createSeed();
    const index = data.shops.findIndex((entry) => entry.shop.id === shopId);
    data.shops[index] = {
      ...seed,
      shop: { ...seed.shop, id: current.shop.id, slug: current.shop.slug },
    };
    await writeData(data);
    return data.shops[index];
  });
}

export async function saveShop(shopId: string, input: Shop) {
  return withLock(async () => {
    const data = await readData();
    const current = findShop(data, shopId);
    const slots = (input.slots ?? [])
      .map((slot) => clean(slot, 40))
      .filter(Boolean)
      .slice(0, 8);
    if (slots.length === 0) throw new StoreError("Informe pelo menos um horário de retirada.");
    const name = requireText(input.name ?? "", "O nome do açougue", 2, 80);
    current.shop = {
      ...current.shop,
      name,
      tagline: clean(input.tagline ?? "", 140),
      address: clean(input.address ?? "", 120),
      city: clean(input.city ?? "", 80),
      phone: clean(input.phone ?? "", 30),
      whatsapp: clean(input.whatsapp ?? "", 30),
      hours: cleanBlock(input.hours ?? "", 240),
      pickupNote: cleanBlock(input.pickupNote ?? "", 400),
      slots,
      logoUrl: safeMediaUrl(input.logoUrl, shopId),
    };
    await writeData(data);
    return current;
  });
}

export async function saveItem(shopId: string, input: CatalogInput) {
  return withLock(async () => {
    const data = await readData();
    const current = findShop(data, shopId);
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
      photoUrl: safeMediaUrl(input.photoUrl, shopId),
    };
    if (input.id) {
      const index = current.items.findIndex((item) => item.id === input.id);
      if (index === -1) throw new StoreError("Item não encontrado.", 404);
      current.items[index] = { ...current.items[index], ...next };
    } else {
      const sort = current.items.reduce((max, item) => Math.max(max, item.sort), 0) + 1;
      current.items.push({ id: randomUUID(), sort, ...next });
    }
    current.items.sort((a, b) => a.sort - b.sort);
    await writeData(data);
    return current;
  });
}

export async function createReservation(input: ReservationInput) {
  return withLock(async () => {
    const database = await readData();
    const slug = clean(input.slug ?? "", 60).toLowerCase();
    const data = findShopBySlug(database, slug);
    if (!input.privacyAccepted) {
      throw new StoreError("Confirme o uso do nome e do WhatsApp para esta retirada.");
    }
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
      privacyAcceptedAt: new Date().toISOString(),
    };
    data.reservations.unshift(reservation);
    await writeData(database);
    return { reservation, shop: data.shop };
  });
}

const STATUS_FLOW: ReservationStatus[] = ["reservada", "separada", "pronta", "retirada", "cancelada"];

export async function setReservationStatus(shopId: string, id: string, status: ReservationStatus) {
  return withLock(async () => {
    if (!STATUS_FLOW.includes(status)) throw new StoreError("Situação inválida.");
    const data = await readData();
    const current = findShop(data, shopId);
    const reservation = current.reservations.find((item) => item.id === id);
    if (!reservation) throw new StoreError("Reserva não encontrada.", 404);
    reservation.status = status;
    await writeData(data);
    return current;
  });
}

export async function deleteReservation(shopId: string, id: string) {
  return withLock(async () => {
    const data = await readData();
    const current = findShop(data, shopId);
    const before = current.reservations.length;
    current.reservations = current.reservations.filter((item) => item.id !== id);
    if (current.reservations.length === before) throw new StoreError("Reserva não encontrada.", 404);
    await writeData(data);
    return current;
  });
}

export async function deleteAccount(accountId: string, shopId: string) {
  return withLock(async () => {
    const data = await readData();
    const account = data.accounts.find((item) => item.id === accountId && item.shopId === shopId);
    if (!account) throw new StoreError("Conta não encontrada.", 404);
    data.accounts = data.accounts.filter((item) => item.id !== account.id);
    data.shops = data.shops.filter((item) => item.shop.id !== shopId);
    await writeData(data);
    await rm(path.join(process.cwd(), "data", "acougue-media", shopId), { recursive: true, force: true });
  });
}
