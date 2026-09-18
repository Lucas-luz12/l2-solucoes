import type { Metadata } from "next";
import { Dashboard } from "@/components/frota/Dashboard";

export const metadata: Metadata = {
  title: "L² Controle | Frota de celulares",
  description:
    "Central para limitar aplicativos, localizar e bloquear celulares da operação.",
};

export default function FrotaPage() {
  return <Dashboard />;
}
