import type { Metadata } from "next";
import { getSiteUrl, titleWithBrand } from "@/lib/seo/site";

const description =
  "Política de privacidad de Bausing: tratamiento de datos personales y uso del sitio.";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description,
  alternates: { canonical: `${getSiteUrl()}/politica-de-privacidad` },
  openGraph: {
    title: titleWithBrand("Política de privacidad"),
    description,
    url: `${getSiteUrl()}/politica-de-privacidad`,
  },
};

export default function PoliticaPrivacidadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
