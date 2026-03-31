import type { Metadata } from "next";
import { getSiteUrl, titleWithBrand } from "@/lib/seo/site";

const description =
  "Conocé Bausing: locales, contacto y redes. Estamos para ayudarte a elegir tu colchón ideal.";

export const metadata: Metadata = {
  title: "Local",
  description,
  alternates: { canonical: `${getSiteUrl()}/local` },
  openGraph: {
    title: titleWithBrand("Local"),
    description,
    url: `${getSiteUrl()}/local`,
  },
};

export default function LocalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
