import { Wordmark } from "./Wordmark";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-surface-elevated">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <Wordmark size="sm" />
          <p className="mt-3 text-sm text-muted">
            Tecnologia · Processos · Resultados
          </p>
        </div>
        <p className="text-sm text-muted">
          © {year} L² Soluções. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
