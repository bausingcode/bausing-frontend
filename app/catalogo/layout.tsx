import type { Metadata } from "next";
import { getSiteUrl, titleWithBrand } from "@/lib/seo/site";

const description =
  "Explorá colchones, sommiers y productos de descanso en Bausing. Filtrá por categoría, medidas y comodidad. Comprá online con envío.";

export const metadata: Metadata = {
  title: "Catálogo",
  description,
  keywords: ["catálogo Bausing", "colchones", "sommier", "descanso"],
  alternates: { canonical: `${getSiteUrl()}/catalogo` },
  openGraph: {
    title: titleWithBrand("Catálogo"),
    description,
    url: `${getSiteUrl()}/catalogo`,
  },
};

export default function CatalogoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
