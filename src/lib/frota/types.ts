export type DeviceArea = "operacao" | "escritorio" | "reserva";

export type AppCategory =
  | "essencial"
  | "comunicacao"
  | "navegacao"
  | "midia"
  | "outros";

export type CatalogApp = {
  id: string;
  name: string;
  category: AppCategory;
  description: string;
  href: string;
  essentialHint?: boolean;
};

export type Policy = {
  id: string;
  name: string;
  description: string;
  allowedAppIds: string[];
  kioskMode: boolean;
};

export type GeoPoint = {
  lat: number;
  lng: number;
  accuracy?: number;
  at: string;
};

export type CommandType = "lock" | "unlock" | "locate" | "ring" | "message";

export type DeviceCommand = {
  id: string;
  type: CommandType;
  payload?: { message?: string };
  createdAt: string;
  ackedAt?: string;
};

export type Device = {
  id: string;
  name: string;
  enrollmentCode: string | null;
  enrolled: boolean;
  tokenHash: string | null;
  model: string;
  platform: string;
  operator: string;
  destination: string;
  checkedOutAt: string | null;
  expectedReturnAt: string | null;
  area: DeviceArea;
  policyId: string;
  locked: boolean;
  lockMessage: string;
  lastSeenAt: string | null;
  location: GeoPoint | null;
  locationHistory: GeoPoint[];
  battery: number | null;
  charging: boolean;
  demo: boolean;
  notes: string;
  createdAt: string;
  pendingCommands: DeviceCommand[];
};

export type FrotaSettings = {
  companyName: string;
  centralPhone: string;
  lostMessage: string;
};

export type AuditEvent = {
  id: string;
  at: string;
  deviceId?: string;
  action: string;
  detail: string;
};

export type FrotaStore = {
  settings: FrotaSettings;
  devices: Device[];
  policies: Policy[];
  events: AuditEvent[];
};

export type PublicDevice = Omit<Device, "tokenHash" | "pendingCommands"> & {
  online: boolean;
  pendingCommandCount: number;
};

export type AgentSnapshot = {
  deviceId: string;
  name: string;
  operator: string;
  destination: string;
  checkedOutAt: string | null;
  expectedReturnAt: string | null;
  area: DeviceArea;
  locked: boolean;
  lockMessage: string;
  policy: Policy;
  apps: CatalogApp[];
  commands: DeviceCommand[];
  companyName: string;
  centralPhone: string;
};
