import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { Downloads } from "@/components/Downloads";
import { Approach } from "@/components/Approach";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

type HomeProps = {
  searchParams?: Promise<{ contato?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = searchParams ? await searchParams : {};
  const sent = params.contato === "enviado";

  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Services />
        <Downloads />
        <Approach />
        <Contact sent={sent} />
      </main>
      <Footer />
    </>
  );
}
