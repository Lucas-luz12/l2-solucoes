import type { Metadata } from "next";
import { AcougueProvider } from "@/components/acougue/AcougueProvider";
import { PainelFrame } from "@/components/acougue/PainelFrame";
import { getAcougue } from "@/lib/acougue/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "L² Reserva | Painel do açougue",
  description: "Quantos kits e cortes separar para cada horário de retirada.",
};

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const data = await getAcougue();
  return (
    <AcougueProvider initial={data}>
      <PainelFrame>{children}</PainelFrame>
    </AcougueProvider>
  );
}
