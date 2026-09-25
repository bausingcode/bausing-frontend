import {
  fetchCategories,
  fetchBlogPosts,
  fetchPublicSeoConfig,
  type Category,
} from "@/lib/api";
import { categorySlug } from "@/lib/seo/catalogPaths";
import { absoluteUrl, getSiteUrl, SITE_NAME, SITE_TAGLINE } from "@/lib/seo/site";

/** Siempre generado on-demand: refleja el catálogo/blog reales y la config del admin. */
export const dynamic = "force-dynamic";

async function catalogSection(): Promise<string> {
  let categories: Category[] = [];
  try {
    categories = await fetchCategories(true);
  } catch {
    return "";
  }
  const roots = categories.filter((c) => !c.parent_id);
  if (!roots.length) return "";

  const lines = roots.map(
    (root) => `- [${root.name}](${absoluteUrl(`/catalogo/${categorySlug(root.name)}`)})`
  );
  return `## Catálogo\n\n${lines.join("\n")}`;
}

async function blogSection(): Promise<string> {
  try {
    const posts = await fetchBlogPosts({ status: "published", include_images: false });
    if (!posts.length) return "";
    const recent = [...posts]
      .sort((a, b) => {
        const ta = Date.parse(a.published_at ?? a.created_at ?? "") || 0;
        const tb = Date.parse(b.published_at ?? b.created_at ?? "") || 0;
        return tb - ta;
      })
      .slice(0, 10);
    const lines = recent.map((p) => `- [${p.title}](${absoluteUrl(`/blog/${p.slug}`)})`);
    return `## Blog\n\n${lines.join("\n")}`;
  } catch {
    return "";
  }
}

function pagesSection(): string {
  const links = [
    ["Catálogo completo", "/catalogo"],
    ["Preguntas frecuentes", "/preguntas-frecuentes"],
    ["Club de beneficios", "/club-beneficios"],
    ["Términos y condiciones", "/terminos-y-condiciones"],
    ["Política de privacidad", "/politica-de-privacidad"],
  ] as const;
  const lines = links.map(([label, path]) => `- [${label}](${absoluteUrl(path)})`);
  return `## Páginas\n\n${lines.join("\n")}`;
}

/** Contenido generado automáticamente a partir del catálogo y el blog reales. */
async function autoLlmsTxt(): Promise<string> {
  const base = getSiteUrl();
  const sections = [
    `# ${SITE_NAME}`,
    `> ${SITE_TAGLINE}`,
    await catalogSection(),
    await blogSection(),
    pagesSection(),
    `Sitemap: ${base}/sitemap.xml`,
  ].filter(Boolean);
  return sections.join("\n\n") + "\n";
}

export async function GET() {
  const seo = await fetchPublicSeoConfig();
  const body = seo.llmsTxt?.trim() ? seo.llmsTxt : await autoLlmsTxt();

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
