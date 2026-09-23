import Link from "next/link";

export default function ShopNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
      <h1 className="font-display text-3xl text-ink">Açougue não encontrado</h1>
      <p className="mt-3 max-w-md text-muted">Confira o link que o açougue enviou.</p>
      <Link href="/acougue" className="mt-6 text-sm font-medium text-accent">
        Como funciona o L² Reserva
      </Link>
    </div>
  );
}
