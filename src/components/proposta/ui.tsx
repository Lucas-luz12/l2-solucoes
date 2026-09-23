import type { ProposalStatus } from "@/lib/proposta/types";
import { STATUS_LABEL } from "@/lib/proposta/present";

const statusClass: Record<ProposalStatus, string> = {
  rascunho: "border-line bg-surface text-muted",
  enviada: "border-line bg-white text-ink",
  visualizada: "border-accent/25 bg-accent/10 text-accent",
  aceita: "border-[#1f7a4d]/20 bg-[#e7f5ee] text-[#1f7a4d]",
  recusada: "border-[#9a4d45]/20 bg-[#f8ecea] text-[#9a4d45]",
  expirada: "border-line bg-surface text-muted",
};

export function StatusPill({ status }: { status: ProposalStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export const fieldClass =
  "w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-accent";

export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-bright disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-md border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60";
