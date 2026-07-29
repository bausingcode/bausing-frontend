import type { MetaCustomData } from "./types";

const STORAGE_KEY = "bausing_meta_last_product";

export type MetaProductContext = {
  content_id: string;
  content_name: string;
  content_category?: string;
  value: number;
  currency: string;
};

/** Guarda el producto visto para enriquecer Contact desde WhatsApp en PDP. */
export function setMetaProductContext(product: MetaProductContext | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!product) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(product));
  } catch {
    // ignore
  }
}

export function getMetaProductContext(): MetaProductContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MetaProductContext;
    if (!parsed?.content_id) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function metaProductToCustomData(
  product: MetaProductContext | null | undefined,
): MetaCustomData | undefined {
  if (!product?.content_id) return undefined;
  return {
    content_ids: [product.content_id],
    content_name: product.content_name,
    content_category: product.content_category || undefined,
    content_type: "product",
    value: product.value,
    currency: product.currency || "ARS",
    contents: [
      {
        id: product.content_id,
        quantity: 1,
        item_price: product.value,
      },
    ],
  };
}
