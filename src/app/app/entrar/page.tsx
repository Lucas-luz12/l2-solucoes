import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OperatorLogin } from "@/components/proposta/OperatorLogin";
import { readPropostaSession } from "@/lib/proposta/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Entrar | L² Proposta",
  description: "Acesso da empresa ao painel de propostas e aos dados dos clientes.",
};

export default async function EntrarPropostaPage() {
  const session = await readPropostaSession();
  if (session) redirect("/app");
  return <OperatorLogin />;
}
