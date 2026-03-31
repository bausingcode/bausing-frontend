import {
  productImageUrls,
  productOfferAvailability,
  productOfferPrice,
} from "@/lib/seo/product";
import { getProductForSeo } from "@/lib/seo/productFetch";
import { absoluteUrl, getSiteUrl, SITE_NAME, stripHtml } from "@/lib/seo/site";

export default async function ProductStructuredData({
  productId,
}: {
  productId: string;
}) {
  const product = await getProductForSeo(productId);
  if (!product?.is_active) return null;

  const url = `${getSiteUrl()}/productos/${productId}`;
  const images = productImageUrls(product).map((u) => absoluteUrl(u));
  const description =
    stripHtml(product.description, 5000) ||
    `${product.name}. ${SITE_NAME} — colchones y descanso.`;

  const price = productOfferPrice(product);
  const offer =
    price != null
      ? {
          "@type": "Offer",
          url,
          priceCurrency: "ARS",
          price: String(price),
          availability: productOfferAvailability(product),
          seller: {
            "@type": "Organization",
            name: SITE_NAME,
            url: getSiteUrl(),
          },
        }
      : {
          "@type": "Offer",
          url,
          availability: productOfferAvailability(product),
          seller: {
            "@type": "Organization",
            name: SITE_NAME,
            url: getSiteUrl(),
          },
        };

  const payload: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    url,
    image: images.length ? images : undefined,
    sku: product.sku || undefined,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    category: product.category_name || undefined,
    offers: offer,
  };

  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) delete payload[k];
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
