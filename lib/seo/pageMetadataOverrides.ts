import { fetchPublicPageMetadata } from "@/lib/api";

export interface ResolvedPageMetadata {
  title: string;
  description: string;
  /** true si el título vino del override guardado en /admin/seo (no del default hardcodeado). */
  titleIsOverride: boolean;
}

/**
 * Resuelve el título/descripción efectivos de una página, priorizando el
 * override guardado desde /admin/seo (pestaña "Metadatos") sobre el valor
 * hardcodeado/autogenerado que trae la página.
 *
 * Cuando el título viene del override, `titleIsOverride` es true: el que
 * llama debe usar ese texto tal cual (sin pasarlo por `titleWithBrand` ni
 * dejar que el template del layout raíz le agregue " | Bausing"), porque el
 * editor ya decide el título completo desde el Excel.
 */
export async function resolvePageMetadata(
  path: string,
  fallback: { title: string; description: string }
): Promise<ResolvedPageMetadata> {
  const overrides = await fetchPublicPageMetadata();
  const match = overrides.find((o) => o.path === path);
  const titleOverride = match?.meta_title?.trim();
  const descriptionOverride = match?.meta_description?.trim();
  return {
    title: titleOverride || fallback.title,
    description: descriptionOverride || fallback.description,
    titleIsOverride: Boolean(titleOverride),
  };
}
