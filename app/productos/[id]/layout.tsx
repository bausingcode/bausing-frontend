import type { Metadata } from "next";
import {
  buildProductKeywords,
  buildProductMetaDescription,
  productPageTitle,
  productPrimaryImageUrl,
} from "@/lib/seo/product";
import { getProductForSeo } from "@/lib/seo/productFetch";
import { getDefaultOgImage } from "@/lib/seo/homeHeroOgImage";
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
  const defaultOgImage = primaryImage ? null : await getDefaultOgImage();
  const ogImages = primaryImage
    ? [{ url: absoluteUrl(primaryImage), alt: product.name }]
    : [
        {
          url: defaultOgImage!.url,
          width: defaultOgImage!.width,
          height: defaultOgImage!.height,
          alt: defaultOgImage!.alt,
        },
      ];
  const twitterImages = primaryImage
    ? [absoluteUrl(primaryImage)]
    : [defaultOgImage!.url];

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
      card: primaryImage ? "summary_large_image" : "summary",
      title: titleText,
      description,
      images: twitterImages,
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
