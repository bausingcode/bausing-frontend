import type { Metadata } from "next";
import { buildPageOpenGraph, buildPageTwitter } from "@/lib/seo/openGraph";
import { getSiteUrl, titleWithBrand } from "@/lib/seo/site";
import { resolvePageMetadata } from "@/lib/seo/pageMetadataOverrides";

const url = `${getSiteUrl()}/politica-de-privacidad`;

export async function generateMetadata(): Promise<Metadata> {
  const { title, description, titleIsOverride } = await resolvePageMetadata("/politica-de-privacidad", {
    title: "Política de Privacidad",
    description:
      "Política de privacidad de Bausing: cómo recopilamos, utilizamos y protegemos tu información personal.",
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

export default function PoliticaPrivacidadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
