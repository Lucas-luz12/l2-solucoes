"use client";

import { useState, type FormEvent } from "react";
import { centsToInput, formatBRL, parseMoneyToCents } from "@/lib/acougue/present";
import type { CatalogItem, ItemKind, Unit } from "@/lib/acougue/types";
import { fieldClass, primaryButtonClass, secondaryButtonClass } from "@/components/proposta/ui";
import { useAcougue } from "./AcougueProvider";
import { ShopImage } from "./ShopImage";
import { uploadShopImage } from "./upload";

type Draft = {
  id: string;
  kind: ItemKind;
  name: string;
  description: string;
  price: string;
  unit: Unit;
  serves: string;
  prepNote: string;
  active: boolean;
  promo: boolean;
  dailyCap: string;
  photoUrl: string | null;
};

function emptyDraft(): Draft {
  return {
    id: "",
    kind: "kit",
    name: "",
    description: "",
    price: "",
    unit: "un",
    serves: "",
    prepNote: "",
    active: true,
    promo: true,
    dailyCap: "",
    photoUrl: null,
  };
}

function fromItem(item: CatalogItem): Draft {
  return {
    id: item.id,
    kind: item.kind,
    name: item.name,
    description: item.description,
    price: centsToInput(item.priceCents),
    unit: item.unit,
    serves: item.serves,
    prepNote: item.prepNote,
    active: item.active,
    promo: item.promo,
    dailyCap: item.dailyCap == null ? "" : String(item.dailyCap).replace(".", ","),
    photoUrl: item.photoUrl,
  };
}

export function CatalogEditor() {
  const { data, saveItem } = useAcougue();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setBusy(true);
    setMessage(null);
    try {
      const priceCents = parseMoneyToCents(draft.price);
      if (priceCents == null) throw new Error("Informe o preço, como 189,90 ou 79,90.");
      let dailyCap: number | null = null;
      if (draft.dailyCap.trim()) {
        const normalized = draft.dailyCap.trim().replace(",", ".");
        const value = Number(normalized);
        if (!Number.isFinite(value) || value <= 0) throw new Error("O limite do dia está inválido.");
        dailyCap = value;
      }
      await saveItem({
        id: draft.id || null,
        kind: draft.kind,
        name: draft.name,
        description: draft.description,
        priceCents,
        unit: draft.unit,
        serves: draft.serves,
        prepNote: draft.prepNote,
        active: draft.active,
        promo: draft.promo,
        dailyCap,
        photoUrl: draft.photoUrl,
      });
      setMessage(draft.id ? "Item atualizado na vitrine." : "Item incluído na vitrine.");
      if (!draft.id) setDraft(null);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">Cardápio</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight text-ink">Kits e cortes da vitrine</h1>
        </div>
        <button
          type="button"
          className={primaryButtonClass}
          onClick={() => {
            setDraft(emptyDraft());
            setMessage(null);
          }}
        >
          Novo item
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <ul className="divide-y divide-line border-y border-line">
          {data.items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  setDraft(fromItem(item));
                  setMessage(null);
                }}
                className="flex w-full items-center justify-between gap-4 py-4 text-left"
              >
                <span className="flex min-w-0 items-center gap-3">
                  {item.photoUrl ? (
                    <ShopImage src={item.photoUrl} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-surface font-display text-lg text-ink-soft">
                      {item.name.slice(0, 1)}
                    </span>
                  )}
                <span>
                  <span className="font-medium text-ink">{item.name}</span>
                  <span className="mt-1 block text-sm text-muted">
                    {item.kind === "kit" ? "Kit" : "Corte"}
                    {item.promo ? " · promoção" : ""}
                    {item.active ? "" : " · fora da vitrine"}
                    {item.dailyCap != null ? ` · limite ${item.dailyCap} ${item.unit}/dia` : ""}
                  </span>
                </span>
                </span>
                <span className="shrink-0 text-sm font-medium text-ink">
                  {formatBRL(item.priceCents)}
                  {item.unit === "kg" ? "/kg" : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {draft ? (
          <form onSubmit={onSubmit} className="h-fit space-y-3 rounded-md border border-line bg-white p-5">
            <h2 className="font-display text-lg font-semibold text-ink">{draft.id ? "Editar item" : "Novo item"}</h2>
            <div>
              <p className="text-sm font-medium text-ink-soft">Foto</p>
              <div className="mt-2 flex items-center gap-3">
                {draft.photoUrl ? (
                  <ShopImage src={draft.photoUrl} alt="" className="h-16 w-16 rounded-md object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-md bg-surface text-sm text-muted">
                    Sem foto
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <label className={`${secondaryButtonClass} cursor-pointer`}>
                    Enviar foto
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (!file) return;
                        setBusy(true);
                        setMessage(null);
                        try {
                          const photoUrl = await uploadShopImage(file);
                          setDraft((current) => (current ? { ...current, photoUrl } : current));
                        } catch (reason) {
                          setMessage(reason instanceof Error ? reason.message : "Não foi possível enviar a foto.");
                        } finally {
                          setBusy(false);
                        }
                      }}
                    />
                  </label>
                  {draft.photoUrl ? (
                    <button type="button" className={secondaryButtonClass} onClick={() => setDraft({ ...draft, photoUrl: null })}>
                      Remover
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
            <label className="block text-sm font-medium text-ink-soft">
              Nome
              <input
                required
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                className={`${fieldClass} mt-1.5`}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium text-ink-soft">
                Tipo
                <select
                  value={draft.kind}
                  onChange={(event) => setDraft({ ...draft, kind: event.target.value as ItemKind })}
                  className={`${fieldClass} mt-1.5`}
                >
                  <option value="kit">Kit</option>
                  <option value="corte">Corte</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-ink-soft">
                Unidade
                <select
                  value={draft.unit}
                  onChange={(event) => setDraft({ ...draft, unit: event.target.value as Unit })}
                  className={`${fieldClass} mt-1.5`}
                >
                  <option value="un">Unidade</option>
                  <option value="kg">Quilo</option>
                </select>
              </label>
            </div>
            <label className="block text-sm font-medium text-ink-soft">
              Preço
              <input
                required
                value={draft.price}
                onChange={(event) => setDraft({ ...draft, price: event.target.value })}
                className={`${fieldClass} mt-1.5`}
                placeholder="189,90"
              />
            </label>
            <label className="block text-sm font-medium text-ink-soft">
              Descrição para o cliente
              <textarea
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                rows={3}
                className={`${fieldClass} mt-1.5 resize-y`}
              />
            </label>
            <label className="block text-sm font-medium text-ink-soft">
              Como separar
              <textarea
                value={draft.prepNote}
                onChange={(event) => setDraft({ ...draft, prepNote: event.target.value })}
                rows={2}
                className={`${fieldClass} mt-1.5 resize-y`}
                placeholder="O que a equipe faz na câmara"
              />
            </label>
            <label className="block text-sm font-medium text-ink-soft">
              Rende
              <input
                value={draft.serves}
                onChange={(event) => setDraft({ ...draft, serves: event.target.value })}
                className={`${fieldClass} mt-1.5`}
                placeholder="6 pessoas"
              />
            </label>
            <label className="block text-sm font-medium text-ink-soft">
              Limite do dia
              <input
                value={draft.dailyCap}
                onChange={(event) => setDraft({ ...draft, dailyCap: event.target.value })}
                className={`${fieldClass} mt-1.5`}
                placeholder="Em branco não limita"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={draft.promo}
                onChange={(event) => setDraft({ ...draft, promo: event.target.checked })}
              />
              Promoção
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
              />
              Visível na vitrine
            </label>
            {message ? <p className="text-sm text-ink-soft">{message}</p> : null}
            <div className="flex gap-2">
              <button type="submit" className={primaryButtonClass} disabled={busy}>
                Salvar
              </button>
              <button type="button" className={secondaryButtonClass} onClick={() => setDraft(null)}>
                Fechar
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-muted">Escolha um item para editar o preço, o limite do dia ou a nota de preparo.</p>
        )}
      </div>
    </div>
  );
}
