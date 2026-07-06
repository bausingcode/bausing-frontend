import type { Metadata } from "next";
import { buildPageOpenGraph, buildPageTwitter } from "@/lib/seo/openGraph";
import { getSiteUrl, titleCaseWords, titleWithBrand } from "@/lib/seo/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const label = slug
    .map((s) => titleCaseWords(s.replace(/-/g, " ")))
    .filter(Boolean)
    .join(" · ");
  const path = `/catalogo/${slug.join("/")}`;
  const description = `Productos de ${label} en Bausing: colchones y descanso con envío y cuotas.`;
  const url = `${getSiteUrl()}${path}`;
  const title = titleWithBrand(`${label} — Catálogo`);
  return {
    title: `${label} — Catálogo`,
    description,
    alternates: { canonical: url },
    openGraph: buildPageOpenGraph({ title, description, url }),
    twitter: buildPageTwitter({ title, description }),
  };
}

export default function CatalogoSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
