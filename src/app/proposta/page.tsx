import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { monthLabel, saoPauloToday } from "@/lib/proposta/dates";
import { dashboardStats, followUps, formatBRL } from "@/lib/proposta/present";
import { createSeed } from "@/lib/proposta/seed";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "L² Proposta | Orçamentos que o cliente aceita no link",
  description:
    "Sistema de propostas comerciais para quem vende serviço. Monte o orçamento, envie o link no WhatsApp e acompanhe quem abriu, quem aceitou e o que está para vencer.",
};

const steps = [
  {
    title: "Montar",
    text: "Cliente, itens, desconto e condição de pagamento. O total fecha sozinho.",
  },
  {
    title: "Enviar",
    text: "Um link. Se o telefone estiver no cadastro, o WhatsApp abre com a mensagem pronta.",
  },
  {
    title: "Acompanhar",
    text: "O painel marca quando o cliente abre e quando aceita ou recusa. O prazo aparece antes de vencer.",
  },
];

const plans = [
  {
    name: "Demonstração",
    price: "Grátis",
    detail: "Para ver o fluxo com dados de exemplo, neste ambiente.",
    items: ["Clientes e propostas", "Link público com aceite", "Painel do que está em aberto"],
    href: "/app",
    label: "Abrir demonstração",
    featured: false,
  },
  {
    name: "Assinatura",
    price: "R$ 97",
    detail: "Por mês, por empresa. Sem cobrança por usuário.",
    items: [
      "O mesmo fluxo da demonstração",
      "Dados da sua empresa no link",
      "Uso contínuo, fora do ambiente de teste",
    ],
    href: "/?interesse=proposta#contato",
    label: "Quero assinar",
    featured: true,
  },
  {
    name: "Implantação",
    price: "Sob consulta",
    detail: "Quando a proposta precisa nascer no seu servidor, com a sua operação.",
    items: ["Instalação acompanhada", "Itens e condições padrão", "Ajustes do fluxo com a L²"],
    href: "/?interesse=proposta#contato",
    label: "Falar sobre implantação",
    featured: false,
  },
];

export default function PropostaPage() {
  const example = createSeed();
  const today = saoPauloToday();
  const stats = dashboardStats(example.proposals, today);
  const reminder = followUps(example, today)[0];

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-surface">
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(38,148,138,0.14), transparent 55%)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-32 md:px-8 md:pb-28 md:pt-40">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              L² Proposta
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink md:text-6xl">
              A proposta sai do Word e volta com um sim.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              Para quem vende serviço e fecha pelo WhatsApp. Você monta o orçamento, manda um link e
              vê quem abriu, quem aceitou e o que está para vencer — sem um CRM cobrado por usuário.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/app"
                className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-bright"
              >
                Abrir demonstração
              </Link>
              <a
                href="#planos"
                className="rounded-md border border-line bg-white px-6 py-3 text-sm font-medium text-ink-soft transition-colors hover:border-accent hover:text-accent"
              >
                Ver planos
              </a>
            </div>
          </div>
        </section>

        <section className="border-y border-line bg-white py-16 md:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-[1fr_1fr] md:px-8">
            <div>
              <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                A demanda
              </p>
              <h2 className="mt-3 font-display text-3xl tracking-tight text-ink md:text-4xl">
                O mercado paga por proposta com acompanhamento. O resto virou peso.
              </h2>
            </div>
            <div className="space-y-4 text-lg leading-relaxed text-muted">
              <p>
                Em 2026, pequenas empresas seguem comprando software em assinatura, e no Brasil a venda
                ainda acontece no WhatsApp. CRMs completos cobram por lugar na equipe e deixam o
                orçamento no documento.
              </p>
              <p>
                O que o prestador precisa no dia a dia é mais estreito: um valor claro, um link que o
                cliente abre no celular e um aviso quando a proposta esfria. É isso que o L² Proposta faz.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-surface py-20 md:py-28">
          <div className="mx-auto grid max-w-6xl items-start gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] md:px-8">
            <div>
              <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                Como funciona
              </p>
              <h2 className="mt-3 font-display text-3xl tracking-tight text-ink md:text-4xl">
                Três passos, do item ao aceite
              </h2>
              <ol className="mt-10 space-y-8">
                {steps.map((step, index) => (
                  <li key={step.title}>
                    <p className="font-display text-sm font-semibold text-accent">{index + 1}</p>
                    <h3 className="mt-1 font-display text-xl font-semibold text-ink">{step.title}</h3>
                    <p className="mt-2 leading-relaxed text-muted">{step.text}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-md border border-line bg-white p-6 md:p-8">
              <p className="text-sm text-muted">Exemplo de como a demonstração começa · {monthLabel()}</p>
              <dl className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted">Em aberto</dt>
                  <dd className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
                    {formatBRL(stats.openCents)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">Aceitas no mês</dt>
                  <dd className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
                    {formatBRL(stats.acceptedMonthCents)}
                  </dd>
                </div>
              </dl>
              {reminder ? (
                <p className="mt-8 border-t border-line pt-6 leading-relaxed text-ink-soft">{reminder.text}</p>
              ) : null}
              <Link href="/app" className="mt-6 inline-block text-sm font-medium text-accent hover:text-accent-bright">
                Entrar nesse painel
              </Link>
            </div>
          </div>
        </section>

        <section id="planos" className="bg-ink py-20 text-white md:py-28">
          <div className="mx-auto max-w-6xl px-6 md:px-8">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent-bright">
              Planos
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl tracking-tight md:text-4xl">
              Um preço por empresa, não por pessoa
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-white/65">
              A demonstração é compartilhada e pode ser restaurada. A assinatura tira o sistema do
              ambiente de teste. A implantação é quando a L² coloca isso na sua operação.
            </p>
            <ul className="mt-12 grid gap-4 lg:grid-cols-3">
              {plans.map((plan) => (
                <li
                  key={plan.name}
                  className={`flex flex-col rounded-md border p-6 ${
                    plan.featured ? "border-accent-bright bg-white text-ink" : "border-white/15 bg-white/5"
                  }`}
                >
                  <p className={`text-sm font-medium ${plan.featured ? "text-accent" : "text-accent-bright"}`}>
                    {plan.name}
                  </p>
                  <p className="mt-3 font-display text-4xl font-semibold tracking-tight">
                    {plan.price}
                    {plan.price.startsWith("R$") ? (
                      <span className="ml-1 text-base font-medium text-current/60">/mês</span>
                    ) : null}
                  </p>
                  <p className={`mt-3 text-sm leading-relaxed ${plan.featured ? "text-muted" : "text-white/65"}`}>
                    {plan.detail}
                  </p>
                  <ul className={`mt-6 flex-1 space-y-2 text-sm ${plan.featured ? "text-ink-soft" : "text-white/80"}`}>
                    {plan.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <a
                    href={plan.href}
                    className={`mt-8 inline-flex justify-center rounded-md px-4 py-3 text-sm font-semibold transition-colors ${
                      plan.featured
                        ? "bg-accent text-white hover:bg-accent-bright"
                        : "border border-white/20 text-white hover:border-accent-bright hover:text-accent-bright"
                    }`}
                  >
                    {plan.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
