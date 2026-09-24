import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import {
  CONSTRUCTION_COOKIE_NAME,
  getConstructionPasskey,
  isConstructionModeEnabled,
  isCookieValueValid,
} from "@/lib/constructionUnlock";
import { backendOriginFromEnv } from "@/lib/backendOrigin";

type ActiveRedirectRule = {
  source_path: string;
  target_path: string;
  redirect_type: 301 | 302;
};

// Cache en memoria del proceso: evita pegarle al backend en cada request.
// Vive por instancia/isolate del runtime de Next, se refresca sola por TTL.
const REDIRECTS_CACHE_TTL_MS = 60_000;
let redirectsCache: { rules: ActiveRedirectRule[]; fetchedAt: number } = {
  rules: [],
  fetchedAt: 0,
};

async function getActiveRedirects(): Promise<ActiveRedirectRule[]> {
  const isFresh = Date.now() - redirectsCache.fetchedAt < REDIRECTS_CACHE_TTL_MS;
  if (isFresh) return redirectsCache.rules;

  try {
    const res = await fetch(`${backendOriginFromEnv()}/public/redirects`, {
      // El middleware corre en cada request: sin cache de fetch, la cache la manejamos nosotros.
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    const rules: ActiveRedirectRule[] = Array.isArray(data?.data) ? data.data : [];
    redirectsCache = { rules, fetchedAt: Date.now() };
    return rules;
  } catch {
    // Fail-open: si el backend no responde, no bloqueamos la navegación.
    // Mantenemos lo último conocido (aunque esté vencido) en vez de tirarlo.
    redirectsCache = { ...redirectsCache, fetchedAt: Date.now() };
    return redirectsCache.rules;
  }
}

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname || "/";
}

function isPathExemptFromRedirectLookup(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/")
  );
}

function isPathExemptFromConstruction(pathname: string): boolean {
  if (pathname.startsWith("/admin") || pathname.startsWith("/login-admin")) {
    return true;
  }
  if (pathname === "/en-construccion" || pathname.startsWith("/en-construccion/")) {
    return true;
  }
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return true;
  }
  // Proxy /api/* → backend: no exigir clave de "en construcción" (solo aplica al sitio público)
  if (pathname.startsWith("/api/")) {
    return true;
  }
  if (pathname.includes(".")) {
    return true;
  }
  return false;
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const pathname = normalizePathname(request.nextUrl.pathname);

  // Redirects SEO (301/302): URLs viejas/rotas gestionadas desde /admin/redirects.
  // Se resuelven primero para que apliquen incluso en modo "en construcción".
  if (!isPathExemptFromRedirectLookup(pathname)) {
    const rules = await getActiveRedirects();
    const match = rules.find((r) => r.source_path === pathname);
    if (match) {
      const destination = match.target_path.startsWith("http://") || match.target_path.startsWith("https://")
        ? match.target_path
        : new URL(match.target_path, request.url).toString();

      event.waitUntil(
        fetch(`${backendOriginFromEnv()}/public/redirects/hit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source_path: pathname }),
        }).catch(() => {})
      );

      return NextResponse.redirect(destination, match.redirect_type);
    }
  }

  // Modo "en construcción": bloquea el sitio salvo admin y clave
  if (isConstructionModeEnabled()) {
    const passkey = getConstructionPasskey();
    const pathname = request.nextUrl.pathname;
    if (passkey && !isPathExemptFromConstruction(pathname)) {
      const cookie = request.cookies.get(CONSTRUCTION_COOKIE_NAME)?.value ?? "";
      const ok = await isCookieValueValid(passkey, cookie);
      if (!ok) {
        const url = request.nextUrl.clone();
        url.pathname = "/en-construccion";
        url.searchParams.set(
          "from",
          pathname + (request.nextUrl.search || "")
        );
        return NextResponse.redirect(url);
      }
    }
  }

  if (request.nextUrl.pathname.startsWith("/admin")) {
    const token = request.cookies.get("admin_token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.redirect(new URL("/login-admin", request.url));
    }
  }

  if (request.nextUrl.pathname === "/login-admin") {
    const token = request.cookies.get("admin_token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (token) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/data).*)",
  ],
};
