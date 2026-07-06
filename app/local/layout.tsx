import type { Metadata } from "next";
import { buildPageOpenGraph, buildPageTwitter } from "@/lib/seo/openGraph";
import { getSiteUrl, titleWithBrand } from "@/lib/seo/site";

const description =
  "Conocé Bausing: locales, contacto y redes. Estamos para ayudarte a elegir tu colchón ideal.";
const url = `${getSiteUrl()}/local`;
const title = titleWithBrand("Local");

export const metadata: Metadata = {
  title: "Local",
  description,
  alternates: { canonical: url },
  openGraph: buildPageOpenGraph({ title, description, url }),
  twitter: buildPageTwitter({ title, description }),
};

export default function LocalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
