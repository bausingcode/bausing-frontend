import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ChevronDown } from "lucide-react";
import { fetchPublicFaqItems, fetchActiveEvent } from "@/lib/api";
import {
  getSiteUrl,
  titleWithBrand,
} from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Respondemos las dudas más comunes sobre envíos, pagos, garantía y productos Bausing.",
  alternates: { canonical: `${getSiteUrl()}/preguntas-frecuentes` },
  openGraph: {
    title: titleWithBrand("Preguntas frecuentes"),
    description:
      "Respondemos las dudas más comunes sobre envíos, pagos, garantía y productos.",
    url: `${getSiteUrl()}/preguntas-frecuentes`,
  },
};

export default async function PreguntasFrecuentesPage() {
  const [items, activeEvent] = await Promise.all([
    fetchPublicFaqItems(),
    fetchActiveEvent().catch(() => null),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar event={activeEvent} />

      <main className="flex-1 py-10 md:py-14 lg:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-2xl md:text-3xl font-bold text-[#101828] mb-2">
            Preguntas frecuentes
          </h1>
          <p className="text-[#64748B] text-sm md:text-base mb-8 md:mb-10">
            Encontrá respuestas rápidas sobre compras, envíos y productos. Si
            necesitás algo más, podés escribirnos por WhatsApp desde el inicio.
          </p>

          {items.length === 0 ? (
            <p className="text-[#64748B] text-sm md:text-base border-t border-gray-200 pt-6">
              Por el momento no hay preguntas publicadas. Volvé a intentar más
              tarde.
            </p>
          ) : (
            <ul
              className="border-t border-b border-gray-200 divide-y divide-gray-200"
              role="list"
            >
              {items.map((item) => (
                <li key={item.id}>
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 md:py-5 text-left font-semibold text-[#101828] text-sm md:text-base [&::-webkit-details-marker]:hidden">
                      <span className="flex-1 pr-2">{item.question}</span>
                      <ChevronDown
                        className="h-5 w-5 shrink-0 text-[#00C1A7] transition-transform group-open:rotate-180"
                        aria-hidden
                      />
                    </summary>
                    <div className="pb-4 md:pb-5 -mt-1">
                      <p className="text-[#4A5565] text-sm md:text-base leading-relaxed whitespace-pre-wrap pt-1">
                        {item.answer}
                      </p>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
