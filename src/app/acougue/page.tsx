import type { Metadata } from "next";
import { Vitrine } from "@/components/acougue/Vitrine";
import { getPublicCatalog } from "@/lib/acougue/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "L² Reserva | Açougue Estrela",
  description:
    "Reserve kits e cortes do açougue e retire no horário. O balcão vê quantos kits precisa separar.",
};

export default async function AcouguePage() {
  const catalog = await getPublicCatalog();
  return <Vitrine catalog={catalog} />;
}
