import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
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
      ],
    },
    sitemap: `${base}/sitemap.xml`,
    host: new URL(base).host,
  };
}
