import type { Category, PageMetadataOverride } from "@/lib/api";
import { categorySlug } from "@/lib/seo/catalogPaths";
import { titleCaseWords } from "@/lib/seo/site";
import { INSTITUTIONAL_PAGES } from "@/lib/seo/institutionalPages";

export interface PageMetadataRow {
  path: string;
  page_type: "category" | "institutional";
  label: string;
  defaultTitle: string;
  defaultDescription: string;
  effectiveTitle: string;
  effectiveDescription: string;
  hasOverride: boolean;
}

/** Mismo criterio que generateMetadata de app/catalogo/[...slug]/layout.tsx. */
function labelFromSlugSegments(segments: string[]): string {
  return segments
    .map((s) => titleCaseWords(s.replace(/-/g, " ")))
    .filter(Boolean)
    .join(" · ");
}

function makeCategoryRow(
  path: string,
  label: string,
  overrideByPath: Map<string, PageMetadataOverride>
): PageMetadataRow {
  const defaultTitle = `${label} — Catálogo`;
  const defaultDescription = `Productos de ${label} en Bausing: colchones y descanso con envío y cuotas.`;
  const override = overrideByPath.get(path);
  return {
    path,
    page_type: "category",
    label,
    defaultTitle,
    defaultDescription,
    effectiveTitle: override?.meta_title?.trim() || defaultTitle,
    effectiveDescription: override?.meta_description?.trim() || defaultDescription,
    hasOverride: Boolean(override),
  };
}

/**
 * Combina las categorías/subcategorías (excluye productos) con las páginas
 * institucionales hardcodeadas, y pisa con el override guardado (si existe)
 * para mostrar el título/descripción realmente efectivos de cada URL.
 */
export function buildCandidateRows(
  categories: Category[],
  overrides: PageMetadataOverride[]
): PageMetadataRow[] {
  const overrideByPath = new Map(overrides.map((o) => [o.path, o]));
  const rows: PageMetadataRow[] = [];

  const roots = categories.filter((c) => !c.parent_id);
  for (const root of roots) {
    const parentSlug = categorySlug(root.name);
    const parentLabel = labelFromSlugSegments([parentSlug]);
    rows.push(makeCategoryRow(`/catalogo/${parentSlug}`, parentLabel, overrideByPath));

    const children = categories.filter((c) => c.parent_id === root.id);
    for (const child of children) {
      const childSlug = categorySlug(child.name);
      const label = labelFromSlugSegments([parentSlug, childSlug]);
      rows.push(
        makeCategoryRow(`/catalogo/${parentSlug}/${childSlug}`, label, overrideByPath)
      );
    }
  }

  for (const page of INSTITUTIONAL_PAGES) {
    const override = overrideByPath.get(page.path);
    rows.push({
      path: page.path,
      page_type: "institutional",
      label: page.label,
      defaultTitle: page.defaultTitle,
      defaultDescription: page.defaultDescription,
      effectiveTitle: override?.meta_title?.trim() || page.defaultTitle,
      effectiveDescription: override?.meta_description?.trim() || page.defaultDescription,
      hasOverride: Boolean(override),
    });
  }

  return rows;
}
