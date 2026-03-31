import type { Metadata } from "next";
import { getProductForSeo } from "@/lib/seo/productFetch";
import { getSiteUrl, SITE_NAME } from "@/lib/seo/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductForSeo(id);
  const name = product?.name?.trim();

  const titleText = "Combos disponibles";
  const description = name
    ? `Combos disponibles que incluyen ${name}. Armá tu pack con envío y cuotas en ${SITE_NAME}.`
    : `Combos y packs especiales disponibles en ${SITE_NAME}.`;

  const url = `${getSiteUrl()}/productos/${id}/combos`;

  return {
    title: { absolute: titleText },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "es_AR",
      url,
      title: titleText,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: titleText,
      description,
    },
  };
}

export default function ProductCombosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
