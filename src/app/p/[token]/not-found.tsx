import Link from "next/link";

export default function ProposalNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
      <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">Proposta</p>
      <h1 className="mt-3 font-display text-3xl text-ink">Este link não está mais disponível</h1>
      <p className="mt-3 max-w-md text-muted">
        Confira se o endereço foi copiado por completo ou peça um novo envio.
      </p>
      <Link href="/" className="mt-8 text-sm font-medium text-accent hover:text-accent-bright">
        Ir para o site da L²
      </Link>
    </div>
  );
}
