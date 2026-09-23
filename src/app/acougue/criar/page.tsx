import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/acougue/AccountForms";
import { readSession } from "@/lib/acougue/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Criar conta | L² Reserva",
  description: "Crie a conta do açougue para publicar a vitrine e receber reservas de retirada.",
};

export default async function CriarPage() {
  const session = await readSession();
  if (session) redirect("/acougue/painel");
  return <RegisterForm />;
}
