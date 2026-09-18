"use client";

import type { PublicDevice } from "@/lib/frota/types";

type FleetMapProps = {
  devices: PublicDevice[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  height?: string;
};

function project(devices: PublicDevice[]) {
  const points = devices
    .map((device) => device.location)
    .filter((point): point is NonNullable<typeof point> => Boolean(point));
  if (points.length === 0) return null;
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const pad = 0.012;
  const minLat = Math.min(...lats) - pad;
  const maxLat = Math.max(...lats) + pad;
  const minLng = Math.min(...lngs) - pad;
  const maxLng = Math.max(...lngs) + pad;
  return {
    toXY(lat: number, lng: number) {
      const x = ((lng - minLng) / (maxLng - minLng)) * 100;
      const y = (1 - (lat - minLat) / (maxLat - minLat)) * 100;
      return { x, y };
    },
    bbox: `${minLng},${minLat},${maxLng},${maxLat}`,
  };
}

export function FleetMap({ devices, selectedId, onSelect, height = "h-[22rem]" }: FleetMapProps) {
  const located = devices.filter((device) => device.location);
  const layout = project(located);

  if (!layout) {
    return (
      <div
        className={`flex ${height} items-center justify-center rounded-md border border-line bg-surface text-sm text-muted`}
      >
        Nenhum aparelho enviou localização ainda.
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-md border border-line ${height}`}>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(38,148,138,0.16), transparent 55%), linear-gradient(180deg, #e8eef3 0%, #d5dee6 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(26,36,48,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(26,36,48,0.08) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {located.map((device) => {
        const { x, y } = layout.toXY(device.location!.lat, device.location!.lng);
        const selected = device.id === selectedId;
        const tone = device.locked
          ? "bg-red-500"
          : device.online
            ? "bg-accent"
            : "bg-muted";
        return (
          <button
            key={device.id}
            type="button"
            onClick={() => onSelect?.(device.id)}
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{ left: `${x}%`, top: `${y}%` }}
            title={`${device.name} — ${device.operator}`}
          >
            <span className="mb-1 block rounded-sm bg-ink px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
              {device.name}
            </span>
            <span
              className={`mx-auto block h-3.5 w-3.5 rounded-full border-2 border-white shadow ${tone} ${
                selected ? "scale-125 ring-4 ring-accent/30" : ""
              } ${device.online && !device.locked ? "animate-pulse" : ""}`}
            />
          </button>
        );
      })}
      <p className="absolute bottom-2 left-3 text-[10px] text-ink/50">
        Posições relativas · OpenStreetMap para detalhe
      </p>
    </div>
  );
}

export function OsmLink({ lat, lng }: { lat: number; lng: number }) {
  const href = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-sm font-medium text-accent hover:text-accent-bright"
    >
      Abrir no mapa
    </a>
  );
}
