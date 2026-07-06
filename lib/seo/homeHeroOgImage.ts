import { isHeroVideoUrl } from "@/lib/heroMedia";
import type { HeroImage } from "@/lib/api";
import { backendOriginFromEnv } from "@/lib/backendOrigin";
import { defaultOgImageEntry } from "@/lib/seo/openGraph";
import { absoluteUrl, OG_IMAGE_URL } from "@/lib/seo/site";

async function fetchHomeHeroes(): Promise<HeroImage[]> {
  const params = new URLSearchParams({
    position: "1",
    active: "true",
  });

  const candidates: string[] = [];
  const backendBase = backendOriginFromEnv();
  candidates.push(`${backendBase}/hero-images?${params.toString()}`);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (siteUrl) {
    candidates.push(`${siteUrl}/api/hero-images?${params.toString()}`);
  }

  for (const url of candidates) {
    try {
      const response = await fetch(url, { next: { revalidate: 300 } });
      if (!response.ok) continue;
      const data = await response.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        return data.data as HeroImage[];
      }
    } catch {
      // try next candidate
    }
  }

  return [];
}

/** Misma lógica que el hero móvil del home: primer slide con `image_url_mobile` (no video). */
export function pickHomeHeroOgSourceUrl(heroes: HeroImage[]): string | null {
  for (const hero of heroes) {
    const mobile = hero.image_url_mobile?.trim();
    if (mobile && !isHeroVideoUrl(hero.image_url)) {
      return mobile;
    }
  }

  for (const hero of heroes) {
    if (!isHeroVideoUrl(hero.image_url)) {
      return hero.image_url;
    }
  }

  return null;
}

export async function getHomeHeroMobileOgImageUrl(): Promise<string | null> {
  const heroes = await fetchHomeHeroes();
  const source = pickHomeHeroOgSourceUrl(heroes);
  return source ? absoluteUrl(source) : null;
}

export async function getDefaultOgImage() {
  return defaultOgImageEntry();
}

export function toOgCrawlerImageUrl(sourceUrl: string): string {
  const absolute = absoluteUrl(sourceUrl);
  return `https://wsrv.nl/?url=${encodeURIComponent(absolute)}&w=720&output=jpg&q=85&n=1`;
}

export async function resolveOgImageBytes(): Promise<{
  bytes: ArrayBuffer;
  contentType: string;
} | null> {
  const source = await getHomeHeroMobileOgImageUrl();
  if (!source) return null;

  try {
    const response = await fetch(toOgCrawlerImageUrl(source), {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    const bytes = await response.arrayBuffer();
    return { bytes, contentType: "image/jpeg" };
  } catch {
    return null;
  }
}

export async function resolveOgImageFallbackBytes(): Promise<{
  bytes: ArrayBuffer;
  contentType: string;
} | null> {
  const fallbackUrl = absoluteUrl(OG_IMAGE_URL);
  try {
    const response = await fetch(fallbackUrl, { next: { revalidate: 3600 } });
    if (!response.ok) return null;
    const bytes = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/png";
    return { bytes, contentType };
  } catch {
    return null;
  }
}
