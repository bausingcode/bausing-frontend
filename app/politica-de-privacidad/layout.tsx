import type { Metadata } from "next";
import { buildPageOpenGraph, buildPageTwitter } from "@/lib/seo/openGraph";
import { getSiteUrl, titleWithBrand } from "@/lib/seo/site";

const description =
  "Política de privacidad de Bausing: tratamiento de datos personales y uso del sitio.";
const url = `${getSiteUrl()}/politica-de-privacidad`;
const title = titleWithBrand("Política de privacidad");

export const metadata: Metadata = {
  title: "Política de privacidad",
  description,
  alternates: { canonical: url },
  openGraph: buildPageOpenGraph({ title, description, url }),
  twitter: buildPageTwitter({ title, description }),
};

export default function PoliticaPrivacidadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
