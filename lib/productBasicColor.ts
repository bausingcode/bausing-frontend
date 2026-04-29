/** Slugs alineados al backend (normalize_basic_product_color) */
export const PRODUCT_BASIC_COLOR_SLUGS = ["negro", "beige", "gris", "blanco"] as const;

export type ProductBasicColorSlug = (typeof PRODUCT_BASIC_COLOR_SLUGS)[number];

export const PRODUCT_BASIC_COLOR_LABEL: Record<ProductBasicColorSlug, string> = {
  negro: "Negro",
  beige: "Beige",
  gris: "Gris",
  blanco: "Blanco",
};

export const CATALOGO_BASIC_COLOR_FILTER_ID = "catalogo-basic-color";
