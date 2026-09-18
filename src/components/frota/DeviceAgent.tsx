"use client";

import { FormEvent, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { AgentSnapshot, CatalogApp, DeviceCommand, GeoPoint } from "@/lib/frota/types";

const TOKEN_KEY = "l2_frota_device_token";

const APP_ICON: Record<string, string> = {
  telefone: "📞",
  sms: "💬",
  camera: "📷",
  mapas: "🗺️",
  whatsapp: "🟢",
  email: "✉️",
  navegador: "🌐",
  instagram: "📸",
  youtube: "▶️",
  tiktok: "♪",
  facebook: "f",
  spotify: "♫",
};

type SyncPayload = {
  snapshot: AgentSnapshot;
  commands: DeviceCommand[];
};

function readToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

async function agentFetch(path: string, token: string | null, body: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as SyncPayload & { token?: string; error?: string };
  if (!res.ok) throw new Error(data.error || "Falha de comunicação.");
  return data;
}

function beep() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 880;
  gain.gain.value = 0.08;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.9);
}

function subscribeToken() {
  return () => undefined;
}

function getTokenSnapshot() {
  return readToken();
}

export function DeviceAgent({ initialCode = "" }: { initialCode?: string }) {
  const storedToken = useSyncExternalStore(subscribeToken, getTokenSnapshot, () => null);
  const [code, setCode] = useState(initialCode.replace(/\D/g, "").slice(0, 6));
  const [sessionToken, setSessionToken] = useState<string | null | undefined>(undefined);
  const token = sessionToken === undefined ? storedToken : sessionToken;
  const [snapshot, setSnapshot] = useState<AgentSnapshot | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [ringing, setRinging] = useState(false);
  const [dialer, setDialer] = useState<null | "telefone" | "sms">(null);
  const [number, setNumber] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [hasGps, setHasGps] = useState(false);
  const locationRef = useRef<GeoPoint | null>(null);
  const ackedRef = useRef<string[]>([]);
  const ringTimer = useRef<number | null>(null);

  const applyCommands = useCallback((commands: DeviceCommand[]) => {
    const ids: string[] = [];
    for (const command of commands) {
      ids.push(command.id);
      if (command.type === "ring") {
        setRinging(true);
        if (typeof navigator.vibrate === "function") navigator.vibrate([200, 80, 200, 80, 400]);
        try {
          beep();
        } catch {
          /* autoplay may be blocked until tap */
        }
        if (ringTimer.current) window.clearTimeout(ringTimer.current);
        ringTimer.current = window.setTimeout(() => setRinging(false), 8000);
      }
    }
    if (ids.length) ackedRef.current = [...ackedRef.current, ...ids].slice(-40);
  }, []);

  const sync = useCallback(
    async (currentToken: string, location?: GeoPoint | null) => {
      const battery = await readBattery();
      const result = await agentFetch("/api/frota/agent/heartbeat", currentToken, {
        location: location ?? locationRef.current,
        model: navigator.userAgent.includes("iPhone") ? "iPhone" : "Android / Web",
        platform: navigator.platform || "Web",
        ackedCommandIds: ackedRef.current,
        ...battery,
      });
      setSnapshot(result.snapshot);
      applyCommands(result.commands || result.snapshot.commands || []);
      setError("");
    },
    [applyCommands],
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    sync(token).catch((err) => {
      if (cancelled) return;
      if (err instanceof Error && /não reconhecido/i.test(err.message)) {
        clearToken();
        setSessionToken(null);
        setSnapshot(null);
      }
      setError(err instanceof Error ? err.message : "Sem conexão com a central.");
    });

    const timer = window.setInterval(() => {
      sync(token).catch(() => undefined);
    }, 8000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [token, sync]);

  useEffect(() => {
    if (!token || !navigator.geolocation) return;
    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        const point: GeoPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          at: new Date().toISOString(),
        };
        locationRef.current = point;
        setHasGps(true);
        setGeoError("");
        sync(token, point).catch(() => undefined);
      },
      (err) => {
        setGeoError(err.message || "GPS indisponível.");
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [token, sync]);

  async function enroll(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await agentFetch("/api/frota/agent/enroll", null, {
        code,
        model: navigator.userAgent.includes("iPhone") ? "iPhone" : "Celular da operação",
        platform: navigator.platform || "Web",
      });
      if (!result.token) throw new Error("A central não devolveu a credencial.");
      writeToken(result.token);
      setSessionToken(result.token);
      setSnapshot(result.snapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Código inválido.");
    } finally {
      setBusy(false);
    }
  }

  function sendTestLocation() {
    if (!token) return;
    const point: GeoPoint = {
      lat: -23.5505,
      lng: -46.6333,
      accuracy: 35,
      at: new Date().toISOString(),
    };
    locationRef.current = point;
    setHasGps(true);
    setGeoError("");
    sync(token, point).catch((err) => setError(err instanceof Error ? err.message : "Falha ao enviar posição."));
  }

  function openApp(app: CatalogApp) {
    if (snapshot?.locked) return;
    if (app.id === "telefone" || app.id === "sms") {
      setDialer(app.id);
      return;
    }
    if (app.id === "camera") {
      setCameraOpen(true);
      return;
    }
    window.open(app.href, "_self");
  }

  const locked = Boolean(snapshot?.locked);
  const apps = snapshot?.apps || [];

  const clock = useClock();

  if (!token || !snapshot) {
    return (
      <PhoneShell>
        <div className="flex flex-1 flex-col justify-center px-6 py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-bright">L² Controle</p>
          <h1 className="mt-3 font-display text-3xl font-semibold">Parear aparelho</h1>
          <p className="mt-3 text-sm text-white/65">
            Digite o código gerado na central. Depois, adicione este app à tela inicial e deixe o GPS ligado.
          </p>
          <form onSubmit={enroll} className="mt-8 space-y-4">
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="w-full rounded-md border border-white/15 bg-white/5 px-4 py-4 text-center font-display text-3xl tracking-[0.4em] outline-none focus:border-accent"
              required
            />
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            <button
              type="submit"
              disabled={busy || code.length < 6}
              className="w-full rounded-md bg-accent py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              Parear com a frota
            </button>
          </form>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell locked={locked}>
      <header className="flex items-center justify-between px-5 pt-6 text-xs text-white/60">
        <span>{clock}</span>
        <span>
          {snapshot.name}
          {hasGps ? " · GPS" : ""}
        </span>
      </header>

      <div className="px-5 pt-6">
        <p className="text-xs uppercase tracking-[0.18em] text-accent-bright">
          {snapshot.area === "operacao" ? "Modo operação" : snapshot.policy.name}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold">
          {snapshot.operator && snapshot.operator !== "A definir" ? snapshot.operator : snapshot.name}
        </h1>
        {snapshot.destination ? (
          <p className="mt-1 text-sm text-white/70">{snapshot.destination}</p>
        ) : null}
        <p className="mt-1 text-sm text-white/55">
          {snapshot.area === "operacao"
            ? "Só o essencial. Redes sociais bloqueadas pela central."
            : "Aplicativos liberados neste aparelho."}
        </p>
      </div>

      {geoError ? (
        <div className="mx-5 mt-4 rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
          {geoError}{" "}
          <button type="button" className="underline" onClick={sendTestLocation}>
            Enviar posição de teste
          </button>
        </div>
      ) : null}
      {error ? <p className="mx-5 mt-3 text-xs text-red-300">{error}</p> : null}

      <ul className="mt-8 grid grid-cols-3 gap-4 px-5">
        {apps.map((app) => (
          <li key={app.id}>
            <button
              type="button"
              onClick={() => openApp(app)}
              className="flex w-full flex-col items-center gap-2 text-center"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                {APP_ICON[app.id] || "•"}
              </span>
              <span className="text-[11px] font-medium text-white/80">{app.name}</span>
            </button>
          </li>
        ))}
      </ul>

      {dialer ? (
        <DialSheet
          mode={dialer}
          number={number}
          onNumber={setNumber}
          onClose={() => setDialer(null)}
        />
      ) : null}

      {cameraOpen ? (
        <div className="absolute inset-0 z-20 flex flex-col bg-black/90 p-5">
          <p className="font-display text-lg">Câmera da operação</p>
          <p className="mt-2 text-sm text-white/60">Tire a foto pelo aparelho e anexe ao chamado da central.</p>
          <input
            className="mt-6 text-sm"
            type="file"
            accept="image/*"
            capture="environment"
          />
          <button type="button" className="mt-auto rounded-md bg-white/10 py-3" onClick={() => setCameraOpen(false)}>
            Fechar
          </button>
        </div>
      ) : null}

      {ringing && !locked ? (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-accent/95 px-6 text-center">
          <p className="font-display text-2xl font-semibold">A central está localizando este aparelho</p>
          <button type="button" className="mt-8 rounded-md bg-white px-5 py-2 text-sm font-semibold text-ink" onClick={() => setRinging(false)}>
            Ok, encontrei
          </button>
        </div>
      ) : null}

      {locked ? (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#140b0b] px-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-red-300">Bloqueado pela central</p>
          <p className="mt-4 font-display text-3xl font-semibold text-white">{snapshot.lockMessage}</p>
          <p className="mt-6 text-sm text-white/50">
            {snapshot.name} · {snapshot.operator}
          </p>
          {snapshot.centralPhone ? (
            <a
              href={`tel:${snapshot.centralPhone.replace(/\s/g, "")}`}
              className="mt-8 rounded-md bg-white px-5 py-3 text-sm font-semibold text-ink"
            >
              Ligar para a central
            </a>
          ) : null}
          <p className="mt-10 text-xs text-white/35">Somente a central pode desbloquear.</p>
        </div>
      ) : null}

      <footer className="mt-auto flex items-center justify-between px-5 py-5 text-[11px] text-white/35">
        <span>{snapshot.companyName || "Sincronizado com L²"}</span>
        {snapshot.area === "operacao" ? (
          <span>Modo campo</span>
        ) : (
          <button
            type="button"
            onClick={() => {
              clearToken();
              setSessionToken(null);
              setSnapshot(null);
            }}
          >
            Desparear
          </button>
        )}
      </footer>
    </PhoneShell>
  );
}

function PhoneShell({ children, locked = false }: { children: React.ReactNode; locked?: boolean }) {
  return (
    <div className="min-h-svh bg-[#0f1620] text-white">
      <div
        className={`relative mx-auto flex min-h-svh w-full max-w-[430px] flex-col ${locked ? "overflow-hidden" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}

function DialSheet({
  mode,
  number,
  onNumber,
  onClose,
}: {
  mode: "telefone" | "sms";
  number: string;
  onNumber: (value: string) => void;
  onClose: () => void;
}) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-[#121820] px-6 py-6">
      <button type="button" className="self-start text-sm text-white/50" onClick={onClose}>
        Voltar
      </button>
      <p className="mt-4 text-xs uppercase tracking-widest text-white/40">
        {mode === "telefone" ? "Telefone" : "Mensagem"}
      </p>
      <p className="mt-2 min-h-[2.5rem] font-display text-3xl tracking-wide">{number || "—"}</p>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            className="rounded-full bg-white/8 py-4 text-xl"
            onClick={() => onNumber((number + key).slice(0, 16))}
          >
            {key}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="mt-6 rounded-md bg-accent py-3 text-sm font-semibold"
        onClick={() => {
          if (!number) return;
          window.open(mode === "telefone" ? `tel:${number}` : `sms:${number}`, "_self");
        }}
      >
        {mode === "telefone" ? "Ligar" : "Abrir SMS"}
      </button>
      <button type="button" className="mt-3 text-sm text-white/40" onClick={() => onNumber(number.slice(0, -1))}>
        Apagar
      </button>
    </div>
  );
}

async function readBattery() {
  const nav = navigator as Navigator & {
    getBattery?: () => Promise<{ level: number; charging: boolean }>;
  };
  if (!nav.getBattery) return {};
  const battery = await nav.getBattery();
  return {
    battery: Math.round(battery.level * 100),
    charging: battery.charging,
  };
}

function useClock() {
  const [value, setValue] = useState("");
  useEffect(() => {
    const tick = () =>
      setValue(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, []);
  return value;
}
