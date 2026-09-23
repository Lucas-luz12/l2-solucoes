import Link from "next/link";

export default function ReservationNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
      <h1 className="font-display text-3xl text-ink">Reserva não encontrada</h1>
      <p className="mt-3 max-w-md text-muted">Confira o código ou faça uma nova reserva na vitrine.</p>
      <Link href="/acougue" className="mt-6 text-sm font-medium text-accent">
        Ir para o L² Reserva
      </Link>
    </div>
  );
}
