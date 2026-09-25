import { getSiteUrl } from "./site";

const DEFAULT_DISALLOW = [
  "/admin",
  "/login-admin",
  "/usuario",
  "/tracking",
  "/reviews",
  "/checkout",
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/reset-password",
  "/favoritos",
];

/** robots.txt generado automáticamente a partir de las rutas privadas del sitio. */
export function defaultRobotsTxt(): string {
  const base = getSiteUrl();
  const lines = [
    "User-Agent: *",
    "Allow: /",
    ...DEFAULT_DISALLOW.map((path) => `Disallow: ${path}`),
    "",
    `Host: ${new URL(base).host}`,
    `Sitemap: ${base}/sitemap.xml`,
  ];
  return `${lines.join("\n")}\n`;
}
