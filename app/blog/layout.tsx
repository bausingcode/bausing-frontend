import type { Metadata } from "next";
import { getSiteUrl, titleWithBrand } from "@/lib/seo/site";

const description =
  "Consejos sobre descanso, colchones y hábitos para dormir mejor. Artículos del equipo Bausing.";

export const metadata: Metadata = {
  title: "Blog",
  description,
  alternates: { canonical: `${getSiteUrl()}/blog` },
  openGraph: {
    title: titleWithBrand("Blog"),
    description,
    url: `${getSiteUrl()}/blog`,
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
