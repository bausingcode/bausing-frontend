import type { Metadata } from "next";
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
  return {
    title: `${label} — Catálogo`,
    description,
    alternates: { canonical: `${getSiteUrl()}${path}` },
    openGraph: {
      title: titleWithBrand(`${label} — Catálogo`),
      description,
      url: `${getSiteUrl()}${path}`,
    },
  };
}

export default function CatalogoSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
