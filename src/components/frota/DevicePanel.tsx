"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { FleetMap, OsmLink } from "@/components/frota/FleetMap";
import type { CatalogApp, Policy, PublicDevice } from "@/lib/frota/types";

const AREA_LABEL: Record<PublicDevice["area"], string> = {
  operacao: "Operação",
  escritorio: "Escritório",
  reserva: "Reserva",
};

export function statusOf(device: PublicDevice) {
  if (!device.enrolled) return { label: "Aguardando pareamento", className: "bg-amber-100 text-amber-800" };
  if (device.locked) return { label: "Bloqueado", className: "bg-red-100 text-red-800" };
  if (device.area === "operacao" && device.online) {
    return { label: "Em campo", className: "bg-accent/15 text-accent" };
  }
  if (device.online) return { label: "Online", className: "bg-emerald-100 text-emerald-800" };
  return { label: "Offline", className: "bg-slate-100 text-slate-600" };
}

export function attentionReason(device: PublicDevice) {
  if (device.locked) return "Bloqueado — precisa da central";
  if (!device.enrolled) return "Ainda não pareado";
  if (device.area === "operacao" && !device.online) return "Em campo sem sinal";
  if (device.area === "operacao" && device.battery != null && device.battery <= 20) {
    return "Bateria baixa em campo";
  }
  return null;
}

export function formatWhen(iso: string | null) {
  if (!iso) return "nunca";
  return new Date(iso).toLocaleString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

type DevicePanelProps = {
  device: PublicDevice;
  policies: Policy[];
  catalog: CatalogApp[];
  busy: string;
  onCommand: (type: "lock" | "unlock" | "locate" | "ring", message?: string) => Promise<void>;
  onSave: (patch: Partial<PublicDevice>) => Promise<void>;
  onDelete: () => Promise<void>;
  onLifecycle: (
    action: "checkout" | "checkin" | "lost",
    payload?: { operator: string; destination: string; expectedReturnAt: string | null },
  ) => Promise<void>;
};

export function DevicePanel({
  device,
  policies,
  catalog,
  busy,
  onCommand,
  onSave,
  onDelete,
  onLifecycle,
}: DevicePanelProps) {
  const inField = device.area === "operacao";
  const [operator, setOperator] = useState(device.operator === "A definir" ? "" : device.operator);
  const [destination, setDestination] = useState(device.destination || "");
  const [returnDate, setReturnDate] = useState(device.expectedReturnAt ? device.expectedReturnAt.slice(0, 10) : "");
  const [notes, setNotes] = useState(device.notes);
  const policy = policies.find((item) => item.id === device.policyId);
  const status = statusOf(device);
  const enrollUrl = device.enrollmentCode ? `/aparelho?codigo=${device.enrollmentCode}` : "";
  const allowed = new Set(policy?.allowedAppIds || []);

  async function submitCheckout(event: FormEvent) {
    event.preventDefault();
    await onLifecycle("checkout", {
      operator,
      destination,
      expectedReturnAt: returnDate ? new Date(`${returnDate}T18:00:00`).toISOString() : null,
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-2xl font-semibold text-ink">{device.name}</p>
          <p className="text-sm text-muted">
            {device.model || "Modelo ainda não informado"}
            {device.platform ? ` · ${device.platform}` : ""}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
      </div>

      {device.enrollmentCode ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-900">Código de pareamento</p>
          <p className="mt-1 font-display text-3xl tracking-[0.3em] text-ink">{device.enrollmentCode}</p>
          {enrollUrl ? (
            <Link href={enrollUrl} className="mt-2 block break-all text-xs text-amber-800">
              Abra no celular: {enrollUrl}
            </Link>
          ) : null}
        </div>
      ) : null}

      {inField ? (
        <div className="mt-4 rounded-md border border-accent/25 bg-accent/8 px-4 py-3 text-sm">
          <p className="font-medium text-ink">
            Com {device.operator}
            {device.destination ? ` · ${device.destination}` : ""}
          </p>
          <p className="mt-1 text-muted">
            Saiu {formatWhen(device.checkedOutAt)}
            {device.expectedReturnAt ? ` · retorno previsto ${formatWhen(device.expectedReturnAt)}` : ""}
          </p>
          <p className="mt-2 text-xs text-accent">Política de campo ativa — redes sociais bloqueadas neste aparelho.</p>
        </div>
      ) : null}

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <Info
          label="Bateria"
          value={device.battery == null ? "—" : `${device.battery}%${device.charging ? " (carga)" : ""}`}
        />
        <Info label="Último sinal" value={formatWhen(device.lastSeenAt)} />
        <Info
          label="GPS"
          value={
            device.location ? `${device.location.lat.toFixed(5)}, ${device.location.lng.toFixed(5)}` : "sem posição"
          }
        />
      </dl>

      {device.location ? (
        <div className="mt-4">
          <FleetMap devices={[device]} selectedId={device.id} height="h-48" />
          <div className="mt-2">
            <OsmLink lat={device.location.lat} lng={device.location.lng} />
          </div>
        </div>
      ) : null}

      <div className="mt-6 rounded-md border border-line bg-surface p-4">
        <p className="text-sm font-semibold text-ink">Ciclo da operação</p>
        {inField ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => onLifecycle("checkin")}
              className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Registrar retorno
            </button>
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => {
                if (window.confirm(`Marcar ${device.name} como sumiço? Vamos bloquear, tocar e pedir o GPS.`)) {
                  void onLifecycle("lost");
                }
              }}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Aparelho sumiu
            </button>
          </div>
        ) : (
          <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={submitCheckout}>
            <label className="text-sm sm:col-span-1">
              <span className="mb-1 block text-muted">Quem leva</span>
              <input
                required
                value={operator}
                onChange={(event) => setOperator(event.target.value)}
                placeholder="Nome do operador"
                className="w-full rounded-md border border-line bg-surface-elevated px-3 py-2 outline-none focus:border-accent"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted">Destino / rota</span>
              <input
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder="Obra, cliente, zona"
                className="w-full rounded-md border border-line bg-surface-elevated px-3 py-2 outline-none focus:border-accent"
              />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block text-muted">Retorno previsto</span>
              <input
                type="date"
                value={returnDate}
                onChange={(event) => setReturnDate(event.target.value)}
                className="w-full rounded-md border border-line bg-surface-elevated px-3 py-2 outline-none focus:border-accent"
              />
            </label>
            <button
              type="submit"
              disabled={Boolean(busy)}
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-bright sm:col-span-2"
            >
              Mandar para a operação
            </button>
            <p className="text-xs text-muted sm:col-span-2">
              Isso aplica a política de campo: só telefone, mensagens, câmera, mapas e WhatsApp.
            </p>
          </form>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => onCommand("lock")}
          className="rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Só bloquear
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => onCommand("unlock")}
          className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-accent disabled:opacity-50"
        >
          Desbloquear
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => onCommand("locate")}
          className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-accent disabled:opacity-50"
        >
          Localizar
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => onCommand("ring")}
          className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-accent disabled:opacity-50"
        >
          Tocar
        </button>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-ink-soft">Apps neste aparelho</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {catalog.map((app) => (
            <li
              key={app.id}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                allowed.has(app.id) ? "bg-accent/15 text-accent" : "bg-slate-100 text-slate-400 line-through"
              }`}
            >
              {app.name}
            </li>
          ))}
        </ul>
      </div>

      <label className="mt-6 block text-sm">
        <span className="mb-1 block text-muted">Notas internas</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={2}
          className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-accent"
        />
      </label>
      <button
        type="button"
        disabled={busy === "save"}
        onClick={() => onSave({ notes })}
        className="mt-3 rounded-md border border-line px-4 py-2 text-sm font-medium text-ink"
      >
        Salvar notas
      </button>
      <button type="button" onClick={onDelete} className="mt-6 block text-sm text-red-600 hover:underline">
        Remover aparelho
      </button>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-surface px-3 py-2">
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{value}</dd>
    </div>
  );
}

export { AREA_LABEL };
