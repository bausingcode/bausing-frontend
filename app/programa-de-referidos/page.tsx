import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fetchActiveEvent } from "@/lib/api";
import { getSiteUrl, titleWithBrand } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Programa de Referidos",
  description:
    "Recomendá Bausing y ganá Pesos Bausing. Compartí tu código único con amigos y familiares y acumulá créditos para usar en tus próximas compras.",
  alternates: { canonical: `${getSiteUrl()}/programa-de-referidos` },
  openGraph: {
    title: titleWithBrand("Programa de Referidos"),
    description:
      "Recomendá Bausing y ganá Pesos Bausing. Compartí tu código único y acumulá créditos para tus compras.",
    url: `${getSiteUrl()}/programa-de-referidos`,
  },
};

export default async function ProgramaReferidosPage() {
  const activeEvent = await fetchActiveEvent().catch(() => null);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar event={activeEvent} />

      <main className="flex-1 py-10 md:py-14 lg:py-16">
        <div className="container mx-auto px-4 max-w-3xl">

          {/* Hero */}
          <div className="mb-10 md:mb-12">
            <h1 className="text-2xl md:text-3xl font-bold text-[#101828] mb-3">
              Programa de Referidos
            </h1>
            <p className="text-xl md:text-2xl font-semibold text-[#00C1A7] mb-4">
              Ganá recomendando Bausing
            </p>
            <p className="text-[#4A5565] text-sm md:text-base leading-relaxed">
              En Bausing creemos que nuestra mejor publicidad son los clientes que ya confiaron en nosotros.
              Por eso creamos un programa simple:{" "}
              <span className="font-semibold text-[#101828]">recomendás y ganás</span>.
            </p>
          </div>

          {/* Cómo funciona */}
          <section className="mb-10 md:mb-12">
            <h2 className="text-lg md:text-xl font-bold text-[#101828] mb-5">
              ¿Cómo funciona?
            </h2>
            <ol className="space-y-4">
              {[
                "Realizás tu primera compra en Bausing",
                "Te registrás en nuestro sitio web",
                "Obtenés tu código de referido único",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00C1A7] text-white text-sm font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-[#4A5565] text-sm md:text-base leading-relaxed pt-1">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-[#4A5565] text-sm md:text-base leading-relaxed border-l-4 border-[#00C1A7] pl-4">
              A partir de ahí, podés compartirlo con quien quieras: amigos, familiares o conocidos.
              Cuando alguien realiza una compra en nuestra web utilizando tu código,{" "}
              <span className="font-semibold text-[#101828]">recibís Pesos Bausing en tu cuenta</span>.
            </p>
          </section>

          {/* Divisor */}
          <hr className="border-gray-200 mb-10 md:mb-12" />

          {/* Qué son los Pesos Bausing */}
          <section className="mb-10 md:mb-12">
            <h2 className="text-lg md:text-xl font-bold text-[#101828] mb-3">
              ¿Qué son los Pesos Bausing?
            </h2>
            <p className="text-[#4A5565] text-sm md:text-base leading-relaxed mb-6">
              Son créditos que se acumulan en tu cuenta y que podés usar para comprar cualquiera de nuestros productos.
            </p>
            <ul className="space-y-3">
              {[
                "Son acumulables",
                "No tienen complicaciones",
                "Los usás cuando quieras",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-[#101828] text-sm md:text-base font-medium">
                  <span className="text-[#00C1A7] text-lg leading-none">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Divisor */}
          <hr className="border-gray-200 mb-10 md:mb-12" />

          {/* Por qué lo hacemos */}
          <section className="mb-10 md:mb-12">
            <h2 className="text-lg md:text-xl font-bold text-[#101828] mb-3">
              ¿Por qué lo hacemos?
            </h2>
            <p className="text-[#4A5565] text-sm md:text-base leading-relaxed">
              Porque confiamos en lo que vendemos y sabemos que una buena experiencia se recomienda sola.
            </p>
          </section>

          {/* CTA */}
          <div className="bg-[#F0FDF9] border border-[#00C1A7]/20 rounded-xl p-6 md:p-8 text-center">
            <p className="text-[#101828] font-semibold text-base md:text-lg mb-1">
              ¿Ya sos cliente?
            </p>
            <p className="text-[#4A5565] text-sm md:text-base mb-5">
              Podés empezar a recomendar y ganar desde tu cuenta.
            </p>
            <a
              href="/usuario"
              className="inline-block bg-[#00C1A7] text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-[#00a892] transition-colors"
            >
              Ir a mi cuenta
            </a>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
