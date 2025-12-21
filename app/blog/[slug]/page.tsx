"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";

const mockArticle = {
  title: "Cómo elegir el colchón ideal para tu descanso",
  category: "Descanso",
  date: "12 Mar 2025",
  readTime: "6 min",
  cover:
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80",
  author: "Equipo Bausing",
  summary:
    "Una guía práctica con criterios clave para escoger el colchón perfecto según tu postura, peso y preferencias de firmeza.",
  content: [
    {
      heading: "1. Define tu posición de descanso",
      body: "Quienes duermen de lado suelen necesitar mayor alivio de presión en hombros y cadera. Si duermes boca arriba, una firmeza media a media-firme mantiene la columna alineada. Para los que duermen boca abajo, evita colchones demasiado blandos para no hundir la zona lumbar.",
    },
    {
      heading: "2. Considera el peso y la firmeza",
      body: "Personas con mayor peso suelen sentirse más cómodas en firmezas medias a firmes, que evitan hundimientos excesivos. Si eres más liviano, una firmeza media o media-blanda puede brindar mejor adaptación sin perder soporte.",
    },
    {
      heading: "3. Materiales y ventilación",
      body: "Espumas de alta densidad y látex ofrecen buen soporte y durabilidad. Si priorizas frescura, busca núcleos con canales de ventilación o resortes pocket que favorezcan el flujo de aire, combinados con tapas de tejido respirable.",
    },
    {
      heading: "4. Prueba y ajusta",
      body: "Siempre que sea posible, pruébalo en la posición en la que duermes. Un periodo de adaptación de 2 a 4 semanas es normal. Complementa con almohadas adecuadas a tu postura para completar el soporte cervical.",
    },
  ],
};

export default function ArticlePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src={mockArticle.cover}
              alt={mockArticle.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
          </div>
          <div className="relative container mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-28">
            <div className="max-w-3xl space-y-4 text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 backdrop-blur">
                {mockArticle.category}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">{mockArticle.title}</h1>
              <p className="text-base md:text-lg text-white/90">{mockArticle.summary}</p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                <span>{mockArticle.author}</span>
                <span className="w-1 h-1 rounded-full bg-white/60" />
                <span>{mockArticle.date}</span>
                <span className="w-1 h-1 rounded-full bg-white/60" />
                <span>{mockArticle.readTime} de lectura</span>
              </div>
            </div>
          </div>
        </section>

        {/* Body */}
        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4 md:px-6 lg:px-8 grid lg:grid-cols-[2fr_1fr] gap-10 text-gray-500">
            <article className="prose max-w-none prose-headings:text-gray-900 prose-p:text-gray-500 prose-li:text-gray-500 prose-strong:text-gray-900">
              {mockArticle.content.map((block, index) => (
                <div key={block.heading} className="space-y-2 mb-8">
                  <h3
                    className={`text-lg md:text-xl font-semibold ${
                      index === 0 ? "text-black" : "text-gray-900"
                    }`}
                  >
                    {block.heading}
                  </h3>
                  <p>{block.body}</p>
                </div>
              ))}
            </article>

            <aside className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-[12px] p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Datos rápidos</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Firmeza sugerida: media a media-firme.</li>
                  <li>• Ideal para: postura lateral o boca arriba.</li>
                  <li>• Tip: combiná con almohada altura media.</li>
                </ul>
              </div>
              <div className="bg-white border border-gray-200 rounded-[12px] p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Etiquetas</h4>
                <div className="flex flex-wrap gap-2">
                  {["Descanso", "Colchones", "Guía rápida"].map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full bg-[#00C1A7]/10 text-[#00C1A7] text-xs font-semibold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

