import type { Metadata } from "next";

export const SITE_NAME = "Bausing";

export const SITE_TAGLINE =
  "Encontrá colchones y sommiers en Córdoba con precio directo de fábrica, calidad de hotel, envíos gratis y pago recién al recibir el producto.";

export const SITE_KEYWORDS = [
  "Bausing",
  "colchones",
  "sommier",
  "descanso",
  "dormitorio",
  "colchón online",
  "tienda de colchones",
];

/**
 * Canonical site URL for metadata, OG tags and sitemap.
 * Prefer custom domain over *.vercel.app preview URLs.
 */
export function getSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_FRONTEND_URL,
  ]
    .map((value) => value?.trim().replace(/\/$/, ""))
    .filter(Boolean) as string[];

  const customDomain = candidates.find(
    (url) => !url.includes("localhost") && !url.includes("vercel.app")
  );
  if (customDomain) return customDomain;

  const anyConfigured = candidates.find((url) => !url.includes("localhost"));
  if (anyConfigured) return anyConfigured;

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

export function absoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return getSiteUrl();
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = getSiteUrl();
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

export function stripHtml(html?: string | null, maxLen = 160): string {
  if (!html) return "";
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1).trim()}…`;
}

export function titleWithBrand(segment: string): string {
  const s = segment.trim();
  if (!s || s === SITE_NAME) return SITE_NAME;
  return `${s} | ${SITE_NAME}`;
}

const TITLE_CASE_LOCALE = "es-AR";

/** Primera letra de cada palabra en mayúscula (p. ej. nombres desde slug en URL). */
export function titleCaseWords(text: string): string {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLocaleLowerCase(TITLE_CASE_LOCALE);
      const first = lower.charAt(0);
      const rest = lower.slice(1);
      return first.toLocaleUpperCase(TITLE_CASE_LOCALE) + rest;
    })
    .join(" ");
}

const FAVICON_PATH = "/images/logo/favicon.png";

// Fallback estático si el hero del home no está disponible al generar metadata.
export const OG_IMAGE_URL = "/images/logo/og-image.png?v=3";
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export function rootMetadata(ogImage?: {
  url: string | URL;
  width?: number;
  height?: number;
  alt?: string;
  secureUrl?: string | URL;
  type?: string;
}): Metadata {
  const base = getSiteUrl();
  const image = ogImage ?? {
    url: absoluteUrl(OG_IMAGE_URL),
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt: `${SITE_NAME} — colchones y descanso`,
    type: "image/jpeg",
  };
  const imageUrl =
    typeof image.url === "string"
      ? image.url.startsWith("http")
        ? image.url
        : absoluteUrl(image.url)
      : image.url.toString();
  return {
    metadataBase: new URL(base),
    title: {
      default: "Colchones en Córdoba | Directo de fábrica, envíos gratis y pago al recibir | Bausing",
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_TAGLINE,
    keywords: SITE_KEYWORDS,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    icons: {
      icon: [{ url: FAVICON_PATH, type: "image/png" }],
      apple: [{ url: FAVICON_PATH, type: "image/png" }],
      shortcut: FAVICON_PATH,
    },
    openGraph: {
      type: "website",
      locale: "es_AR",
      siteName: SITE_NAME,
      title: "Colchones en Córdoba | Directo de fábrica, envíos gratis y pago al recibir | Bausing",
      description: SITE_TAGLINE,
      url: base,
      images: [
        {
          url: imageUrl,
          secureUrl: imageUrl,
          width: image.width,
          height: image.height,
          alt: image.alt ?? `${SITE_NAME} — colchones y descanso`,
          type: image.type ?? "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Colchones en Córdoba | Directo de fábrica, envíos gratis y pago al recibir | Bausing",
      description: SITE_TAGLINE,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    category: "shopping",
    other: {
      "p:domain_verify": "8b20c1e38e2c7ee765c5e9a75833d354",
    },
  };
}
