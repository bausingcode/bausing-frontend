import type { Metadata } from "next";
import { buildPageOpenGraph, buildPageTwitter } from "@/lib/seo/openGraph";
import { getSiteUrl, titleWithBrand } from "@/lib/seo/site";

const description =
  "Explorá colchones, sommiers y productos de descanso en Bausing. Filtrá por categoría, medidas y comodidad. Comprá online con envío.";

const url = `${getSiteUrl()}/catalogo`;
const title = titleWithBrand("Catálogo");

export const metadata: Metadata = {
  title: "Catálogo",
  description,
  keywords: ["catálogo Bausing", "colchones", "sommier", "descanso"],
  alternates: { canonical: url },
  openGraph: buildPageOpenGraph({ title, description, url }),
  twitter: buildPageTwitter({ title, description }),
};

export default function CatalogoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
