import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fetchActiveEvent } from "@/lib/api";
import { getSiteUrl, titleWithBrand } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Programa de Creadores",
  description:
    "Creá contenido mostrando productos Bausing y generá ingresos. No hace falta ser influencer, solo ganas de crear y compartir.",
  alternates: { canonical: `${getSiteUrl()}/programa-de-creadores` },
  openGraph: {
    title: titleWithBrand("Programa de Creadores"),
    description:
      "Creá contenido mostrando productos Bausing y generá ingresos. No hace falta ser influencer.",
    url: `${getSiteUrl()}/programa-de-creadores`,
  },
};

const WHATSAPP_NUMBER = "5493518737683";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola%2C%20quiero%20sumarme%20al%20Programa%20de%20Creadores%20de%20Bausing`;

export default async function ProgramaCreadoresPage() {
  const activeEvent = await fetchActiveEvent().catch(() => null);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar event={activeEvent} />

      <main className="flex-1 py-10 md:py-14 lg:py-16">
        <div className="container mx-auto px-4 max-w-3xl">

          {/* Hero */}
          <div className="mb-10 md:mb-12">
            <h1 className="text-2xl md:text-3xl font-bold text-[#101828] mb-3">
              Programa de Creadores
            </h1>
            <p className="text-xl md:text-2xl font-semibold text-[#00C1A7] mb-4">
              Creá contenido y ganá con Bausing
            </p>
            <p className="text-[#4A5565] text-sm md:text-base leading-relaxed">
              Si te gusta hacer contenido, hablar a cámara o editar videos, este programa es para vos.
              En Bausing buscamos personas que quieran recomendar nuestros productos de forma auténtica
              y ayudar a otros a mejorar su descanso y bienestar.
            </p>
          </div>

          {/* Qué tenés que hacer */}
          <section className="mb-10 md:mb-12">
            <h2 className="text-lg md:text-xl font-bold text-[#101828] mb-5">
              ¿Qué tenés que hacer?
            </h2>
            <ul className="space-y-4">
              {[
                "Crear contenido mostrando o recomendando productos Bausing",
                "Compartirlo en tus redes sociales",
                "Conectar con tu comunidad de forma real",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#00C1A7] text-white text-sm font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-[#4A5565] text-sm md:text-base leading-relaxed pt-1">
                    {item}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <hr className="border-gray-200 mb-10 md:mb-12" />

          {/* Qué necesitás */}
          <section className="mb-10 md:mb-12">
            <h2 className="text-lg md:text-xl font-bold text-[#101828] mb-3">
              ¿Qué necesitás para participar?
            </h2>
            <ul className="space-y-4 mb-5">
              <li className="flex items-start gap-3">
                <span className="text-[#00C1A7] text-lg leading-none mt-0.5">✓</span>
                <p className="text-[#4A5565] text-sm md:text-base leading-relaxed">
                  Tener al menos una red social activa{" "}
                  <span className="text-[#64748B]">(Instagram, TikTok, X o YouTube)</span>
                </p>
              </li>
              <li className="flex items-center gap-3 text-[#4A5565] text-sm md:text-base">
                <span className="text-[#00C1A7] text-lg leading-none">✓</span>
                Perfil público
              </li>
              <li className="flex items-center gap-3 text-[#4A5565] text-sm md:text-base">
                <span className="text-[#00C1A7] text-lg leading-none">✓</span>
                Ganas de crear contenido
              </li>
            </ul>
            <p className="text-[#101828] font-semibold text-sm md:text-base border-l-4 border-[#00C1A7] pl-4">
              No hace falta ser influencer. Buscamos autenticidad.
            </p>
          </section>

          <hr className="border-gray-200 mb-10 md:mb-12" />

          {/* Cómo me sumo */}
          <section className="mb-10 md:mb-12">
            <h2 className="text-lg md:text-xl font-bold text-[#101828] mb-3">
              ¿Cómo me sumo?
            </h2>
            <p className="text-[#4A5565] text-sm md:text-base mb-5">
              Es muy simple. Enviá un mensaje por WhatsApp:
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#00C1A7] font-semibold text-sm md:text-base hover:underline mb-6"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              +54 9 351 873-7683
            </a>
            <p className="text-[#4A5565] text-sm md:text-base leading-relaxed">
              Vamos a revisar tu perfil y, si cumplís con los requisitos, te confirmamos el ingreso al programa.
              Una vez dentro, ya podés empezar a crear contenido y generar ingresos.
            </p>
          </section>

          <hr className="border-gray-200 mb-10 md:mb-12" />

          {/* Por qué sumarte */}
          <section className="mb-10 md:mb-12">
            <h2 className="text-lg md:text-xl font-bold text-[#101828] mb-5">
              ¿Por qué sumarte?
            </h2>
            <ul className="space-y-3">
              {[
                "Monetizás tu contenido",
                "Trabajás con una marca en crecimiento",
                "Ayudás a otras personas a mejorar su descanso",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-[#101828] text-sm md:text-base font-medium">
                  <span className="text-[#00C1A7] text-lg leading-none">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* CTA */}
          <div className="bg-[#F0FDF9] border border-[#00C1A7]/20 rounded-xl p-6 md:p-8 text-center">
            <p className="text-[#101828] font-semibold text-base md:text-lg mb-5">
              ¿Listo para empezar?
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#00C1A7] text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-[#00a892] transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Quiero ser creador
            </a>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
