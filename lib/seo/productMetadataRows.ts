import type { Product } from "@/lib/api";
import { productPageTitle, buildProductMetaDescription } from "@/lib/seo/product";

export interface ProductMetadataRow {
  id: string;
  name: string;
  sku?: string;
  defaultTitle: string;
  defaultDescription: string;
  effectiveTitle: string;
  effectiveDescription: string;
  hasOverride: boolean;
}

/**
 * Fila de producto para la pestaña Metadatos. Reusa productPageTitle/
 * buildProductMetaDescription (lib/seo/product.ts) para que el título/descripción
 * "efectivo" y "automático" mostrados acá sean exactamente los que calcula la
 * página real — cero lógica duplicada.
 */
export function buildProductMetadataRow(product: Product): ProductMetadataRow {
  const withoutOverride: Product = { ...product, meta_title: null, meta_description: null };
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    defaultTitle: productPageTitle(withoutOverride),
    defaultDescription: buildProductMetaDescription(withoutOverride),
    effectiveTitle: productPageTitle(product),
    effectiveDescription: buildProductMetaDescription(product),
    hasOverride: Boolean(product.meta_title?.trim() || product.meta_description?.trim()),
  };
}
