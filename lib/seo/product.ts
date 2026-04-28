import type { Product } from "@/lib/api";
import { SITE_NAME, stripHtml } from "@/lib/seo/site";

/** Igual al `<h1>` de la ficha: nombre tal cual viene del API. */
export function productPageTitle(product: Product): string {
  return product.name.trim() || "Producto";
}

export function buildProductMetaDescription(product: Product): string {
  const fromHtml = stripHtml(product.description, 155);
  if (fromHtml.length >= 70) return fromHtml;

  const parts: string[] = [];
  parts.push(product.name.trim());
  if (product.category_name) parts.push(product.category_name);
  if (product.category_option_value)
    parts.push(product.category_option_value);
  const sub = product.subcategories?.[0]?.subcategory_name;
  if (sub) parts.push(sub);

  const base = [...new Set(parts.filter(Boolean))].join(" · ");
  const suffix = `Comprá en ${SITE_NAME} con envío y cuotas.`;
  const combined = `${base}. ${suffix}`;
  if (combined.length <= 160) return combined;
  return `${base.slice(0, 120).trim()}… ${suffix}`;
}

export function buildProductKeywords(product: Product): string[] {
  const out: string[] = [
    product.name,
    SITE_NAME,
    "colchón",
    "colchones",
    "descanso",
  ];
  if (product.category_name) out.push(product.category_name);
  if (product.category_option_value) out.push(product.category_option_value);
  for (const s of product.subcategories ?? []) {
    if (s.subcategory_name) out.push(s.subcategory_name);
  }
  return [...new Set(out.map((k) => k.trim()).filter(Boolean))];
}

export function productPrimaryImageUrl(product: Product): string | undefined {
  if (product.main_image?.trim()) return product.main_image.trim();
  const sorted = [...(product.images ?? [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );
  return sorted[0]?.image_url?.trim() || undefined;
}

export function productImageUrls(product: Product, max = 8): string[] {
  const urls: string[] = [];
  if (product.main_image?.trim()) urls.push(product.main_image.trim());
  const sorted = [...(product.images ?? [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );
  for (const img of sorted) {
    if (img.image_url && !urls.includes(img.image_url)) {
      urls.push(img.image_url);
    }
    if (urls.length >= max) break;
  }
  return urls;
}

/** Disponibilidad para schema.org: solo `crm_products.stock` vía `has_crm_stock` del API. */
export function productOfferAvailability(product: Product): string {
  if (product.has_crm_stock === false) {
    return "https://schema.org/OutOfStock";
  }
  return "https://schema.org/InStock";
}

export function productOfferPrice(product: Product): number | undefined {
  if (typeof product.min_price === "number" && product.min_price > 0) {
    return product.min_price;
  }
  const prices = product.variants?.flatMap((v) => v.prices ?? []) ?? [];
  const nums = prices
    .map((p) => p.price)
    .filter((n): n is number => typeof n === "number" && n > 0);
  if (nums.length === 0) return undefined;
  return Math.min(...nums);
}
