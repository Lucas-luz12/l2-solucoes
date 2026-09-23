import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AcougueProvider } from "@/components/acougue/AcougueProvider";
import { PainelFrame } from "@/components/acougue/PainelFrame";
import { readSession } from "@/lib/acougue/auth";
import { getShop, StoreError } from "@/lib/acougue/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "L² Reserva | Painel do açougue",
  description: "Quantos kits e cortes separar para cada horário de retirada.",
};

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession();
  if (!session) redirect("/acougue/entrar");
  let data;
  try {
    data = await getShop(session.shopId);
  } catch (error) {
    if (error instanceof StoreError && error.status === 404) redirect("/acougue/entrar");
    throw error;
  }
  return (
    <AcougueProvider initial={data}>
      <PainelFrame>{children}</PainelFrame>
    </AcougueProvider>
  );
}
