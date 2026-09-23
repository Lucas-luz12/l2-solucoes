import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "L² Reserva | Conta do açougue",
  description:
    "O açougue cria a conta, publica kits com foto e envia o link. O cliente reserva a retirada sem se cadastrar.",
};

export default function AcougueIntroPage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 md:px-8">
          <Link href="/" className="font-display text-lg font-semibold tracking-tight text-ink">
            L² Reserva
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/acougue/entrar" className="font-medium text-ink-soft hover:text-accent">
              Entrar
            </Link>
            <Link href="/acougue/criar" className="font-medium text-accent hover:text-accent-bright">
              Criar conta
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-14 md:px-8">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">
          Para o açougue e para o cliente
        </p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl tracking-tight text-ink md:text-5xl">
          O açougue publica. O cliente reserva no link.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
          A conta é só do açougue. O cliente abre o endereço da vitrine, escolhe o kit, deixa nome e WhatsApp
          e retira com o código. O pagamento continua no balcão.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/acougue/criar" className="rounded-md bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-bright">
            Criar a conta do açougue
          </Link>
          <Link href="/acougue/estrela" className="rounded-md border border-line bg-white px-5 py-3 text-sm font-medium text-ink-soft hover:border-accent hover:text-accent">
            Ver a demonstração
          </Link>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <article className="rounded-md border border-line bg-white p-6">
            <h2 className="font-display text-2xl text-ink">Como o açougue faz</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-ink-soft">
              <li>Cria a conta com e-mail e senha.</li>
              <li>Entra no painel, envia o logo e cadastra kits e cortes com foto.</li>
              <li>Copia o link da vitrine e manda no WhatsApp e no status.</li>
              <li>No preparo, vê quantos kits e quilos sair em cada horário.</li>
            </ol>
          </article>
          <article className="rounded-md border border-line bg-white p-6">
            <h2 className="font-display text-2xl text-ink">Como o cliente faz</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-ink-soft">
              <li>Abre o link do açougue. Não cria conta e não escolhe senha.</li>
              <li>Escolhe o dia, o horário e a quantidade.</li>
              <li>Informa nome e WhatsApp.</li>
              <li>
              Guarda o código e retira no balcão. Nome e WhatsApp ficam com o açougue e saem 30 dias depois da retirada.
            </li>
            </ol>
          </article>
        </div>
        <p className="mt-10 text-sm">
          <Link href="/privacidade" className="font-medium text-accent hover:text-accent-bright">
            Aviso de privacidade
          </Link>
        </p>
      </main>
    </div>
  );
}
