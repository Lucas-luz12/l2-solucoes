"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { FleetMap, OsmLink } from "@/components/frota/FleetMap";
import type { CatalogApp, Policy, PublicDevice, AuditEvent } from "@/lib/frota/types";

type Snapshot = {
  devices: PublicDevice[];
  policies: Policy[];
  events: AuditEvent[];
  catalog: CatalogApp[];
};

type Tab = "visao" | "aparelhos" | "mapa" | "politicas";

const AREA_LABEL: Record<PublicDevice["area"], string> = {
  operacao: "Operação",
  escritorio: "Escritório",
  reserva: "Reserva",
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || "Falha na requisição.");
  return data;
}

function statusOf(device: PublicDevice) {
  if (!device.enrolled) return { label: "Aguardando pareamento", className: "bg-amber-100 text-amber-800" };
  if (device.locked) return { label: "Bloqueado", className: "bg-red-100 text-red-800" };
  if (device.online) return { label: "Online", className: "bg-emerald-100 text-emerald-800" };
  return { label: "Offline", className: "bg-slate-100 text-slate-600" };
}

function formatWhen(iso: string | null) {
  if (!iso) return "nunca";
  const date = new Date(iso);
  return date.toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
}

export function Dashboard() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [defaultPin, setDefaultPin] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [tab, setTab] = useState<Tab>("visao");
  const [data, setData] = useState<Snapshot | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    operator: "",
    area: "operacao" as PublicDevice["area"],
    policyId: "politica-operacao",
  });
  const [policyDraft, setPolicyDraft] = useState<Policy | null>(null);

  const refresh = useCallback(async () => {
    const snapshot = await api<Snapshot>("/api/frota/devices");
    setData(snapshot);
    setSelectedId((current) => current || snapshot.devices[0]?.id || null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    api<{ ok: boolean; usingDefaultPin: boolean }>("/api/frota/session")
      .then(async (session) => {
        if (cancelled) return;
        setDefaultPin(session.usingDefaultPin);
        setAuthed(session.ok);
        if (session.ok) await refresh();
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useEffect(() => {
    if (!authed) return;
    const timer = window.setInterval(() => {
      refresh().catch(() => undefined);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [authed, refresh]);

  const selected = useMemo(
    () => data?.devices.find((device) => device.id === selectedId) || null,
    [data, selectedId],
  );

  async function onLogin(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy("login");
    try {
      await api("/api/frota/login", { method: "POST", body: JSON.stringify({ pin }) });
      setAuthed(true);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "PIN incorreto.");
    } finally {
      setBusy("");
    }
  }

  async function run(label: string, fn: () => Promise<void>) {
    setError("");
    setBusy(label);
    try {
      await fn();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir.");
    } finally {
      setBusy("");
    }
  }

  async function sendCommand(type: "lock" | "unlock" | "locate" | "ring", message?: string) {
    if (!selected) return;
    await run(type, async () => {
      await api(`/api/frota/devices/${selected.id}/command`, {
        method: "POST",
        body: JSON.stringify({ type, message }),
      });
    });
  }

  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted">Carregando controle…</div>
    );
  }

  if (!authed) {
    return (
      <div className="flex min-h-svh flex-col bg-surface">
        <header className="border-b border-line bg-surface-elevated px-6 py-5">
          <div className="mx-auto flex max-w-lg items-center justify-between">
            <Wordmark size="sm" />
            <Link href="/" className="text-sm text-muted hover:text-accent">
              Voltar ao site
            </Link>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
          <p className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            L² Controle
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
            Central da frota
          </h1>
          <p className="mt-3 text-muted">
            Restrinja aplicativos, localize aparelhos em campo e bloqueie o celular se ele sair da operação.
          </p>
          <form onSubmit={onLogin} className="mt-10 space-y-4">
            <label className="block text-sm font-medium text-ink-soft" htmlFor="pin">
              PIN da central
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              className="w-full rounded-md border border-line bg-surface-elevated px-4 py-3 text-ink outline-none focus:border-accent"
              placeholder="••••"
              required
            />
            {defaultPin ? (
              <p className="text-sm text-muted">
                Primeiro acesso: PIN inicial <span className="font-semibold text-ink">2468</span>. Depois defina{" "}
                <code className="text-xs">FROTA_PIN</code> no servidor.
              </p>
            ) : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={busy === "login"}
              className="w-full rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-bright disabled:opacity-60"
            >
              Entrar
            </button>
          </form>
        </main>
      </div>
    );
  }

  const devices = data?.devices || [];
  const online = devices.filter((d) => d.online && !d.locked).length;
  const locked = devices.filter((d) => d.locked).length;
  const field = devices.filter((d) => d.area === "operacao").length;
  const policyById = Object.fromEntries((data?.policies || []).map((p) => [p.id, p]));

  return (
    <div className="min-h-svh bg-surface">
      <header className="sticky top-0 z-20 border-b border-line bg-surface-elevated/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4 md:px-6">
          <Wordmark size="sm" />
          <span className="hidden font-display text-sm font-semibold text-ink-soft sm:inline">Controle</span>
          <nav className="flex flex-1 flex-wrap gap-1" aria-label="Painel">
            {(
              [
                ["visao", "Visão geral"],
                ["aparelhos", "Aparelhos"],
                ["mapa", "Mapa"],
                ["politicas", "Políticas"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  tab === id ? "bg-accent text-white" : "text-ink-soft hover:bg-surface"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
          <Link href="/aparelho" className="text-sm font-medium text-accent hover:text-accent-bright">
            App do aparelho
          </Link>
          <button
            type="button"
            className="text-sm text-muted hover:text-ink"
            onClick={() =>
              run("logout", async () => {
                await api("/api/frota/logout", { method: "POST" });
                setAuthed(false);
              })
            }
          >
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {error ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        {tab === "visao" || tab === "aparelhos" ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
            <section>
              {tab === "visao" ? (
                <div className="mb-6 grid grid-cols-2 gap-3">
                  <Kpi label="Aparelhos" value={devices.length} />
                  <Kpi label="Em operação" value={field} />
                  <Kpi label="Online" value={online} />
                  <Kpi label="Bloqueados" value={locked} accent={locked > 0} />
                </div>
              ) : null}

              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-semibold text-ink">Frota</h2>
                <button
                  type="button"
                  onClick={() => setCreating((v) => !v)}
                  className="rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent-bright"
                >
                  Cadastrar
                </button>
              </div>

              {creating ? (
                <form
                  className="mb-4 space-y-3 rounded-md border border-line bg-surface-elevated p-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    run("create", async () => {
                      const result = await api<{ device: PublicDevice }>("/api/frota/devices", {
                        method: "POST",
                        body: JSON.stringify(draft),
                      });
                      setSelectedId(result.device.id);
                      setCreating(false);
                      setDraft({ name: "", operator: "", area: "operacao", policyId: "politica-operacao" });
                    });
                  }}
                >
                  <input
                    required
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="Nome (ex: OP-05)"
                    className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                  <input
                    value={draft.operator}
                    onChange={(e) => setDraft({ ...draft, operator: e.target.value })}
                    placeholder="Operador"
                    className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                  <select
                    value={draft.area}
                    onChange={(e) => setDraft({ ...draft, area: e.target.value as PublicDevice["area"] })}
                    className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
                  >
                    <option value="operacao">Operação</option>
                    <option value="escritorio">Escritório</option>
                    <option value="reserva">Reserva</option>
                  </select>
                  <select
                    value={draft.policyId}
                    onChange={(e) => setDraft({ ...draft, policyId: e.target.value })}
                    className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
                  >
                    {(data?.policies || []).map((policy) => (
                      <option key={policy.id} value={policy.id}>
                        {policy.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={busy === "create"}
                    className="w-full rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white"
                  >
                    Gerar código de pareamento
                  </button>
                </form>
              ) : null}

              <ul className="divide-y divide-line overflow-hidden rounded-md border border-line bg-surface-elevated">
                {devices.map((device) => {
                  const status = statusOf(device);
                  return (
                    <li key={device.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(device.id);
                          setTab("aparelhos");
                        }}
                        className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left ${
                          selectedId === device.id ? "bg-accent/10" : "hover:bg-surface"
                        }`}
                      >
                        <span>
                          <span className="block font-display font-semibold text-ink">{device.name}</span>
                          <span className="text-sm text-muted">
                            {device.operator} · {AREA_LABEL[device.area]}
                          </span>
                        </span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.className}`}>
                          {status.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="rounded-md border border-line bg-surface-elevated p-5 md:p-6">
              {selected ? (
                <DevicePanel
                  key={selected.id}
                  device={selected}
                  policies={data?.policies || []}
                  catalog={data?.catalog || []}
                  busy={busy}
                  onCommand={sendCommand}
                  onSave={(patch) =>
                    run("save", async () => {
                      await api(`/api/frota/devices/${selected.id}`, {
                        method: "PATCH",
                        body: JSON.stringify(patch),
                      });
                    })
                  }
                  onDelete={() =>
                    run("delete", async () => {
                      await api(`/api/frota/devices/${selected.id}`, { method: "DELETE" });
                      setSelectedId(null);
                    })
                  }
                />
              ) : (
                <p className="text-muted">Selecione um aparelho.</p>
              )}
            </section>
          </div>
        ) : null}

        {tab === "mapa" ? (
          <section className="space-y-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink">Localização da frota</h2>
              <p className="mt-1 text-muted">
                Os aparelhos enviam GPS pelo app da operação. Clique no pin para abrir o detalhe.
              </p>
            </div>
            <FleetMap
              devices={devices}
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                setTab("aparelhos");
              }}
              height="h-[28rem] md:h-[36rem]"
            />
          </section>
        ) : null}

        {tab === "politicas" ? (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_1fr]">
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink">Políticas de apps</h2>
              <p className="mt-2 text-sm text-muted">
                O que o aparelho pode abrir no modo operação. Redes sociais ficam fora da política de campo.
              </p>
              <ul className="mt-6 space-y-2">
                {(data?.policies || []).map((policy) => (
                  <li key={policy.id}>
                    <button
                      type="button"
                      onClick={() => setPolicyDraft({ ...policy, allowedAppIds: [...policy.allowedAppIds] })}
                      className={`w-full rounded-md border px-4 py-3 text-left ${
                        policyDraft?.id === policy.id
                          ? "border-accent bg-accent/10"
                          : "border-line bg-surface-elevated hover:border-accent"
                      }`}
                    >
                      <span className="block font-semibold text-ink">{policy.name}</span>
                      <span className="text-sm text-muted">{policy.allowedAppIds.length} apps</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="mt-4 text-sm font-medium text-accent"
                onClick={() =>
                  setPolicyDraft({
                    id: "",
                    name: "Nova política",
                    description: "",
                    allowedAppIds: ["telefone", "sms"],
                    kioskMode: true,
                  })
                }
              >
                Criar política
              </button>
            </div>
            {policyDraft ? (
              <form
                className="rounded-md border border-line bg-surface-elevated p-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  run("policy", async () => {
                    await api("/api/frota/policies", {
                      method: "POST",
                      body: JSON.stringify(policyDraft),
                    });
                  });
                }}
              >
                <label className="text-sm font-medium text-ink-soft">Nome</label>
                <input
                  value={policyDraft.name}
                  onChange={(e) => setPolicyDraft({ ...policyDraft, name: e.target.value })}
                  className="mt-1 mb-4 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-accent"
                />
                <label className="text-sm font-medium text-ink-soft">Descrição</label>
                <textarea
                  value={policyDraft.description}
                  onChange={(e) => setPolicyDraft({ ...policyDraft, description: e.target.value })}
                  rows={2}
                  className="mt-1 mb-4 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-accent"
                />
                <label className="mb-2 flex items-center gap-2 text-sm text-ink-soft">
                  <input
                    type="checkbox"
                    checked={policyDraft.kioskMode}
                    onChange={(e) => setPolicyDraft({ ...policyDraft, kioskMode: e.target.checked })}
                  />
                  Modo kiosk (tela cheia, só o permitido)
                </label>
                <p className="mt-4 mb-2 text-sm font-medium text-ink-soft">Aplicativos liberados</p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {(data?.catalog || []).map((app) => {
                    const checked = policyDraft.allowedAppIds.includes(app.id);
                    return (
                      <li key={app.id}>
                        <label className="flex cursor-pointer items-start gap-2 rounded-md border border-line px-3 py-2 text-sm">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const allowed = checked
                                ? policyDraft.allowedAppIds.filter((id) => id !== app.id)
                                : [...policyDraft.allowedAppIds, app.id];
                              setPolicyDraft({ ...policyDraft, allowedAppIds: allowed });
                            }}
                          />
                          <span>
                            <span className="block font-medium text-ink">{app.name}</span>
                            <span className="text-xs text-muted">{app.description}</span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
                <button
                  type="submit"
                  disabled={busy === "policy"}
                  className="mt-5 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-bright"
                >
                  Salvar política
                </button>
              </form>
            ) : (
              <p className="text-muted">Escolha uma política para editar.</p>
            )}
          </section>
        ) : null}

        {tab === "visao" ? (
          <section className="mt-8 rounded-md border border-line bg-surface-elevated p-5">
            <h3 className="font-display text-lg font-semibold text-ink">Como implantar nos celulares</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
              <li>Cadastre o aparelho aqui e anote o código de 6 dígitos.</li>
              <li>
                No celular da empresa, abra <strong className="text-ink">/aparelho</strong>, adicione à tela inicial e
                pareie com o código.
              </li>
              <li>Autorize a localização. A central passa a ver GPS, bateria e status.</li>
              <li>
                Aplique a política <strong className="text-ink">{policyById["politica-operacao"]?.name || "Operação de campo"}</strong>{" "}
                para esconder Instagram, TikTok, YouTube e o restante que não é da operação.
              </li>
              <li>Se o aparelho sumir: Localizar, Tocar e Bloquear. O bloqueio cobre a tela até a central liberar.</li>
            </ol>
            <p className="mt-3 text-xs text-muted">
              O app web controla a tela de operação e o bloqueio remoto. O bloqueio nativo do sistema Android/iOS (Device
              Owner / MDM da Apple) pode ser acoplado depois, no mesmo painel.
            </p>
            <button
              type="button"
              className="mt-4 text-sm text-muted underline hover:text-ink"
              onClick={() => run("reset", async () => api("/api/frota/reset-demo", { method: "POST" }))}
            >
              Restaurar frota de exemplo
            </button>
          </section>
        ) : null}

        {tab === "visao" && data?.events?.length ? (
          <section className="mt-6">
            <h3 className="mb-3 font-display text-lg font-semibold text-ink">Atividade</h3>
            <ul className="divide-y divide-line rounded-md border border-line bg-surface-elevated">
              {data.events.slice(0, 8).map((event) => (
                <li key={event.id} className="flex justify-between gap-4 px-4 py-3 text-sm">
                  <span className="text-ink-soft">{event.detail}</span>
                  <span className="shrink-0 text-muted">{formatWhen(event.at)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function Kpi({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-md border border-line bg-surface-elevated px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 font-display text-2xl font-semibold ${accent ? "text-red-600" : "text-ink"}`}>{value}</p>
    </div>
  );
}

function DevicePanel({
  device,
  policies,
  catalog,
  busy,
  onCommand,
  onSave,
  onDelete,
}: {
  device: PublicDevice;
  policies: Policy[];
  catalog: CatalogApp[];
  busy: string;
  onCommand: (type: "lock" | "unlock" | "locate" | "ring", message?: string) => Promise<void>;
  onSave: (patch: Partial<PublicDevice>) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [operator, setOperator] = useState(device.operator);
  const [policyId, setPolicyId] = useState(device.policyId);
  const [area, setArea] = useState(device.area);
  const [notes, setNotes] = useState(device.notes);
  const policy = policies.find((item) => item.id === device.policyId);
  const status = statusOf(device);
  const enrollUrl = device.enrollmentCode
    ? `/aparelho?codigo=${device.enrollmentCode}`
    : "";
  const allowed = new Set(policy?.allowedAppIds || []);

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
              {enrollUrl}
            </Link>
          ) : null}
        </div>
      ) : null}

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <Info label="Bateria" value={device.battery == null ? "—" : `${device.battery}%${device.charging ? " (carga)" : ""}`} />
        <Info label="Último sinal" value={formatWhen(device.lastSeenAt)} />
        <Info
          label="GPS"
          value={
            device.location
              ? `${device.location.lat.toFixed(5)}, ${device.location.lng.toFixed(5)}`
              : "sem posição"
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

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => onCommand("lock")}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          Bloquear
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

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-muted">Operador</span>
          <input
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-accent"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Área</span>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value as PublicDevice["area"])}
            className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-accent"
          >
            <option value="operacao">Operação</option>
            <option value="escritorio">Escritório</option>
            <option value="reserva">Reserva</option>
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block text-muted">Política de aplicativos</span>
          <select
            value={policyId}
            onChange={(e) => setPolicyId(e.target.value)}
            className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-accent"
          >
            {policies.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block text-muted">Notas</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-accent"
          />
        </label>
      </div>
      <button
        type="button"
        disabled={busy === "save"}
        onClick={() => onSave({ operator, policyId, area, notes })}
        className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white"
      >
        Salvar dados
      </button>

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

      <button type="button" onClick={onDelete} className="mt-8 text-sm text-red-600 hover:underline">
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
