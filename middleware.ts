import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  CONSTRUCTION_COOKIE_NAME,
  getConstructionPasskey,
  isConstructionModeEnabled,
  isCookieValueValid,
} from "@/lib/constructionUnlock";

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
  if (pathname === "/api/construction-unlock") {
    return true;
  }
  if (pathname.includes(".")) {
    return true;
  }
  return false;
}

export async function middleware(request: NextRequest) {
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
