import type { Metadata } from "next";
import { AppFrame } from "@/components/proposta/AppFrame";
import { WorkspaceProvider } from "@/components/proposta/WorkspaceProvider";
import { getWorkspace } from "@/lib/proposta/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "L² Proposta | Painel",
  description: "Painel de propostas comerciais: o que está em aberto, o que o cliente abriu e o que foi aceito.",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const workspace = await getWorkspace();
  return (
    <WorkspaceProvider initial={workspace}>
      <AppFrame>{children}</AppFrame>
    </WorkspaceProvider>
  );
}
