"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";

type Article = {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  category: string;
  featured: boolean;
  image: string;
};

const articles: Article[] = [
  {
    id: "1",
    slug: "como-elegir-el-colchon-ideal",
    title: "Cómo elegir el colchón ideal para tu descanso",
    description:
      "Guía práctica para seleccionar el colchón perfecto según tu postura, peso y preferencias de firmeza.",
    date: "12 Mar 2025",
    readTime: "6 min",
    category: "Descanso",
    featured: true,
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "2",
    slug: "tendencias-en-sommiers-confort-y-diseno",
    title: "Tendencias en sommiers: confort y diseño",
    description:
      "Materiales, tecnologías y estilos que están marcando el camino en sommiers premium para tu dormitorio.",
    date: "28 Feb 2025",
    readTime: "5 min",
    category: "Hogar",
    featured: true,
    image:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "3",
    slug: "guia-rapida-para-medir-tu-espacio",
    title: "Guía rápida para medir tu espacio antes de comprar",
    description:
      "Checklist de medidas y tips para asegurarte de que tu nuevo mueble o colchón encaje perfecto.",
    date: "10 Feb 2025",
    readTime: "4 min",
    category: "Tips",
    featured: true,
    image:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "4",
    slug: "5-habitos-para-mejorar-tu-sueno",
    title: "5 hábitos para mejorar la calidad de tu sueño",
    description:
      "Rutinas simples que puedes adoptar hoy para descansar mejor y despertar con más energía.",
    date: "22 Ene 2025",
    readTime: "7 min",
    category: "Bienestar",
    featured: false,
    image:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "5",
    slug: "protege-tu-colchon",
    title: "Protegé tu colchón: fundas, rotación y mantenimiento",
    description:
      "Consejos prácticos para prolongar la vida útil de tu colchón y mantenerlo como nuevo.",
    date: "15 Ene 2025",
    readTime: "5 min",
    category: "Mantenimiento",
    featured: false,
    image:
      "https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "6",
    slug: "como-elegir-almohadas",
    title: "Cómo elegir almohadas según tu forma de dormir",
    description:
      "Altura, firmeza y materiales recomendados para quienes duermen de lado, boca arriba o boca abajo.",
    date: "03 Ene 2025",
    readTime: "6 min",
    category: "Descanso",
    featured: false,
    image:
      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "7",
    slug: "tips-express-dormitorio-en-un-dia",
    title: "Tips express para armar tu dormitorio en 1 día",
    description:
      "Checklist rápido de tareas, orden y accesorios para dejar tu cuarto listo sin complicaciones.",
    date: "20 Dic 2024",
    readTime: "4 min",
    category: "Tips",
    featured: false,
    image:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "8",
    slug: "iluminar-tu-cuarto-para-descanso",
    title: "Cómo iluminar tu cuarto para un descanso óptimo",
    description:
      "Temperatura de color, intensidad y ubicación de luminarias para mejorar tu rutina de sueño.",
    date: "08 Dic 2024",
    readTime: "5 min",
    category: "Bienestar",
    featured: false,
    image:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "9",
    slug: "errores-al-comprar-muebles-online",
    title: "Errores comunes al comprar muebles online",
    description:
      "Medidas, materiales y políticas de envío que debes revisar antes de confirmar tu compra.",
    date: "30 Nov 2024",
    readTime: "6 min",
    category: "Tips",
    featured: false,
    image:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "10",
    slug: "mantenimiento-para-sommiers-premium",
    title: "Guía de mantenimiento para sommiers premium",
    description:
      "Rotación, limpieza y protección para extender la vida útil y el confort de tu sommier.",
    date: "18 Nov 2024",
    readTime: "5 min",
    category: "Mantenimiento",
    featured: false,
    image:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "11",
    slug: "textiles-que-transforman-tu-dormitorio",
    title: "Textiles que transforman tu dormitorio",
    description:
      "Sábanas, acolchados y almohadas: qué materiales elegir según estación y estilo.",
    date: "05 Nov 2024",
    readTime: "6 min",
    category: "Hogar",
    featured: false,
    image:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "12",
    slug: "checklist-para-tu-primera-mudanza",
    title: "Checklist para tu primera mudanza",
    description:
      "Organización, empaque y compras esenciales para llegar y tener todo listo sin estrés.",
    date: "22 Oct 2024",
    readTime: "7 min",
    category: "Tips",
    featured: false,
    image:
      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80",
  },
];

import { useRouter } from "next/navigation";

export default function BlogPage() {
  const featured = articles.filter((a) => a.featured);
  const others = articles.filter((a) => !a.featured);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 bg-white">
        {/* Hero */}
        <section className="relative overflow-hidden py-16 md:py-24">
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80"
              alt="Dormitorio luminoso"
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/30 to-transparent" />
          </div>
          <div className="relative container mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex flex-col gap-4 max-w-4xl">
              <span className="inline-flex items-center gap-2 w-fit px-4 py-2 rounded-full text-xs font-semibold bg-[#00C1A7]/15 text-[#00C1A7]">
                Blog Bausing
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                Inspiración, tips y guías para tu hogar
              </h1>
              <p className="text-base md:text-xl text-gray-700 max-w-3xl leading-relaxed">
                Descubrí las últimas tendencias, recomendaciones de expertos y guías prácticas para mejorar tu
                descanso y tus espacios.
              </p>
            </div>
          </div>
        </section>

        {/* Contenido */}
        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            {/* Destacados */}
            <div className="space-y-4 mb-10 md:mb-14">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#00C1A7]">Artículos destacados</p>
                  <p className="text-sm text-gray-600">Lo más leído y recomendado por nuestro equipo.</p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {featured.map((article) => (
                  <article
                    key={article.id}
                    className="group bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:-translate-y-1 transition-transform cursor-pointer relative"
                    onClick={() => router.push(`/blog/${article.slug}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="relative h-44 w-full overflow-hidden">
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      />
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-gray-900">
                        {article.category}
                      </span>
                    </div>
                    <div className="p-5 flex flex-col gap-3 flex-1">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{article.date}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span>{article.readTime} de lectura</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 leading-snug line-clamp-2">{article.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{article.description}</p>
                      <a
                        href={`/blog/${article.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-[#00C1A7] hover:text-[#009a8d]"
                      >
                        <span className="hover:underline">Leer artículo</span>
                        <span aria-hidden>→</span>
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Todos los artículos */}
            <div className="space-y-4">
              <div className="flex itemscenter justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Todos los artículos</p>
                  <p className="text-sm text-gray-600">Explora todas nuestras notas y guías.</p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {others.map((article) => (
                  <article
                    key={article.id}
                    className="group bg-white rounded-[14px] border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:-translate-y-1 transition-transform cursor-pointer relative"
                    onClick={() => router.push(`/blog/${article.slug}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="relative h-40 w-full overflow-hidden">
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      />
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-gray-900">
                        {article.category}
                      </span>
                    </div>
                    <div className="p-5 flex flex-col gap-3 flex-1">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{article.date}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span>{article.readTime} de lectura</span>
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 leading-snug line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{article.description}</p>
                      <a
                        href={`/blog/${article.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-[#00C1A7] hover:text-[#009a8d]"
                      >
                        <span className="hover:underline">Leer artículo</span>
                        <span aria-hidden>→</span>
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

