import { getSiteUrl, SITE_NAME } from "@/lib/seo/site";

export type OgImageEntry = {
  url: string;
  secureUrl?: string;
  width?: number;
  height?: number;
  alt?: string;
  type?: string;
};

/** URL estable same-origin; el endpoint resuelve el banner mobile del hero. */
export function defaultOgImageEntry(): OgImageEntry {
  const base = getSiteUrl();
  return {
    url: `${base}/api/og-image`,
    secureUrl: `${base}/api/og-image`,
    width: 720,
    height: 1280,
    alt: `${SITE_NAME} — colchones y descanso`,
    type: "image/jpeg",
  };
}

export function defaultTwitterImages(): string[] {
  return [`${getSiteUrl()}/api/og-image`];
}

type PageOpenGraphInput = {
  title: string;
  description: string;
  url: string;
  type?: "website" | "article";
  images?: OgImageEntry[];
  publishedTime?: string;
  modifiedTime?: string;
};

export function buildPageOpenGraph(input: PageOpenGraphInput) {
  const images =
    input.images && input.images.length > 0
      ? input.images
      : [defaultOgImageEntry()];

  return {
    type: input.type ?? "website",
    locale: "es_AR" as const,
    siteName: SITE_NAME,
    title: input.title,
    description: input.description,
    url: input.url,
    ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
    ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
    images,
  };
}

export function buildPageTwitter(input: {
  title: string;
  description: string;
  images?: string[];
}) {
  const images =
    input.images && input.images.length > 0
      ? input.images
      : defaultTwitterImages();

  return {
    card: "summary_large_image" as const,
    title: input.title,
    description: input.description,
    images,
  };
}
