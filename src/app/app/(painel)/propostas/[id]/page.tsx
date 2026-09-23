import { ProposalEditor } from "@/components/proposta/ProposalEditor";

export default async function EditProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProposalEditor proposalId={id} />;
}
