"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { fetchBlogPostBySlug, BlogPost } from "@/lib/api";
import { sanitizeBlogHtml } from "@/lib/sanitizeBlogHtml";
import NewsletterSection from "@/components/NewsletterSection";

// Función auxiliar para calcular tiempo de lectura (promedio 200 palabras por minuto)
function calculateReadTime(content?: string): string {
  if (!content) return "3 min";
  // Remover tags HTML y obtener solo el texto
  const textContent = content.replace(/<[^>]*>/g, '').trim();
  const words = textContent.split(/\s+/).filter(word => word.length > 0).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min`;
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

// Componente Skeleton para artículo
function ArticleSkeleton() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Skeleton */}
        <section className="relative overflow-hidden">
          <div className="h-96 bg-gray-200 animate-pulse"></div>
          <div className="relative container mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-28 -mt-96">
            <div className="max-w-3xl space-y-4">
              <div className="h-6 bg-white/50 rounded-full w-24 animate-pulse"></div>
              <div className="h-10 bg-white/50 rounded w-3/4 animate-pulse"></div>
              <div className="h-6 bg-white/50 rounded w-2/3 animate-pulse"></div>
              <div className="h-4 bg-white/50 rounded w-1/2 animate-pulse"></div>
            </div>
          </div>
        </section>

        {/* Body Skeleton */}
        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4 md:px-6 lg:px-8 grid lg:grid-cols-[2fr_1fr] gap-10">
            <article className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-7 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </article>
            <aside className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-[12px] p-4">
                <div className="h-5 bg-gray-200 rounded w-24 mb-3 animate-pulse"></div>
                <div className="flex flex-wrap gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
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

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [article, setArticle] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadArticle() {
      if (!slug) return;
      
      try {
        setLoading(true);
        const post = await fetchBlogPostBySlug(slug);
        if (!post) {
          setNotFound(true);
        } else {
          setArticle(post);
        }
      } catch (error) {
        console.error("Error loading article:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadArticle();
  }, [slug]);

  const content = article?.content || "";
  const safeHtml = useMemo(() => sanitizeBlogHtml(content), [content]);

  if (loading) {
    return <ArticleSkeleton />;
  }

  if (notFound || !article) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Artículo no encontrado</h1>
            <p className="text-gray-600 mb-6">
              El artículo que buscas no existe o ha sido eliminado.
            </p>
            <button
              onClick={() => router.push("/blog")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#00C1A7] text-white rounded-lg hover:bg-[#009a8d] transition-colors"
            >
              Volver al blog
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const date = formatDate(article.published_at || article.created_at);
  const readTime = calculateReadTime(article.content);
  const author = article.author?.email || "Equipo Bausing";
  const coverImage = article.cover_image_url || "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=100";

  const ctaUrl = article.cta_url?.trim() || "";
  const ctaLabel = article.cta_label?.trim() || "";
  const ctaIsExternal = /^https?:\/\//i.test(ctaUrl);
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src={coverImage}
              alt={article.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
          </div>
          <div className="relative container mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-28">
            <div className="max-w-3xl space-y-4 text-white">
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">{article.title}</h1>
              {article.excerpt && (
                <p className="text-base md:text-lg text-white/90">{article.excerpt}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                <span>{date}</span>
                <span className="w-1 h-1 rounded-full bg-white/60" />
                <span>{readTime} de lectura</span>
              </div>
            </div>
          </div>
        </section>

        {/* Body (sin etiquetas/keywords: solo uso interno en admin) */}
        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-3xl">
            <article>
              {safeHtml ? (
                <div
                  className="blog-article-body"
                  dangerouslySetInnerHTML={{ __html: safeHtml }}
                />
              ) : (
                <p className="text-gray-600">No hay contenido disponible.</p>
              )}
              {ctaLabel && ctaUrl ? (
                <div className="not-prose mt-10">
                  <a
                    href={ctaUrl}
                    className="inline-flex items-center justify-center rounded-full bg-[#101828] px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#1d2939] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00C1A7]/50"
                    {...(ctaIsExternal
                      ? { target: "_blank" as const, rel: "noopener noreferrer" }
                      : {})}
                  >
                    {ctaLabel}
                  </a>
                </div>
              ) : null}
            </article>
          </div>
        </section>

        <NewsletterSection />
      </main>

      <Footer />
    </div>
  );
}

