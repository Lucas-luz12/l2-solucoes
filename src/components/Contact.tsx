const CONTACT_EMAIL = "contato@l2solucoes.com.br";

type ContactProps = {
  sent?: boolean;
};

export function Contact({ sent = false }: ContactProps) {
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
            <p className="mt-6 text-sm text-muted">
              E-mail:{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-accent transition-colors hover:text-accent-bright"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>

          {sent ? (
            <div className="rounded-md border border-accent/30 bg-accent/10 px-6 py-8">
              <p className="font-display text-xl font-semibold text-ink">Mensagem enviada</p>
              <p className="mt-2 text-muted">
                Recebemos seu contato em {CONTACT_EMAIL}. Retornamos em breve.
              </p>
            </div>
          ) : (
            <form
              className="space-y-5"
              action={`https://formsubmit.co/${CONTACT_EMAIL}`}
              method="POST"
            >
              <input type="hidden" name="_subject" value="Contato pelo site — L² Soluções" />
              <input type="hidden" name="_template" value="table" />
              <input type="hidden" name="_captcha" value="false" />
              <input
                type="hidden"
                name="_next"
                value="https://l2solucoes.com.br/?contato=enviado#contato"
              />
              <input
                type="text"
                name="_honey"
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

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
          )}
        </div>
      </div>
    </section>
  );
}
