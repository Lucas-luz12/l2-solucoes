import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Vitrine } from "@/components/acougue/Vitrine";
import { getPublicCatalog, isReservedSlug, StoreError } from "@/lib/acougue/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (isReservedSlug(slug)) return { title: "Açougue | L² Reserva" };
  try {
    const catalog = await getPublicCatalog(slug);
    return {
      title: `${catalog.shop.name} | L² Reserva`,
      description: catalog.shop.tagline || "Reserve kits e cortes e retire no horário.",
    };
  } catch {
    return { title: "Açougue | L² Reserva" };
  }
}

export default async function ShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (isReservedSlug(slug)) notFound();
  let catalog;
  try {
    catalog = await getPublicCatalog(slug);
  } catch (error) {
    if (error instanceof StoreError && error.status === 404) notFound();
    throw error;
  }
  return <Vitrine catalog={catalog} />;
}
