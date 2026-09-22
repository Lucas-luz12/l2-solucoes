"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { AcougueData, CatalogInput, ReservationStatus, Shop } from "@/lib/acougue/types";

type AcougueContextValue = {
  data: AcougueData;
  saveShop: (shop: Shop) => Promise<void>;
  saveItem: (item: CatalogInput) => Promise<void>;
  setStatus: (id: string, status: ReservationStatus) => Promise<void>;
  resetDemo: () => Promise<AcougueData>;
};

const AcougueContext = createContext<AcougueContextValue | null>(null);

async function request(body: unknown) {
  const response = await fetch("/api/acougue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as { data?: AcougueData; error?: string };
  if (!response.ok || !payload.data) {
    throw new Error(payload.error || "Não foi possível salvar.");
  }
  return payload.data;
}

export function AcougueProvider({
  initial,
  children,
}: {
  initial: AcougueData;
  children: React.ReactNode;
}) {
  const [data, setData] = useState(initial);

  const value = useMemo<AcougueContextValue>(
    () => ({
      data,
      saveShop: async (shop) => setData(await request({ action: "save-shop", shop })),
      saveItem: async (item) => setData(await request({ action: "save-item", item })),
      setStatus: async (id, status) => setData(await request({ action: "set-status", id, status })),
      resetDemo: async () => {
        const next = await request({ action: "reset" });
        setData(next);
        return next;
      },
    }),
    [data],
  );

  return <AcougueContext.Provider value={value}>{children}</AcougueContext.Provider>;
}

export function useAcougue() {
  const context = useContext(AcougueContext);
  if (!context) throw new Error("O painel do açougue está fora do provider.");
  return context;
}
