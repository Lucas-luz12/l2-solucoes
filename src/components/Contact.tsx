export function Contact() {
  return (
    <section id="contato" className="bg-surface py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="grid items-end gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Contato
            </p>
            <h2 className="font-display text-3xl tracking-tight text-ink md:text-5xl">
              Vamos falar do seu próximo sistema
            </h2>
            <p className="mt-5 max-w-lg text-lg text-muted">
              Conte o desafio em poucas linhas. Respondemos com uma leitura
              honesta do que faz sentido construir.
            </p>
          </div>

          <form
            className="space-y-5"
            action="mailto:contato@l2solucoes.com.br"
            method="post"
            encType="text/plain"
          >
            <div>
              <label htmlFor="nome" className="mb-2 block text-sm font-medium text-ink-soft">
                Nome
              </label>
              <input
                id="nome"
                name="nome"
                required
                className="w-full rounded-md border border-line bg-surface-elevated px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent"
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink-soft">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-md border border-line bg-surface-elevated px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent"
                placeholder="voce@empresa.com"
              />
            </div>
            <div>
              <label htmlFor="mensagem" className="mb-2 block text-sm font-medium text-ink-soft">
                Mensagem
              </label>
              <textarea
                id="mensagem"
                name="mensagem"
                required
                rows={4}
                className="w-full resize-y rounded-md border border-line bg-surface-elevated px-4 py-3 text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent"
                placeholder="O que você precisa construir?"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-bright sm:w-auto"
            >
              Enviar mensagem
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
