import { fetchHeroImages } from "@/lib/api";
import { isHeroVideoUrl } from "@/lib/heroMedia";
import {
  absoluteUrl,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_URL,
  OG_IMAGE_WIDTH,
  SITE_NAME,
} from "@/lib/seo/site";

export type DefaultOgImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

/** Misma lógica que el hero móvil del home: primer slide con `image_url_mobile` (no video). */
export async function getHomeHeroMobileOgImageUrl(): Promise<string | null> {
  try {
    const heroes = await fetchHeroImages(1, true);

    for (const hero of heroes) {
      const mobile = hero.image_url_mobile?.trim();
      if (mobile && !isHeroVideoUrl(hero.image_url)) {
        return absoluteUrl(mobile);
      }
    }

    for (const hero of heroes) {
      if (!isHeroVideoUrl(hero.image_url)) {
        return absoluteUrl(hero.image_url);
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function getDefaultOgImage(): Promise<DefaultOgImage> {
  const heroUrl = await getHomeHeroMobileOgImageUrl();
  const alt = `${SITE_NAME} — colchones y descanso`;

  if (heroUrl) {
    return {
      url: heroUrl,
      width: 720,
      height: 1280,
      alt,
    };
  }

  return {
    url: absoluteUrl(OG_IMAGE_URL),
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt,
  };
}
