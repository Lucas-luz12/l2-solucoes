export type Unit = "un" | "kg";

export type ItemKind = "kit" | "corte";

export type ReservationStatus = "reservada" | "separada" | "pronta" | "retirada" | "cancelada";

export type Shop = {
  id: string;
  slug: string;
  logoUrl: string | null;
  name: string;
  tagline: string;
  address: string;
  city: string;
  phone: string;
  whatsapp: string;
  hours: string;
  pickupNote: string;
  slots: string[];
};

export type CatalogItem = {
  id: string;
  kind: ItemKind;
  name: string;
  description: string;
  priceCents: number;
  unit: Unit;
  serves: string;
  prepNote: string;
  active: boolean;
  promo: boolean;
  /** Teto do dia, na mesma unidade do item. Null não limita. */
  dailyCap: number | null;
  sort: number;
  photoUrl: string | null;
};

export type ReservationLine = {
  itemId: string;
  name: string;
  kind: ItemKind;
  unit: Unit;
  quantity: number;
  priceCents: number;
};

export type Reservation = {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  pickupDate: string;
  slot: string;
  notes: string;
  items: ReservationLine[];
  status: ReservationStatus;
  createdAt: string;
};

export type AcougueData = {
  shop: Shop;
  items: CatalogItem[];
  reservations: Reservation[];
};

export type Account = {
  id: string;
  email: string;
  ownerName: string;
  passwordHash: string;
  passwordSalt: string;
  shopId: string;
  createdAt: string;
};

export type Database = {
  accounts: Account[];
  shops: AcougueData[];
};

export type ReservationInput = {
  slug: string;
  customerName: string;
  phone: string;
  pickupDate: string;
  slot: string;
  notes: string;
  items: { itemId: string; quantity: number }[];
};

export type CatalogInput = {
  id?: string | null;
  kind: ItemKind;
  name: string;
  description: string;
  priceCents: number;
  unit: Unit;
  serves: string;
  prepNote: string;
  active: boolean;
  promo: boolean;
  dailyCap: number | null;
  photoUrl: string | null;
};

export type PublicCatalog = {
  shop: Shop;
  items: CatalogItem[];
  /** date -> itemId -> quantidade já reservada (exceto canceladas) */
  booked: Record<string, Record<string, number>>;
};
