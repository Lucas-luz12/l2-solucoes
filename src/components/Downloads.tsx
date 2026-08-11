type DemoSoftware = {
  name: string;
  version: string;
  platform: string;
  description: string;
  /** Caminho em public/downloads/ — ex: /downloads/meu-demo.exe */
  file: string | null;
};

const demos: DemoSoftware[] = [
  {
    name: "L² Demo — Gestão",
    version: "0.1.0",
    platform: "Windows 10 / 11",
    description:
      "Versão demonstrativa para conhecer o fluxo de gestão. Ideal para avaliação antes da versão completa.",
    file: null,
  },
  {
    name: "L² Demo — Operações",
    version: "0.1.0",
    platform: "Windows 10 / 11",
    description:
      "Demonstração do módulo de operações. Substitua este texto e o arquivo quando o instalador estiver pronto.",
    file: null,
  },
];

export function Downloads() {
  return (
    <section id="downloads" className="relative bg-surface-elevated py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="max-w-2xl">
          <p className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Downloads
          </p>
          <h2 className="font-display text-3xl tracking-tight text-ink md:text-4xl">
            Versões demo para Windows
          </h2>
          <p className="mt-4 text-lg text-muted">
            Baixe e teste as demos dos nossos sistemas. Quando a versão completa
            fizer sentido para o seu negócio, falamos sobre a implantação.
          </p>
        </div>

        <ul className="mt-16 space-y-0 divide-y divide-line border-y border-line">
          {demos.map((demo) => {
            const ready = Boolean(demo.file);

            return (
              <li
                key={demo.name}
                className="flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between md:gap-10"
              >
                <div className="max-w-xl">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="font-display text-xl font-semibold text-ink">
                      {demo.name}
                    </h3>
                    <span className="text-sm text-muted">v{demo.version}</span>
                  </div>
                  <p className="mt-1 text-sm text-accent">{demo.platform}</p>
                  <p className="mt-3 leading-relaxed text-muted">{demo.description}</p>
                </div>

                {ready ? (
                  <a
                    href={demo.file!}
                    download
                    className="inline-flex shrink-0 items-center justify-center rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-bright"
                  >
                    Baixar demo
                  </a>
                ) : (
                  <span className="inline-flex shrink-0 items-center justify-center rounded-md border border-line bg-surface px-6 py-3 text-sm font-medium text-muted">
                    Em breve
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        <p className="mt-8 text-sm text-muted">
          Dúvidas sobre alguma demo?{" "}
          <a href="#contato" className="font-medium text-accent hover:text-accent-bright">
            Fale conosco
          </a>
          .
        </p>
      </div>
    </section>
  );
}
