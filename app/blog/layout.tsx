import type { Metadata } from "next";
import { buildPageOpenGraph, buildPageTwitter } from "@/lib/seo/openGraph";
import { getSiteUrl, titleWithBrand } from "@/lib/seo/site";
import { resolvePageMetadata } from "@/lib/seo/pageMetadataOverrides";

const url = `${getSiteUrl()}/blog`;

export async function generateMetadata(): Promise<Metadata> {
  const { title, description, titleIsOverride } = await resolvePageMetadata("/blog", {
    title: "Blog",
    description:
      "Consejos sobre descanso, colchones y hábitos para dormir mejor. Artículos del equipo Bausing.",
  });
  const ogTitle = titleIsOverride ? title : titleWithBrand(title);
  return {
    title: titleIsOverride ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: buildPageOpenGraph({ title: ogTitle, description, url }),
    twitter: buildPageTwitter({ title: ogTitle, description }),
  };
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
