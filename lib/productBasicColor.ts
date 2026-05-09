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

/** Etiqueta para checkboxes de facetas (valor en minúsculas): cuatro canónicos con label fijo, resto capitalizado suave. */
export function catalogBasicColorFacetLabel(slugLower: string): string {
  const s = slugLower.trim().toLowerCase();
  if (!s) return "";
  const map = PRODUCT_BASIC_COLOR_LABEL as Record<string, string>;
  if (map[s]) return map[s];
  return s
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Texto vitrina/grid: muestra todas las etiquetas si hay manual_color_labels */
function friendlyColorSegment(label: string): string {
  const t = label.trim();
  if (!t) return "";
  const lower = t.toLowerCase();
  const map = PRODUCT_BASIC_COLOR_LABEL as Record<string, string>;
  return map[lower] ?? t;
}

export function catalogProductColorsLine(product: {
  manual_color_labels?: string[] | null;
  basic_color?: string | null;
}): string | undefined {
  const raw = Array.isArray(product.manual_color_labels)
    ? product.manual_color_labels.map((x) => String(x).trim()).filter(Boolean)
    : [];
  if (raw.length > 0) {
    return raw.map(friendlyColorSegment).join(", ");
  }
  const bc = product.basic_color?.trim();
  if (!bc) return undefined;
  return friendlyColorSegment(bc);
}

/** Igualdad con token del facet: basic_color o algún elemento manual igual (trim + lower). */
export function catalogProductMatchesBasicColorSlug(
  product: {
    manual_color_labels?: string[] | null;
    basic_color?: string | null;
  },
  slug: string,
): boolean {
  const canon = slug.trim().toLowerCase();
  if (!canon) return false;
  const bc = product.basic_color?.trim().toLowerCase();
  if (bc && bc === canon) return true;
  const labels = product.manual_color_labels;
  if (!Array.isArray(labels)) return false;
  return labels.some((raw) => {
    const normalized = String(raw ?? "").trim().toLowerCase();
    return normalized === canon;
  });
}
