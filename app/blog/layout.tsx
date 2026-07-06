import type { Metadata } from "next";
import { buildPageOpenGraph, buildPageTwitter } from "@/lib/seo/openGraph";
import { getSiteUrl, titleWithBrand } from "@/lib/seo/site";

const description =
  "Consejos sobre descanso, colchones y hábitos para dormir mejor. Artículos del equipo Bausing.";
const url = `${getSiteUrl()}/blog`;
const title = titleWithBrand("Blog");

export const metadata: Metadata = {
  title: "Blog",
  description,
  alternates: { canonical: url },
  openGraph: buildPageOpenGraph({ title, description, url }),
  twitter: buildPageTwitter({ title, description }),
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
