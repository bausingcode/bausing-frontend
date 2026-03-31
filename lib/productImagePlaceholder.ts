/** Inline SVG — no red ni reintentos si falta imagen (antes usábamos /images/placeholder.png inexistente). */
export const PRODUCT_IMAGE_PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><rect fill="#f3f4f6" width="800" height="800"/><g fill="none" stroke="#c4c9d1" stroke-width="10" stroke-linejoin="round" opacity=".95"><rect x="268" y="268" width="264" height="264" rx="14"/><path fill="#e8eaee" stroke="#c4c9d1" d="M286 486l72-98 54 70 64-84 78 112z"/><circle cx="498" cy="338" r="22" fill="#e8eaee" stroke="#c4c9d1" stroke-width="10"/></g></svg>',
  );

export function firstProductImageUrl(product: {
  main_image?: string | null;
  images?: Array<{ image_url?: string | null }> | null;
}): string {
  const main = product.main_image?.trim();
  if (main) return main;
  const fromGallery = product.images?.find((img) => img?.image_url?.trim())?.image_url?.trim();
  if (fromGallery) return fromGallery;
  return PRODUCT_IMAGE_PLACEHOLDER;
}
