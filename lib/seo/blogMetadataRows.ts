import type { BlogPost } from "@/lib/api";
import { stripHtml, titleWithBrand } from "@/lib/seo/site";

export interface BlogMetadataRow {
  id: string;
  title: string;
  slug: string;
  status: BlogPost["status"];
  defaultTitle: string;
  defaultDescription: string;
  effectiveTitle: string;
  effectiveDescription: string;
  hasOverride: boolean;
}

/**
 * Fila de artículo del blog para la pestaña Metadatos. Replica el fallback de
 * app/blog/[slug]/layout.tsx (título con marca, descripción desde extracto/contenido)
 * para que lo "automático" mostrado acá coincida con lo que sirve la página real.
 */
export function buildBlogMetadataRow(post: BlogPost): BlogMetadataRow {
  const defaultTitle = titleWithBrand(post.title);
  const defaultDescription =
    stripHtml(post.excerpt || post.content?.slice(0, 400), 160) || post.title;
  const customTitle = post.meta_title?.trim() || "";
  const customDescription = post.meta_description?.trim() || "";
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status,
    defaultTitle,
    defaultDescription,
    effectiveTitle: customTitle || defaultTitle,
    effectiveDescription: customDescription || defaultDescription,
    hasOverride: Boolean(customTitle || customDescription),
  };
}
