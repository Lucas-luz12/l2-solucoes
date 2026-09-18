import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { APP_CATALOG, DEFAULT_POLICIES, appsForPolicy } from "./catalog";
import { enrollmentCode, hashToken, newId } from "./auth";
import type {
  AgentSnapshot,
  CommandType,
  Device,
  DeviceArea,
  FrotaStore,
  GeoPoint,
  Policy,
  PublicDevice,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "frota.json");
const ONLINE_MS = 90_000;
const HISTORY_LIMIT = 40;

let queue: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function nowIso() {
  return new Date().toISOString();
}

function hoursAgo(hours: number, extraMinutes = 0) {
  return new Date(Date.now() - hours * 3600_000 - extraMinutes * 60_000).toISOString();
}

function point(lat: number, lng: number, at: string, accuracy = 12): GeoPoint {
  return { lat, lng, at, accuracy };
}

function seedStore(): FrotaStore {
  const opPolicy = DEFAULT_POLICIES[0];
  const officePolicy = DEFAULT_POLICIES[1];
  const freePolicy = DEFAULT_POLICIES[2];

  const devices: Device[] = [
    {
      id: "dev-op-01",
      name: "OP-01",
      enrollmentCode: null,
      enrolled: true,
      tokenHash: null,
      model: "Samsung Galaxy A15",
      platform: "Android",
      operator: "Carlos Mendes",
      area: "operacao",
      policyId: opPolicy.id,
      locked: false,
      lockMessage: "Aparelho bloqueado pela central. Entregue na operação.",
      lastSeenAt: hoursAgo(0, 0.4),
      location: point(-23.5489, -46.6388, hoursAgo(0, 0.4)),
      locationHistory: [
        point(-23.5512, -46.6341, hoursAgo(0, 38)),
        point(-23.5496, -46.6369, hoursAgo(0, 18)),
        point(-23.5489, -46.6388, hoursAgo(0, 0.4)),
      ],
      battery: 74,
      charging: false,
      demo: true,
      notes: "Rota zona central",
      createdAt: hoursAgo(48),
      pendingCommands: [],
    },
    {
      id: "dev-op-02",
      name: "OP-02",
      enrollmentCode: null,
      enrolled: true,
      tokenHash: null,
      model: "Motorola G54",
      platform: "Android",
      operator: "Fernanda Alves",
      area: "operacao",
      policyId: opPolicy.id,
      locked: true,
      lockMessage: "Aparelho bloqueado após perda de contato. Contate a central.",
      lastSeenAt: hoursAgo(0, 8),
      location: point(-23.5614, -46.6556, hoursAgo(0, 8)),
      locationHistory: [
        point(-23.5581, -46.6492, hoursAgo(1, 10)),
        point(-23.5614, -46.6556, hoursAgo(0, 8)),
      ],
      battery: 19,
      charging: false,
      demo: true,
      notes: "Bloqueio de teste / perda",
      createdAt: hoursAgo(72),
      pendingCommands: [],
    },
    {
      id: "dev-op-03",
      name: "OP-03",
      enrollmentCode: null,
      enrolled: true,
      tokenHash: null,
      model: "Redmi Note 13",
      platform: "Android",
      operator: "João Ribeiro",
      area: "operacao",
      policyId: opPolicy.id,
      locked: false,
      lockMessage: "Aparelho bloqueado pela central. Entregue na operação.",
      lastSeenAt: hoursAgo(3, 20),
      location: point(-23.5324, -46.7916, hoursAgo(3, 20)),
      locationHistory: [point(-23.5324, -46.7916, hoursAgo(3, 20))],
      battery: 41,
      charging: false,
      demo: true,
      notes: "Sem sinal recente — conferir no retorno",
      createdAt: hoursAgo(96),
      pendingCommands: [],
    },
    {
      id: "dev-esc-01",
      name: "ESC-Recepção",
      enrollmentCode: null,
      enrolled: true,
      tokenHash: null,
      model: "iPhone 12",
      platform: "iOS",
      operator: "Recepção",
      area: "escritorio",
      policyId: officePolicy.id,
      locked: false,
      lockMessage: "Aparelho bloqueado pela central.",
      lastSeenAt: hoursAgo(0, 1),
      location: point(-23.5505, -46.6333, hoursAgo(0, 1)),
      locationHistory: [point(-23.5505, -46.6333, hoursAgo(0, 1))],
      battery: 91,
      charging: true,
      demo: true,
      notes: "Permanece no escritório",
      createdAt: hoursAgo(120),
      pendingCommands: [],
    },
    {
      id: "dev-res-01",
      name: "RES-04",
      enrollmentCode: "482913",
      enrolled: false,
      tokenHash: null,
      model: "",
      platform: "",
      operator: "A definir",
      area: "reserva",
      policyId: freePolicy.id,
      locked: false,
      lockMessage: "Aparelho bloqueado pela central. Entregue na operação.",
      lastSeenAt: null,
      location: null,
      locationHistory: [],
      battery: null,
      charging: false,
      demo: true,
      notes: "Aguardando pareamento. Código de exemplo: 482913",
      createdAt: hoursAgo(6),
      pendingCommands: [],
    },
  ];

  return {
    devices,
    policies: DEFAULT_POLICIES.map((policy) => ({ ...policy })),
    events: [
      {
        id: newId(),
        at: hoursAgo(0, 8),
        deviceId: "dev-op-02",
        action: "lock",
        detail: "OP-02 bloqueado pela central (exemplo).",
      },
      {
        id: newId(),
        at: hoursAgo(0, 0.4),
        deviceId: "dev-op-01",
        action: "heartbeat",
        detail: "OP-01 enviou posição na zona central.",
      },
    ],
  };
}

async function readStore(): Promise<FrotaStore> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as FrotaStore;
    if (!Array.isArray(parsed.devices) || !Array.isArray(parsed.policies)) {
      return seedStore();
    }
    return parsed;
  } catch {
    const seeded = seedStore();
    await persist(seeded);
    return seeded;
  }
}

async function persist(store: FrotaStore) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
  await rename(tmp, DATA_FILE);
}

function isOnline(device: Device) {
  if (!device.lastSeenAt) return false;
  const windowMs = device.demo ? 15 * 60_000 : ONLINE_MS;
  return Date.now() - new Date(device.lastSeenAt).getTime() < windowMs;
}

export function toPublicDevice(device: Device): PublicDevice {
  const { tokenHash, pendingCommands, ...rest } = device;
  void tokenHash;
  return {
    ...rest,
    online: isOnline(device) && device.enrolled,
    pendingCommandCount: pendingCommands.filter((cmd) => !cmd.ackedAt).length,
  };
}

function pushEvent(
  store: FrotaStore,
  action: string,
  detail: string,
  deviceId?: string,
) {
  store.events.unshift({
    id: newId(),
    at: nowIso(),
    deviceId,
    action,
    detail,
  });
  store.events = store.events.slice(0, 200);
}

function policyOf(store: FrotaStore, policyId: string): Policy {
  return (
    store.policies.find((policy) => policy.id === policyId) ||
    store.policies[0] ||
    DEFAULT_POLICIES[0]
  );
}

export async function getSnapshot() {
  return withLock(async () => {
    const store = await readStore();
    return {
      devices: store.devices.map(toPublicDevice),
      policies: store.policies,
      events: store.events.slice(0, 80),
      catalog: APP_CATALOG,
    };
  });
}

export async function createDevice(input: {
  name: string;
  operator: string;
  area: DeviceArea;
  policyId: string;
  notes?: string;
}) {
  return withLock(async () => {
    const store = await readStore();
    const name = input.name.trim();
    if (!name) throw new Error("Informe o nome do aparelho.");
    const code = enrollmentCode();
    const device: Device = {
      id: `dev-${newId()}`,
      name,
      enrollmentCode: code,
      enrolled: false,
      tokenHash: null,
      model: "",
      platform: "",
      operator: input.operator.trim() || "A definir",
      area: input.area,
      policyId: store.policies.some((p) => p.id === input.policyId)
        ? input.policyId
        : store.policies[0].id,
      locked: false,
      lockMessage: "Aparelho bloqueado pela central. Entregue na operação.",
      lastSeenAt: null,
      location: null,
      locationHistory: [],
      battery: null,
      charging: false,
      demo: false,
      notes: input.notes?.trim() || "",
      createdAt: nowIso(),
      pendingCommands: [],
    };
    store.devices.unshift(device);
    pushEvent(store, "enroll_created", `${device.name} aguardando pareamento (${code}).`, device.id);
    await persist(store);
    return toPublicDevice(device);
  });
}

export async function updateDevice(
  id: string,
  patch: Partial<
    Pick<
      Device,
      "name" | "operator" | "area" | "policyId" | "notes" | "lockMessage" | "locked"
    >
  >,
) {
  return withLock(async () => {
    const store = await readStore();
    const device = store.devices.find((item) => item.id === id);
    if (!device) throw new Error("Aparelho não encontrado.");
    if (patch.name?.trim()) device.name = patch.name.trim();
    if (patch.operator !== undefined) device.operator = patch.operator.trim();
    if (patch.area) device.area = patch.area;
    if (patch.policyId && store.policies.some((p) => p.id === patch.policyId)) {
      device.policyId = patch.policyId;
    }
    if (patch.notes !== undefined) device.notes = patch.notes;
    if (patch.lockMessage !== undefined) device.lockMessage = patch.lockMessage;
    if (patch.locked !== undefined) device.locked = patch.locked;
    pushEvent(store, "update", `${device.name} atualizado.`, device.id);
    await persist(store);
    return toPublicDevice(device);
  });
}

export async function deleteDevice(id: string) {
  return withLock(async () => {
    const store = await readStore();
    const device = store.devices.find((item) => item.id === id);
    if (!device) throw new Error("Aparelho não encontrado.");
    store.devices = store.devices.filter((item) => item.id !== id);
    pushEvent(store, "delete", `${device.name} removido da frota.`);
    await persist(store);
  });
}

export async function issueCommand(
  id: string,
  type: CommandType,
  message?: string,
) {
  return withLock(async () => {
    const store = await readStore();
    const device = store.devices.find((item) => item.id === id);
    if (!device) throw new Error("Aparelho não encontrado.");

    if (type === "lock") {
      device.locked = true;
      if (message?.trim()) device.lockMessage = message.trim();
    }
    if (type === "unlock") {
      device.locked = false;
    }

    const command = {
      id: newId(),
      type,
      payload: message?.trim() ? { message: message.trim() } : undefined,
      createdAt: nowIso(),
    };
    device.pendingCommands.push(command);
    const labels: Record<CommandType, string> = {
      lock: "bloqueado",
      unlock: "desbloqueado",
      locate: "pedido de localização",
      ring: "toque para localizar",
      message: "mensagem enviada",
    };
    pushEvent(store, type, `${device.name}: ${labels[type]}.`, device.id);
    await persist(store);
    return toPublicDevice(device);
  });
}

export async function savePolicy(policy: Policy) {
  return withLock(async () => {
    const store = await readStore();
    const allowedAppIds = policy.allowedAppIds.filter((id) =>
      APP_CATALOG.some((app) => app.id === id),
    );
    if (allowedAppIds.length === 0) {
      throw new Error("A política precisa de pelo menos um aplicativo.");
    }
    const existing = store.policies.find((item) => item.id === policy.id);
    const next: Policy = {
      id: existing?.id || `politica-${newId()}`,
      name: policy.name.trim() || "Nova política",
      description: policy.description.trim(),
      allowedAppIds,
      kioskMode: Boolean(policy.kioskMode),
    };
    if (existing) {
      Object.assign(existing, next);
    } else {
      store.policies.push(next);
    }
    pushEvent(store, "policy", `Política “${next.name}” salva.`);
    await persist(store);
    return next;
  });
}

export async function enrollDevice(input: {
  code: string;
  model?: string;
  platform?: string;
  token: string;
}) {
  return withLock(async () => {
    const store = await readStore();
    const code = input.code.replace(/\D/g, "");
    const device = store.devices.find(
      (item) => item.enrollmentCode === code && !item.enrolled,
    );
    if (!device) throw new Error("Código inválido ou já utilizado.");
    device.enrolled = true;
    device.enrollmentCode = null;
    device.tokenHash = hashToken(input.token);
    device.model = input.model?.trim() || device.model;
    device.platform = input.platform?.trim() || device.platform || "Web";
    device.lastSeenAt = nowIso();
    device.demo = false;
    pushEvent(store, "enrolled", `${device.name} pareado com sucesso.`, device.id);
    await persist(store);
    return { device, snapshot: agentSnapshot(store, device) };
  });
}

export async function heartbeat(input: {
  token: string;
  location?: GeoPoint | null;
  battery?: number | null;
  charging?: boolean;
  model?: string;
  platform?: string;
  ackedCommandIds?: string[];
}) {
  return withLock(async () => {
    const store = await readStore();
    const tokenHash = hashToken(input.token);
    const device = store.devices.find((item) => item.tokenHash === tokenHash);
    if (!device) throw new Error("Aparelho não reconhecido.");

    device.lastSeenAt = nowIso();
    if (typeof input.battery === "number") {
      device.battery = Math.max(0, Math.min(100, Math.round(input.battery)));
    }
    if (typeof input.charging === "boolean") device.charging = input.charging;
    if (input.model?.trim()) device.model = input.model.trim();
    if (input.platform?.trim()) device.platform = input.platform.trim();

    if (input.location && Number.isFinite(input.location.lat) && Number.isFinite(input.location.lng)) {
      const geo: GeoPoint = {
        lat: input.location.lat,
        lng: input.location.lng,
        accuracy: input.location.accuracy,
        at: nowIso(),
      };
      device.location = geo;
      device.locationHistory = [...device.locationHistory, geo].slice(-HISTORY_LIMIT);
    }

    const acked = new Set(input.ackedCommandIds || []);
    for (const command of device.pendingCommands) {
      if (acked.has(command.id) && !command.ackedAt) {
        command.ackedAt = nowIso();
      }
    }
    const pending = device.pendingCommands.filter((cmd) => !cmd.ackedAt);
    device.pendingCommands = device.pendingCommands.slice(-30);

    await persist(store);
    return { snapshot: agentSnapshot(store, device), commands: pending };
  });
}

function agentSnapshot(store: FrotaStore, device: Device): AgentSnapshot {
  const policy = policyOf(store, device.policyId);
  return {
    deviceId: device.id,
    name: device.name,
    operator: device.operator,
    area: device.area,
    locked: device.locked,
    lockMessage: device.lockMessage,
    policy,
    apps: appsForPolicy(policy),
    commands: device.pendingCommands.filter((cmd) => !cmd.ackedAt),
  };
}

export async function resetDemoData() {
  return withLock(async () => {
    const seeded = seedStore();
    await persist(seeded);
    return {
      devices: seeded.devices.map(toPublicDevice),
      policies: seeded.policies,
      events: seeded.events,
      catalog: APP_CATALOG,
    };
  });
}
