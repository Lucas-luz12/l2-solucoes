const steps = [
  {
    title: "Entender",
    text: "Mapeamos o problema, o contexto e o que realmente precisa existir.",
  },
  {
    title: "Desenhar",
    text: "Definimos arquitetura, fluxos e interfaces com decisões objetivas.",
  },
  {
    title: "Construir",
    text: "Desenvolvemos em ciclos curtos, com entregas visíveis e mensuráveis.",
  },
  {
    title: "Evoluir",
    text: "Acompanhamos o produto em produção e iteramos com base no uso real.",
  },
];

export function Approach() {
  return (
    <section
      id="abordagem"
      className="relative overflow-hidden bg-ink py-24 text-white md:py-32"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 25%, rgba(38,148,138,0.35), transparent 40%), radial-gradient(circle at 88% 70%, rgba(47,176,163,0.18), transparent 35%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-6 md:px-8">
        <div className="max-w-2xl">
          <p className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent-bright">
            Abordagem
          </p>
          <h2 className="font-display text-3xl tracking-tight md:text-4xl">
            Como trabalhamos
          </h2>
          <p className="mt-4 text-lg text-white/65">
            Tecnologia, processos e resultados — cada etapa reduz risco e
            acelera valor.
          </p>
        </div>

        <ol className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title}>
              <div className="mb-4 flex items-baseline gap-3">
                <span className="font-display text-4xl font-bold text-accent-bright/90">
                  {index + 1}
                </span>
                <h3 className="font-display text-xl font-semibold">{step.title}</h3>
              </div>
              <p className="leading-relaxed text-white/60">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
