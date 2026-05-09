import ProductDetailPageClient from "./ProductDetailPageClient";
import { getProductForSeo } from "@/lib/seo/productFetch";
import { productPrimaryImageUrl } from "@/lib/seo/product";
import wsrvLoader from "@/lib/wsrvLoader";

export default async function ProductPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const initialProduct = await getProductForSeo(id);
  const primary = initialProduct ? productPrimaryImageUrl(initialProduct) : null;
  const preloadHref =
    primary && /^https?:\/\//i.test(primary)
      ? wsrvLoader({ src: primary, width: 960 })
      : null;

  return (
    <>
      {preloadHref ? (
        <link rel="preload" as="image" href={preloadHref} />
      ) : null}
      <ProductDetailPageClient
        key={id}
        productId={id}
        initialApiProduct={initialProduct}
      />
    </>
  );
}
