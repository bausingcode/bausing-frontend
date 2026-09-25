import { fetchPublicSeoConfig } from "@/lib/api";
import { defaultRobotsTxt } from "@/lib/seo/robotsDefault";

/** Siempre generado on-demand: refleja el override guardado desde el admin al instante. */
export const dynamic = "force-dynamic";

export async function GET() {
  const seo = await fetchPublicSeoConfig();
  const body = seo.robotsTxt?.trim() ? seo.robotsTxt : defaultRobotsTxt();

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
