import type { Metadata } from "next";

export const SITE_NAME = "Bausing";

export const SITE_TAGLINE =
  "Colchones, sommiers y descanso con envío a domicilio. Encontrá tu modelo ideal y comprá online con cuotas.";

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
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://bausing.com).
 */
export function getSiteUrl(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (env) return env;
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

export function rootMetadata(): Metadata {
  const base = getSiteUrl();
  return {
    metadataBase: new URL(base),
    title: {
      default: titleWithBrand(SITE_NAME),
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
      title: titleWithBrand("Inicio"),
      description: SITE_TAGLINE,
      url: base,
      images: [
        {
          url: FAVICON_PATH,
          width: 512,
          height: 512,
          alt: `${SITE_NAME} — colchones y descanso`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: titleWithBrand("Inicio"),
      description: SITE_TAGLINE,
      images: [FAVICON_PATH],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    category: "shopping",
  };
}
