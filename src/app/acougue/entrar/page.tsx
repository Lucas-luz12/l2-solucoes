import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/acougue/AccountForms";
import { readSession } from "@/lib/acougue/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Entrar | L² Reserva",
  description: "Acesso do açougue ao painel de preparo, cardápio e logo.",
};

export default async function EntrarPage() {
  const session = await readSession();
  if (session) redirect("/acougue/painel");
  return <LoginForm />;
}
