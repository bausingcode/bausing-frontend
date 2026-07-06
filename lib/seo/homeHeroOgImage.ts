import { isHeroVideoUrl } from "@/lib/heroMedia";
import type { HeroImage } from "@/lib/api";
import {
  absoluteUrl,
  getSiteUrl,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_URL,
  OG_IMAGE_WIDTH,
  SITE_NAME,
} from "@/lib/seo/site";
import { backendOriginFromEnv } from "@/lib/backendOrigin";

export type DefaultOgImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

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

export async function getDefaultOgImage(): Promise<DefaultOgImage> {
  const heroes = await fetchHomeHeroes();
  const hero = heroes.find(
    (item) =>
      Boolean(item.image_url_mobile?.trim()) && !isHeroVideoUrl(item.image_url)
  ) ?? heroes.find((item) => !isHeroVideoUrl(item.image_url));

  const alt = `${SITE_NAME} — colchones y descanso`;
  const base = getSiteUrl();

  if (hero) {
    return {
      url: `${base}/api/og-image?v=${encodeURIComponent(hero.id)}`,
      width: 720,
      height: 1280,
      alt,
    };
  }

  return {
    url: `${base}/api/og-image?v=fallback`,
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt,
  };
}

export async function resolveOgImageBytes(): Promise<{
  bytes: ArrayBuffer;
  contentType: string;
} | null> {
  const source = await getHomeHeroMobileOgImageUrl();
  if (!source) return null;

  try {
    const response = await fetch(source, { next: { revalidate: 300 } });
    if (!response.ok) return null;
    const bytes = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";
    return { bytes, contentType };
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
