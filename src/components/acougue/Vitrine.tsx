"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addCalendarDays, saoPauloToday } from "@/lib/proposta/dates";
import {
  bookedOnDate,
  formatBRL,
  formatQty,
  lineTotalCents,
  normalizeQuantity,
  pickupLabel,
  remainingFor,
  upcomingDates,
} from "@/lib/acougue/present";
import type { CatalogItem, PublicCatalog } from "@/lib/acougue/types";
import { fieldClass, primaryButtonClass, secondaryButtonClass } from "@/components/proposta/ui";
import { ShopImage } from "./ShopImage";

export function Vitrine({ catalog }: { catalog: PublicCatalog }) {
  const router = useRouter();
  const today = saoPauloToday();
  const dates = upcomingDates(7, today);
  const [date, setDate] = useState(addCalendarDays(today, 1));
  const [slot, setSlot] = useState(catalog.shop.slots[0] ?? "");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const kits = catalog.items.filter((item) => item.kind === "kit");
  const cortes = catalog.items.filter((item) => item.kind === "corte");
  const demo = catalog.shop.slug === "estrela";

  const lines = useMemo(() => {
    return catalog.items
      .filter((item) => (cart[item.id] ?? 0) > 0)
      .map((item) => ({
        item,
        quantity: cart[item.id],
        total: lineTotalCents(cart[item.id], item.priceCents),
      }));
  }, [cart, catalog.items]);

  const total = lines.reduce((sum, line) => sum + line.total, 0);

  function changeQty(item: CatalogItem, delta: number) {
    const current = cart[item.id] ?? 0;
    const next = Math.round((current + delta) * 10) / 10;
    if (next <= 0) {
      setCart((prev) => {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      });
      return;
    }
    if (normalizeQuantity(next, item.unit) == null) return;
    const left = remainingFor(item, bookedOnDate(catalog.booked, date, item.id));
    if (left != null && next > left) return;
    setCart((prev) => ({ ...prev, [item.id]: next }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/acougue/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          phone,
          pickupDate: date,
          slot,
          notes,
          slug: catalog.shop.slug,
          items: lines.map((line) => ({ itemId: line.item.id, quantity: line.quantity })),
        }),
      });
      const body = (await response.json()) as { code?: string; error?: string };
      if (!response.ok || !body.code) throw new Error(body.error || "Não foi possível reservar.");
      router.push(`/acougue/${catalog.shop.slug}/r/${body.code}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível reservar.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      {demo ? (
        <div className="border-b border-accent/20 bg-accent/10">
          <p className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-sm text-ink-soft md:px-8">
            <span>Demonstração do Açougue Estrela. O cliente reserva sem criar conta.</span>
            <span className="flex flex-wrap gap-4">
              <Link href="/acougue/entrar" className="font-medium text-accent hover:text-accent-bright">
                Entrar no painel
              </Link>
              <Link href="/acougue/criar" className="font-medium text-accent hover:text-accent-bright">
                Quero isto no meu açougue
              </Link>
            </span>
          </p>
        </div>
      ) : null}

      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 px-4 py-8 md:px-8">
          <div className="flex items-center gap-4">
            {catalog.shop.logoUrl ? (
              <ShopImage src={catalog.shop.logoUrl} alt="" className="h-16 w-16 rounded-md object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-md bg-accent/10 font-display text-2xl font-semibold text-accent">
                {catalog.shop.name.slice(0, 1)}
              </div>
            )}
            <div>
            <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Reserva e retirada
            </p>
            <h1 className="mt-2 font-display text-4xl tracking-tight text-ink">{catalog.shop.name}</h1>
            <p className="mt-2 max-w-xl text-muted">{catalog.shop.tagline}</p>
            </div>
          </div>
          <div className="text-sm leading-relaxed text-ink-soft">
            {catalog.shop.address ? <p>{catalog.shop.address}</p> : null}
            {catalog.shop.city ? <p>{catalog.shop.city}</p> : null}
            {catalog.shop.hours ? <p className="mt-1">{catalog.shop.hours}</p> : null}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-8 md:px-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div>
            <p className="text-sm font-medium text-ink-soft">Retirar</p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
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
          </div>

          {catalog.items.length === 0 ? (
            <p className="mt-10 text-muted">Este açougue ainda está montando o cardápio.</p>
          ) : null}
          <CatalogGroup title="Kits da promoção" items={kits} cart={cart} date={date} booked={catalog.booked} onChange={changeQty} />
          <CatalogGroup title="Cortes por quilo" items={cortes} cart={cart} date={date} booked={catalog.booked} onChange={changeQty} />
        </div>

        <form onSubmit={submit} className="h-fit rounded-md border border-line bg-white p-5 lg:sticky lg:top-6">
          <h2 className="font-display text-xl font-semibold text-ink">Sua reserva</h2>
          {lines.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Escolha um kit ou um corte. O açougue separa para o horário marcado.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {lines.map((line) => (
                <li key={line.item.id} className="flex justify-between gap-3">
                  <span>
                    {formatQty(line.quantity, line.item.unit)} {line.item.name}
                  </span>
                  <span className="shrink-0 font-medium">{formatBRL(line.total)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 font-display text-2xl font-semibold text-ink">{formatBRL(total)}</p>

          <fieldset className="mt-5">
            <legend className="text-sm font-medium text-ink-soft">Horário</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {catalog.shop.slots.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSlot(option)}
                  className={`rounded-md border px-3 py-1.5 text-sm ${
                    slot === option ? "border-accent bg-accent/10 text-accent" : "border-line text-ink-soft"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="mt-4 block text-sm font-medium text-ink-soft">
            Nome
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={`${fieldClass} mt-1.5`}
              placeholder="Quem vai retirar"
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-ink-soft">
            WhatsApp
            <input
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={`${fieldClass} mt-1.5`}
              placeholder="(11) 90000-0000"
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-ink-soft">
            Observação
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              className={`${fieldClass} mt-1.5 resize-y`}
              placeholder="Peça inteira, ponto, sem osso"
            />
          </label>
          {lines.some((line) => {
            const left = remainingFor(line.item, bookedOnDate(catalog.booked, date, line.item.id));
            return left != null && line.quantity > left;
          }) ? (
            <p className="mt-3 text-sm text-[#9a4d45]">
              Algum item passou do que ainda cabe neste dia. Diminua a quantidade.
            </p>
          ) : null}
          {error ? <p className="mt-3 text-sm text-[#9a4d45]">{error}</p> : null}
          <button type="submit" className={`${primaryButtonClass} mt-4 w-full`} disabled={busy || lines.length === 0}>
            Reservar retirada
          </button>
          <p className="mt-3 text-xs leading-relaxed text-muted">{catalog.shop.pickupNote}</p>
          <p className="mt-4 text-xs text-muted">O pagamento continua no balcão, na retirada.</p>
          {demo ? (
            <Link href="/acougue/criar" className={`${secondaryButtonClass} mt-4 w-full`}>
              Quero isto no meu açougue
            </Link>
          ) : null}
        </form>
      </div>
    </div>
  );
}

function CatalogGroup({
  title,
  items,
  cart,
  date,
  booked,
  onChange,
}: {
  title: string;
  items: CatalogItem[];
  cart: Record<string, number>;
  date: string;
  booked: PublicCatalog["booked"];
  onChange: (item: CatalogItem, delta: number) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl tracking-tight text-ink">{title}</h2>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {items.map((item) => {
          const quantity = cart[item.id] ?? 0;
          const left = remainingFor(item, bookedOnDate(booked, date, item.id));
          const step = item.unit === "kg" ? 0.5 : 1;
          const soldOut = left != null && left <= 0;
          return (
            <li key={item.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 gap-4">
                {item.photoUrl ? (
                  <ShopImage
                    src={item.photoUrl}
                    alt={item.name}
                    className="h-24 w-24 shrink-0 rounded-md object-cover sm:h-28 sm:w-28"
                  />
                ) : (
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md bg-surface font-display text-2xl text-ink-soft sm:h-28 sm:w-28">
                    {item.name.slice(0, 1)}
                  </div>
                )}
              <div className="max-w-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-semibold text-ink">{item.name}</h3>
                  {item.promo ? (
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                      Promoção
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted">{item.description}</p>
                <p className="mt-2 text-sm text-ink-soft">
                  {formatBRL(item.priceCents)}
                  {item.unit === "kg" ? " / kg" : ""}
                  {item.serves ? ` · ${item.serves}` : ""}
                  {left != null ? ` · ${soldOut ? "esgotado neste dia" : `restam ${formatQty(left, item.unit)}`}` : ""}
                </p>
              </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => onChange(item, -step)}
                  disabled={quantity <= 0}
                  aria-label={`Diminuir ${item.name}`}
                >
                  −
                </button>
                <span className="w-16 text-center text-sm font-medium text-ink">
                  {quantity > 0 ? formatQty(quantity, item.unit) : "0"}
                </span>
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => onChange(item, step)}
                  disabled={soldOut || (left != null && quantity + step > left)}
                  aria-label={`Aumentar ${item.name}`}
                >
                  +
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
