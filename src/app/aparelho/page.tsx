import type { Metadata } from "next";
import { DeviceAgent } from "@/components/frota/DeviceAgent";

type PageProps = {
  searchParams?: Promise<{ codigo?: string }>;
};

export const metadata: Metadata = {
  title: "L² Aparelho | Pareamento da frota",
  description: "App da operação: aplicativos permitidos, localização e bloqueio remoto.",
  appleWebApp: {
    capable: true,
    title: "L² Aparelho",
    statusBarStyle: "black-translucent",
  },
  manifest: "/aparelho-manifest.json",
  icons: {
    icon: "/logo-mark.png",
    apple: "/logo-mark.png",
  },
};

export default async function AparelhoPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  return <DeviceAgent initialCode={params.codigo || ""} />;
}
