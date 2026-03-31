import type { MetadataRoute } from "next";
import {
  fetchBlogPosts,
  fetchCategories,
  fetchProducts,
  type Category,
} from "@/lib/api";
import { collectCatalogPaths } from "@/lib/seo/catalogPaths";
import { getSiteUrl } from "@/lib/seo/site";

/** API client uses no-store; sitemap is always generated on demand. */
export const dynamic = "force-dynamic";

function lastFromCategories(categories: Category[]): Date | undefined {
  let latest: number | undefined;
  for (const c of categories) {
    const t = c.created_at ? Date.parse(c.created_at) : NaN;
    if (!Number.isNaN(t) && (latest === undefined || t > latest)) latest = t;
  }
  return latest !== undefined ? new Date(latest) : undefined;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${base}/catalogo`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${base}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${base}/local`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/terminos-y-condiciones`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/politica-de-privacidad`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  let categoryPaths: string[] = [];
  let categories: Category[] = [];
  try {
    categories = await fetchCategories(true);
    categoryPaths = collectCatalogPaths(categories);
  } catch {
    categoryPaths = [];
  }

  const catModified = lastFromCategories(categories);
  const catalogSlugEntries: MetadataRoute.Sitemap = categoryPaths.map(
    (path) => ({
      url: `${base}${path}`,
      lastModified: catModified ?? now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }),
  );

  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const posts = await fetchBlogPosts({
      status: "published",
      include_images: false,
    });
    blogEntries = posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.updated_at
        ? new Date(p.updated_at)
        : p.published_at
          ? new Date(p.published_at)
          : now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    }));
  } catch {
    blogEntries = [];
  }

  const productUrls = new Set<string>();
  try {
    let page = 1;
    let totalPages = 1;
    const maxPages = 200;
    do {
      const res = await fetchProducts({
        is_active: true,
        page,
        per_page: 100,
        sort: "created_at_desc",
      });
      for (const p of res.products) {
        productUrls.add(`${base}/productos/${p.id}`);
      }
      totalPages = res.total_pages || 1;
      page += 1;
    } while (page <= totalPages && page <= maxPages);
  } catch {
    /* sitemap still valid without products */
  }

  const productEntries: MetadataRoute.Sitemap = [...productUrls].map((url) => ({
    url,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  return [
    ...staticEntries,
    ...catalogSlugEntries,
    ...blogEntries,
    ...productEntries,
  ];
}
