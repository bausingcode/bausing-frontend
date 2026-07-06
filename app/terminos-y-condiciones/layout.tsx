import type { Metadata } from "next";
import { buildPageOpenGraph, buildPageTwitter } from "@/lib/seo/openGraph";
import { getSiteUrl, titleWithBrand } from "@/lib/seo/site";

const description =
  "Términos y condiciones de uso de la tienda Bausing y compra de productos online.";
const url = `${getSiteUrl()}/terminos-y-condiciones`;
const title = titleWithBrand("Términos y condiciones");

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description,
  alternates: { canonical: url },
  openGraph: buildPageOpenGraph({ title, description, url }),
  twitter: buildPageTwitter({ title, description }),
};

export default function TerminosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
