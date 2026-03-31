import type { Metadata } from "next";
import {
  buildProductKeywords,
  buildProductMetaDescription,
  productPageTitle,
  productPrimaryImageUrl,
} from "@/lib/seo/product";
import { getProductForSeo } from "@/lib/seo/productFetch";
import { absoluteUrl, getSiteUrl } from "@/lib/seo/site";
import ProductStructuredData from "./ProductStructuredData";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductForSeo(id);

  if (!product || !product.is_active) {
    return {
      title: "Producto",
      robots: { index: false, follow: true },
    };
  }

  const titleText = productPageTitle(product);
  const description = buildProductMetaDescription(product);
  const keywords = buildProductKeywords(product);
  const primaryImage = productPrimaryImageUrl(product);
  const url = `${getSiteUrl()}/productos/${id}`;
  const ogImages = primaryImage
    ? [
        {
          url: absoluteUrl(primaryImage),
          alt: product.name,
        },
      ]
    : undefined;

  return {
    title: { absolute: titleText },
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "es_AR",
      url,
      title: titleText,
      description,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: titleText,
      description,
      images: primaryImage ? [absoluteUrl(primaryImage)] : undefined,
    },
  };
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <ProductStructuredData productId={id} />
      {children}
    </>
  );
}
