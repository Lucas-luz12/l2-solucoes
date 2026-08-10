const services = [
  {
    title: "Sistemas web",
    description:
      "Painéis, portais e aplicações web robustas, pensadas para o dia a dia da sua operação.",
  },
  {
    title: "Software sob medida",
    description:
      "Produtos digitais feitos sob medida — do fluxo de negócio à experiência do usuário.",
  },
];

export function Services() {
  return (
    <section id="servicos" className="relative bg-surface-elevated py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="max-w-2xl">
          <p className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Serviços
          </p>
          <h2 className="font-display text-3xl tracking-tight text-ink md:text-4xl">
            O que entregamos
          </h2>
          <p className="mt-4 text-lg text-muted">
            Soluções digitais com foco em clareza, performance e manutenção a
            longo prazo.
          </p>
        </div>

        <ul className="mt-16 grid gap-x-12 gap-y-14 md:grid-cols-2">
          {services.map((service, index) => (
            <li key={service.title} className="group">
              <span className="font-display text-sm font-semibold text-accent">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold text-ink">
                {service.title}
              </h3>
              <p className="mt-3 leading-relaxed text-muted">{service.description}</p>
              <div className="mt-6 h-px w-12 bg-line transition-all duration-500 group-hover:w-full group-hover:bg-accent" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
