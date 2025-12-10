import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
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
  matcher: ["/admin/:path*", "/login-admin"],
};

