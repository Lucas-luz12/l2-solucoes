import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicProposalView } from "@/components/proposta/PublicProposalView";
import { getPublicProposal, StoreError } from "@/lib/proposta/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  try {
    const data = await getPublicProposal(token);
    return {
      title: `${data.proposal.number} · ${data.company.name}`,
      description: data.proposal.title,
    };
  } catch {
    return { title: "Proposta não encontrada" };
  }
}

export default async function PublicProposalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let data;
  try {
    data = await getPublicProposal(token);
  } catch (error) {
    if (error instanceof StoreError && error.status === 404) notFound();
    throw error;
  }
  return <PublicProposalView initial={data} />;
}
