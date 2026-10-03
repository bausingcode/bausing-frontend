import type { Metadata } from "next";
import { buildPageOpenGraph, buildPageTwitter } from "@/lib/seo/openGraph";
import { getSiteUrl, titleWithBrand } from "@/lib/seo/site";
import { resolvePageMetadata } from "@/lib/seo/pageMetadataOverrides";

const url = `${getSiteUrl()}/local`;

export async function generateMetadata(): Promise<Metadata> {
  const { title, description, titleIsOverride } = await resolvePageMetadata("/local", {
    title: "Local",
    description:
      "Conocé Bausing: locales, contacto y redes. Estamos para ayudarte a elegir tu colchón ideal.",
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

export default function LocalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
