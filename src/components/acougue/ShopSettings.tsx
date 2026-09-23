"use client";

import { useState, type FormEvent } from "react";
import type { Shop } from "@/lib/acougue/types";
import { fieldClass, primaryButtonClass, secondaryButtonClass } from "@/components/proposta/ui";
import { useAcougue } from "./AcougueProvider";
import { ShopImage } from "./ShopImage";
import { uploadShopImage } from "./upload";

export function ShopSettings() {
  const { data, saveShop, resetDemo } = useAcougue();
  const [shop, setShop] = useState<Shop>(data.shop);
  const [slots, setSlots] = useState(data.shop.slots.join("\n"));
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const demo = data.shop.slug === "estrela";

  function update(patch: Partial<Shop>) {
    setShop((current) => ({ ...current, ...patch }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await saveShop({ ...shop, slots: slots.split("\n") });
      setMessage("Dados da loja salvos. A vitrine usa este nome, endereço e horários.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    if (!window.confirm("Isso apaga as reservas desta demonstração e volta ao Açougue Estrela de exemplo.")) return;
    setBusy(true);
    setMessage(null);
    try {
      const next = await resetDemo();
      setShop(next.shop);
      setSlots(next.shop.slots.join("\n"));
      setMessage("Demonstração restaurada.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Não foi possível restaurar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl">
      <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">Loja</p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-ink">O que o cliente vê</h1>
      <p className="mt-2 text-muted">
        Um horário por linha. A reserva só aceita estes intervalos de retirada.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <p className="text-sm font-medium text-ink-soft">Logo</p>
          <div className="mt-2 flex items-center gap-4">
            {shop.logoUrl ? (
              <ShopImage src={shop.logoUrl} alt="" className="h-16 w-16 rounded-md object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-md bg-accent/10 font-display text-xl font-semibold text-accent">
                {shop.name.slice(0, 1) || "A"}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <label className={`${secondaryButtonClass} cursor-pointer`}>
                Enviar logo
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
                      const logoUrl = await uploadShopImage(file);
                      update({ logoUrl });
                      setMessage("Logo pronto. Salve a loja para publicar na vitrine.");
                    } catch (reason) {
                      setMessage(reason instanceof Error ? reason.message : "Não foi possível enviar o logo.");
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              </label>
              {shop.logoUrl ? (
                <button type="button" className={secondaryButtonClass} onClick={() => update({ logoUrl: null })}>
                  Remover
                </button>
              ) : null}
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">JPG, PNG ou WebP, até 2,5 MB.</p>
        </div>
        <label className="block text-sm font-medium text-ink-soft">
          Nome
          <input required value={shop.name} onChange={(event) => update({ name: event.target.value })} className={`${fieldClass} mt-1.5`} />
        </label>
        <label className="block text-sm font-medium text-ink-soft">
          Frase da vitrine
          <input value={shop.tagline} onChange={(event) => update({ tagline: event.target.value })} className={`${fieldClass} mt-1.5`} />
        </label>
        <label className="block text-sm font-medium text-ink-soft">
          Endereço
          <input value={shop.address} onChange={(event) => update({ address: event.target.value })} className={`${fieldClass} mt-1.5`} />
        </label>
        <label className="block text-sm font-medium text-ink-soft">
          Cidade
          <input value={shop.city} onChange={(event) => update({ city: event.target.value })} className={`${fieldClass} mt-1.5`} />
        </label>
        <label className="block text-sm font-medium text-ink-soft">
          Telefone
          <input value={shop.phone} onChange={(event) => update({ phone: event.target.value })} className={`${fieldClass} mt-1.5`} />
        </label>
        <label className="block text-sm font-medium text-ink-soft">
          WhatsApp
          <input value={shop.whatsapp} onChange={(event) => update({ whatsapp: event.target.value })} className={`${fieldClass} mt-1.5`} />
        </label>
        <label className="block text-sm font-medium text-ink-soft">
          Horário da loja
          <textarea value={shop.hours} onChange={(event) => update({ hours: event.target.value })} rows={2} className={`${fieldClass} mt-1.5 resize-y`} />
        </label>
        <label className="block text-sm font-medium text-ink-soft">
          Horários de retirada
          <textarea value={slots} onChange={(event) => setSlots(event.target.value)} rows={4} className={`${fieldClass} mt-1.5 resize-y`} />
        </label>
        <label className="block text-sm font-medium text-ink-soft">
          Aviso da reserva
          <textarea value={shop.pickupNote} onChange={(event) => update({ pickupNote: event.target.value })} rows={3} className={`${fieldClass} mt-1.5 resize-y`} />
        </label>
        {message ? <p className="text-sm text-ink-soft">{message}</p> : null}
        <div className="flex flex-wrap gap-3">
          <button type="submit" className={primaryButtonClass} disabled={busy}>
            Salvar loja
          </button>
          {demo ? (
            <button type="button" className={secondaryButtonClass} disabled={busy} onClick={onReset}>
              Restaurar demonstração
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
