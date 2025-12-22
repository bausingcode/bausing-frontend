"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { fetchBlogPosts, BlogPost } from "@/lib/api";

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

// Función auxiliar para calcular tiempo de lectura (promedio 200 palabras por minuto)
function calculateReadTime(content?: string): string {
  if (!content) return "3 min";
  // Remover tags HTML y obtener solo el texto
  const textContent = content.replace(/<[^>]*>/g, '').trim();
  const words = textContent.split(/\s+/).filter(word => word.length > 0).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min`;
}

// Función auxiliar para obtener categoría de keywords
function getCategory(keywords?: Array<{ keyword: string }>): string {
  if (!keywords || keywords.length === 0) return "Blog";
  return keywords[0].keyword;
}

// Función auxiliar para formatear fecha
function formatDate(dateString?: string): string {
  if (!dateString) return "Fecha no disponible";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Fecha no disponible";
  }
}

// Función para transformar BlogPost a Article
function transformPostToArticle(post: BlogPost, index: number): Article {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    description: post.excerpt || "",
    date: formatDate(post.published_at || post.created_at),
    readTime: calculateReadTime(post.content),
    category: getCategory(post.keywords),
    featured: index < 3, // Los primeros 3 son featured
    image: post.cover_image_url || "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
  };
}

// Componente Skeleton para artículo
function ArticleSkeleton() {
  return (
    <article className="group bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden flex flex-col animate-pulse">
      <div className="relative h-44 w-full overflow-hidden bg-gray-200"></div>
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-center gap-3">
          <div className="h-3 bg-gray-200 rounded w-20"></div>
          <div className="w-1 h-1 rounded-full bg-gray-200"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="h-5 bg-gray-200 rounded w-full"></div>
        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-24 mt-2"></div>
      </div>
    </article>
  );
}

export default function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadPosts() {
      try {
        setLoading(true);
        const posts = await fetchBlogPosts({ 
          status: "published",
          include_keywords: true,
          include_images: false
        });
        const transformed = posts.map((post, index) => transformPostToArticle(post, index));
        setArticles(transformed);
      } catch (error) {
        console.error("Error loading blog posts:", error);
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  const featured = articles.filter((a) => a.featured);
  const others = articles.filter((a) => !a.featured);

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
            {loading ? (
              <>
                {/* Skeleton para destacados */}
                <div className="space-y-4 mb-10 md:mb-14">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-5 bg-gray-200 rounded w-40 mb-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="grid gap-6 md:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                      <ArticleSkeleton key={i} />
                    ))}
                  </div>
                </div>
                {/* Skeleton para todos los artículos */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-5 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                      <ArticleSkeleton key={i} />
                    ))}
                  </div>
                </div>
              </>
            ) : articles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-center max-w-md">
                  <div className="mb-6">
                    <svg
                      className="mx-auto h-24 w-24 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay artículos disponibles</h3>
                  <p className="text-gray-600">
                    Próximamente publicaremos contenido nuevo en nuestro blog. ¡Vuelve pronto!
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Destacados */}
                {featured.length > 0 && (
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
                )}

                {/* Todos los artículos */}
                {others.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
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
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

