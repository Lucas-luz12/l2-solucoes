"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ClientInput, Company, ProposalInput, Workspace } from "@/lib/proposta/types";

type MutationResult = {
  workspace?: Workspace;
  proposalId?: string;
  clientId?: string;
  token?: string;
};

type WorkspaceContextValue = {
  workspace: Workspace | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveCompany: (company: Company) => Promise<void>;
  saveClient: (client: ClientInput) => Promise<string>;
  deleteClient: (id: string) => Promise<void>;
  saveProposal: (proposal: ProposalInput) => Promise<string>;
  deleteProposal: (id: string) => Promise<void>;
  sendProposal: (id: string) => Promise<void>;
  duplicateProposal: (id: string) => Promise<string>;
  resetDemo: () => Promise<Workspace>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

async function request(body?: unknown) {
  const response = await fetch("/api/workspace", {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as MutationResult & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Não foi possível concluir.");
  }
  return data;
}

export function WorkspaceProvider({
  initial,
  children,
}: {
  initial: Workspace;
  children: React.ReactNode;
}) {
  const [workspace, setWorkspace] = useState<Workspace | null>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await request();
      if (!data.workspace) throw new Error("Resposta incompleta.");
      setWorkspace(data.workspace);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao carregar.");
    } finally {
      setLoading(false);
    }
  }, []);

  const apply = useCallback((data: MutationResult) => {
    if (data.workspace) setWorkspace(data.workspace);
  }, []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspace,
      loading,
      error,
      refresh,
      saveCompany: async (company) => {
        apply(await request({ action: "save-company", company }));
      },
      saveClient: async (client) => {
        const result = await request({ action: "save-client", client });
        apply(result);
        if (!result.clientId) throw new Error("Cliente salvo sem identificador.");
        return result.clientId;
      },
      deleteClient: async (id) => {
        apply(await request({ action: "delete-client", id }));
      },
      saveProposal: async (proposal) => {
        const result = await request({ action: "save-proposal", proposal });
        apply(result);
        if (!result.proposalId) throw new Error("Proposta salva sem identificador.");
        return result.proposalId;
      },
      deleteProposal: async (id) => {
        apply(await request({ action: "delete-proposal", id }));
      },
      sendProposal: async (id) => {
        apply(await request({ action: "send-proposal", id }));
      },
      duplicateProposal: async (id) => {
        const result = await request({ action: "duplicate-proposal", id });
        apply(result);
        if (!result.proposalId) throw new Error("Não foi possível duplicar.");
        return result.proposalId;
      },
      resetDemo: async () => {
        const result = await request({ action: "reset" });
        apply(result);
        if (!result.workspace) throw new Error("Não foi possível restaurar a demonstração.");
        return result.workspace;
      },
    }),
    [apply, error, loading, refresh, workspace],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("O painel precisa estar dentro do WorkspaceProvider.");
  }
  return context;
}
