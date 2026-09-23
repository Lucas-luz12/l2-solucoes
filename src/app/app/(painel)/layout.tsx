import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppFrame } from "@/components/proposta/AppFrame";
import { WorkspaceProvider } from "@/components/proposta/WorkspaceProvider";
import { readPropostaSession } from "@/lib/proposta/auth";
import { getWorkspace, presentWorkspace } from "@/lib/proposta/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "L² Proposta | Painel",
  description: "Painel de propostas comerciais: o que está em aberto, o que o cliente abriu e o que foi aceito.",
};

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const session = await readPropostaSession();
  if (!session) redirect("/app/entrar");
  const workspace = await getWorkspace();
  if (workspace.operator?.email !== session.email) redirect("/app/entrar");
  return (
    <WorkspaceProvider initial={presentWorkspace(workspace)}>
      <AppFrame>{children}</AppFrame>
    </WorkspaceProvider>
  );
}
