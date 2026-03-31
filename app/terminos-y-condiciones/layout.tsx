import type { Metadata } from "next";
import { getSiteUrl, titleWithBrand } from "@/lib/seo/site";

const description =
  "Términos y condiciones de uso de la tienda Bausing y compra de productos online.";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description,
  alternates: { canonical: `${getSiteUrl()}/terminos-y-condiciones` },
  openGraph: {
    title: titleWithBrand("Términos y condiciones"),
    description,
    url: `${getSiteUrl()}/terminos-y-condiciones`,
  },
};

export default function TerminosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
