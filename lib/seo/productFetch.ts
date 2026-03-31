import { cache } from "react";
import { fetchProductById, type Product } from "@/lib/api";

/** Un solo fetch por request entre `generateMetadata` y JSON-LD. */
export const getProductForSeo = cache(
  async (productId: string): Promise<Product | null> => {
    return fetchProductById(productId).catch(() => null);
  },
);
