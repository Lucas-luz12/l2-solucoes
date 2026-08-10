import { Wordmark } from "./Wordmark";

export function Hero() {
  return (
    <section id="topo" className="relative min-h-[100svh] overflow-hidden bg-surface">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 20%, rgba(38,148,138,0.12), transparent 55%), linear-gradient(180deg, #f7f9fb 0%, #eef2f6 100%)",
          }}
        />
        <div
          className="animate-grid absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(26,36,48,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(26,36,48,0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 70% 55% at 50% 30%, black 10%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-3xl flex-col items-center justify-center px-6 pb-20 pt-28 text-center md:px-8 md:pb-24">
        <div className="animate-rise mb-8 md:mb-10">
          <Wordmark size="lg" />
        </div>

        <h1 className="animate-rise-delay-1 font-display text-3xl font-semibold leading-[1.15] tracking-tight text-ink sm:text-4xl md:text-5xl">
          Software e sistemas web sob medida
        </h1>
        <p className="animate-rise-delay-2 mt-5 max-w-lg text-lg leading-relaxed text-muted">
          Da ideia ao sistema em produção — com clareza, processo e resultado.
        </p>
        <div className="animate-rise-delay-3 mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#contato"
            className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-bright"
          >
            Começar um projeto
          </a>
          <a
            href="#servicos"
            className="rounded-md border border-line bg-surface-elevated px-6 py-3 text-sm font-medium text-ink-soft transition-colors hover:border-accent hover:text-accent"
          >
            Ver serviços
          </a>
        </div>
      </div>
    </section>
  );
}
