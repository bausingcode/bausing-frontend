import type { Metadata } from "next";
import { buildPageOpenGraph, buildPageTwitter } from "@/lib/seo/openGraph";
import { getSiteUrl, titleCaseWords, titleWithBrand } from "@/lib/seo/site";
import { resolvePageMetadata } from "@/lib/seo/pageMetadataOverrides";

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
  const { title, description, titleIsOverride } = await resolvePageMetadata(path, {
    title: `${label} — Catálogo`,
    description: `Productos de ${label} en Bausing: colchones y descanso con envío y cuotas.`,
  });
  const url = `${getSiteUrl()}${path}`;
  const ogTitle = titleIsOverride ? title : titleWithBrand(title);
  return {
    title: titleIsOverride ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: buildPageOpenGraph({ title: ogTitle, description, url }),
    twitter: buildPageTwitter({ title: ogTitle, description }),
  };
}

export default function CatalogoSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
