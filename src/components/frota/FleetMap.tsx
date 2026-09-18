"use client";

import { useMemo } from "react";
import type { PublicDevice } from "@/lib/frota/types";

type FleetMapProps = {
  devices: PublicDevice[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  height?: string;
};

function lon2tile(lon: number, zoom: number) {
  return ((lon + 180) / 360) * 2 ** zoom;
}

function lat2tile(lat: number, zoom: number) {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** zoom;
}

function wrapTile(value: number, zoom: number) {
  const n = 2 ** zoom;
  return ((value % n) + n) % n;
}

export function FleetMap({ devices, selectedId, onSelect, height = "h-[22rem]" }: FleetMapProps) {
  const located = devices.filter((device) => device.location);
  const layout = useMemo(() => {
    if (located.length === 0) return null;
    const lats = located.map((device) => device.location!.lat);
    const lngs = located.map((device) => device.location!.lng);
    const pad = located.length === 1 ? 0.02 : 0.01;
    const minLat = Math.min(...lats) - pad;
    const maxLat = Math.max(...lats) + pad;
    const minLng = Math.min(...lngs) - pad;
    const maxLng = Math.max(...lngs) + pad;
    let zoom = 13;
    for (let z = 16; z >= 4; z -= 1) {
      const spanX = Math.abs(lon2tile(maxLng, z) - lon2tile(minLng, z));
      const spanY = Math.abs(lat2tile(minLat, z) - lat2tile(maxLat, z));
      if (spanX < 3.2 && spanY < 2.2) {
        zoom = z;
        break;
      }
    }
    const west = Math.min(lon2tile(minLng, zoom), lon2tile(maxLng, zoom));
    const east = Math.max(lon2tile(minLng, zoom), lon2tile(maxLng, zoom));
    const north = Math.min(lat2tile(minLat, zoom), lat2tile(maxLat, zoom));
    const south = Math.max(lat2tile(minLat, zoom), lat2tile(maxLat, zoom));
    const tiles: { key: string; x: number; y: number; left: number; top: number }[] = [];
    const minTx = Math.floor(west);
    const maxTx = Math.ceil(east);
    const minTy = Math.floor(north);
    const maxTy = Math.ceil(south);
    for (let x = minTx; x <= maxTx; x += 1) {
      for (let y = minTy; y <= maxTy; y += 1) {
        tiles.push({
          key: `${zoom}/${x}/${y}`,
          x: wrapTile(x, zoom),
          y,
          left: ((x - west) / (east - west)) * 100,
          top: ((y - north) / (south - north)) * 100,
        });
      }
    }
    const pinWidth = (east - west) === 0 ? 1 : east - west;
    const pinHeight = (south - north) === 0 ? 1 : south - north;
    return { zoom, west, north, pinWidth, pinHeight, tiles };
  }, [located]);

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
    <div className={`relative overflow-hidden rounded-md border border-line bg-[#d5dee6] ${height}`}>
      {layout.tiles.map((tile) => {
        return (
          // OSM raster tiles are sized in percent of the map viewport.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={tile.key}
            alt=""
            src={`https://tile.openstreetmap.org/${layout.zoom}/${tile.x}/${tile.y}.png`}
            className="pointer-events-none absolute max-w-none select-none"
            style={{
              left: `${tile.left}%`,
              top: `${tile.top}%`,
              width: `${(1 / layout.pinWidth) * 100}%`,
              height: `${(1 / layout.pinHeight) * 100}%`,
            }}
            draggable={false}
          />
        );
      })}
      {located.map((device) => {
        const lng = device.location!.lng;
        const lat = device.location!.lat;
        const x = ((lon2tile(lng, layout.zoom) - layout.west) / layout.pinWidth) * 100;
        const y = ((lat2tile(lat, layout.zoom) - layout.north) / layout.pinHeight) * 100;
        const selected = device.id === selectedId;
        const tone = device.locked ? "bg-red-500" : device.online ? "bg-accent" : "bg-muted";
        return (
          <button
            key={device.id}
            type="button"
            onClick={() => onSelect?.(device.id)}
            className="absolute z-10 -translate-x-1/2 -translate-y-full"
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
      <p className="absolute bottom-2 left-3 z-10 rounded-sm bg-white/80 px-1.5 py-0.5 text-[10px] text-ink/70">
        © OpenStreetMap
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
