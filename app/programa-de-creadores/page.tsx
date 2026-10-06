import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fetchActiveEvent, fetchCreatorProgramContent, type CreatorProgramContent } from "@/lib/api";
import { buildPageOpenGraph, buildPageTwitter } from "@/lib/seo/openGraph";
import { getSiteUrl, titleWithBrand } from "@/lib/seo/site";
import { resolvePageMetadata } from "@/lib/seo/pageMetadataOverrides";

const DEFAULT_CONTENT: CreatorProgramContent = {
  hero_title: "Programa de Creadores",
  hero_subtitle: "Creá contenido y ganá con Bausing",
  hero_description:
    "Si te gusta hacer contenido, hablar a cámara o editar videos, este programa es para vos. " +
    "En Bausing buscamos personas que quieran recomendar nuestros productos de forma auténtica " +
    "y ayudar a otros a mejorar su descanso y bienestar.",
  steps_title: "¿Qué tenés que hacer?",
  steps: [
    "Crear contenido mostrando o recomendando productos Bausing",
    "Compartirlo en tus redes sociales",
    "Conectar con tu comunidad de forma real",
  ],
  requirements_title: "¿Qué necesitás para participar?",
  requirements: [
    "Tener al menos una red social activa (Instagram, TikTok, X o YouTube)",
    "Perfil público",
    "Ganas de crear contenido",
  ],
  requirements_note: "No hace falta ser influencer. Buscamos autenticidad.",
  join_title: "¿Cómo me sumo?",
  join_description: "Es muy simple. Completá el siguiente formulario:",
  whatsapp_number: "5493518737683",
  whatsapp_message: "Hola, quiero sumarme al Programa de Creadores de Bausing",
  join_followup:
    "Vamos a revisar tu perfil y, si cumplís con los requisitos, te confirmamos el ingreso al " +
    "programa. Una vez dentro, ya podés empezar a crear contenido y generar ingresos.",
  benefits_title: "¿Por qué sumarte?",
  benefits: [
    "Monetizás tu contenido",
    "Trabajás con una marca en crecimiento",
    "Ayudás a otras personas a mejorar su descanso",
  ],
  cta_title: "¿Listo para empezar?",
  cta_button_text: "Quiero ser creador",
};

const url = `${getSiteUrl()}/programa-de-creadores`;

export async function generateMetadata(): Promise<Metadata> {
  const { title, description, titleIsOverride } = await resolvePageMetadata("/programa-de-creadores", {
    title: "Programa de Creadores",
    description:
      "Creá contenido mostrando productos Bausing y generá ingresos. No hace falta ser influencer, solo ganas de crear y compartir.",
  });
  const ogTitle = titleIsOverride ? title : titleWithBrand(title);
  return {
    title: titleIsOverride ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: buildPageOpenGraph({ title: ogTitle, description, url }),
    twitter: buildPageTwitter({ title: ogTitle, description }),
  };
}

const FORM_URL = "https://forms.gle/LXYAzUd6R4FYAG5r8";

export default async function ProgramaCreadoresPage() {
  const [activeEvent, fetchedContent] = await Promise.all([
    fetchActiveEvent().catch(() => null),
    fetchCreatorProgramContent(),
  ]);
  const content = fetchedContent || DEFAULT_CONTENT;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar event={activeEvent} />

      <main className="flex-1 py-10 md:py-14 lg:py-16">
        <div className="container mx-auto px-4 max-w-3xl">

          {/* Hero */}
          <div className="mb-10 md:mb-12">
            <h1 className="text-2xl md:text-3xl font-bold text-[#101828] mb-3">
              {content.hero_title}
            </h1>
            <p className="text-xl md:text-2xl font-semibold text-[#00C1A7] mb-4">
              {content.hero_subtitle}
            </p>
            <p className="text-[#4A5565] text-sm md:text-base leading-relaxed">
              {content.hero_description}
            </p>
          </div>

          {/* Qué tenés que hacer */}
          <section className="mb-10 md:mb-12">
            <h2 className="text-lg md:text-xl font-bold text-[#101828] mb-5">
              {content.steps_title}
            </h2>
            <ul className="space-y-4">
              {content.steps.map((item, i) => (
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
              {content.requirements_title}
            </h2>
            <ul className="space-y-4 mb-5">
              {content.requirements.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-[#00C1A7] text-lg leading-none mt-0.5">✓</span>
                  <p className="text-[#4A5565] text-sm md:text-base leading-relaxed">{item}</p>
                </li>
              ))}
            </ul>
            <p className="text-[#101828] font-semibold text-sm md:text-base border-l-4 border-[#00C1A7] pl-4">
              {content.requirements_note}
            </p>
          </section>

          <hr className="border-gray-200 mb-10 md:mb-12" />

          {/* Cómo me sumo */}
          <section className="mb-10 md:mb-12">
            <h2 className="text-lg md:text-xl font-bold text-[#101828] mb-3">
              {content.join_title}
            </h2>
            <p className="text-[#4A5565] text-sm md:text-base mb-5">
              {content.join_description}
            </p>
            <a
              href={FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#00C1A7] font-semibold text-sm md:text-base hover:underline mb-6"
            >
              Completar formulario
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <p className="text-[#4A5565] text-sm md:text-base leading-relaxed">
              {content.join_followup}
            </p>
          </section>

          <hr className="border-gray-200 mb-10 md:mb-12" />

          {/* Por qué sumarte */}
          <section className="mb-10 md:mb-12">
            <h2 className="text-lg md:text-xl font-bold text-[#101828] mb-5">
              {content.benefits_title}
            </h2>
            <ul className="space-y-3">
              {content.benefits.map((item, i) => (
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
              {content.cta_title}
            </p>
            <a
              href={FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#00C1A7] text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-[#00a892] transition-colors"
            >
              {content.cta_button_text}
            </a>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
