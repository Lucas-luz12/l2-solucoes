import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Privacidade | L² Soluções",
  description: "Como a L² Soluções trata dados pessoais no site, no L² Reserva e no L² Proposta, em linha com a LGPD.",
};

const CONTACT = "contato@l2solucoes.com.br";

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="bg-surface">
        <article className="mx-auto max-w-3xl px-6 py-16 md:px-8 md:py-24">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-accent">LGPD</p>
          <h1 className="mt-3 font-display text-4xl tracking-tight text-ink">Aviso de privacidade</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Este aviso explica quais dados pessoais o site, o L² Reserva e o L² Proposta usam, para quê, por quanto
            tempo e como pedir acesso ou exclusão. A base é a Lei nº 13.709/2018.
          </p>

          <Section title="Quem decide sobre os dados">
            <p>
              A L² Soluções trata o e-mail e a senha de quem cria conta, e as mensagens enviadas pelo formulário de
              contato. O canal do encarregado é{" "}
              <a className="font-medium text-accent" href={`mailto:${CONTACT}`}>
                {CONTACT}
              </a>
              .
            </p>
            <p>
              No L² Reserva, o açougue é quem decide sobre o nome e o WhatsApp de quem reserva. A L² guarda esses dados
              para o açougue operar a retirada.
            </p>
            <p>
              No L² Proposta, a empresa que envia o orçamento é quem decide sobre os dados dos clientes dela. A L²
              guarda esses dados para a empresa acompanhar a proposta.
            </p>
          </Section>

          <Section title="Quais dados e para quê">
            <ul className="list-disc space-y-2 pl-5">
              <li>Conta do açougue: nome, e-mail e senha, para entrar no painel. A senha fica só como hash.</li>
              <li>Loja: nome, endereço, telefones, horários, logo e fotos dos produtos, para a vitrine e o preparo.</li>
              <li>Reserva: nome, WhatsApp, data, horário, itens e observação, para separar o pedido e avisar a retirada.</li>
              <li>Proposta: nome, empresa, e-mail, telefone e cidade do cliente, e o nome de quem aceita ou recusa.</li>
              <li>Contato do site: nome, e-mail e mensagem, para responder o pedido.</li>
            </ul>
            <p>O pagamento do pedido do açougue acontece no balcão. O sistema não pede cartão.</p>
          </Section>

          <Section title="Por que podemos usar">
            <p>
              A conta e a operação do serviço se apoiam na execução do contrato com o açougue ou com a empresa. A reserva
              usa os dados para cumprir o pedido de retirada. O formulário de contato e a resposta da proposta pedem uma
              confirmação clara antes do envio.
            </p>
          </Section>

          <Section title="Quanto tempo fica guardado">
            <p>
              Nome, WhatsApp e observação da reserva são apagados 30 dias depois da data de retirada. Quantidade e valor
              podem permanecer para o açougue saber o movimento do dia, já sem identificar a pessoa.
            </p>
            <p>
              A conta do açougue permanece enquanto existir. A empresa apaga o cliente no L² Proposta quando não precisar
              mais dele; as propostas ligadas a esse cliente saem junto.
            </p>
            <p>A mensagem do site segue para o e-mail da L² e fica na caixa de entrada pelo tempo necessário para responder.</p>
          </Section>

          <Section title="Com quem os dados saem">
            <p>A L² não vende dados pessoais.</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>O açougue vê a reserva no painel e pode abrir o WhatsApp para falar com quem reservou.</li>
              <li>O link da reserva mostra o código e o nome de quem vai retirar. Quem recebe o link consegue abrir essa página.</li>
              <li>O link da proposta mostra o orçamento e o nome do cliente, sem e-mail e sem telefone.</li>
              <li>O formulário de contato envia a mensagem ao e-mail da L² por meio do serviço FormSubmit.</li>
              <li>O sistema fica hospedado para funcionar na internet. O acesso de produção usa HTTPS.</li>
            </ul>
          </Section>

          <Section title="Segurança">
            <p>
              A senha é armazenada com scrypt e sal. A sessão fica em cookie httpOnly. Tentativas seguidas de entrada,
              reserva e envio de imagem são limitadas. Foto de produto aceita só JPG, PNG ou WebP, com tamanho máximo e
              conferência do arquivo. O painel de cada açougue e o painel de propostas exigem senha.
            </p>
          </Section>

          <Section title="Seus direitos">
            <p>
              Dá para pedir confirmação, acesso, correção, eliminação, informação sobre o compartilhamento e uma cópia
              dos dados. O pedido vai para quem decide sobre eles:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Reserva: fale com o açougue. No painel, a loja baixa os dados ou apaga uma reserva.</li>
              <li>Conta do açougue: em Loja, apague a conta. Isso remove cardápio, reservas e fotos.</li>
              <li>Proposta: a empresa apaga o cliente no painel.</li>
              <li>Contato com a L²: escreva para {CONTACT}.</li>
            </ul>
            <p>Também é possível levar uma reclamação à Autoridade Nacional de Proteção de Dados.</p>
          </Section>

          <p className="mt-10 text-sm text-muted">
            A demonstração do Açougue Estrela e do L² Proposta usa pessoas fictícias.{" "}
            <Link href="/" className="font-medium text-accent">
              Voltar ao site
            </Link>
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}
