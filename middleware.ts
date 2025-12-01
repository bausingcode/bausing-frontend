import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Proteger rutas de admin - COMENTADO TEMPORALMENTE
  // if (request.nextUrl.pathname.startsWith("/admin")) {
  //   const token = request.cookies.get("admin_token")?.value || 
  //                 request.headers.get("authorization")?.replace("Bearer ", "");

  //   if (!token) {
  //     return NextResponse.redirect(new URL("/login", request.url));
  //   }
  // }

  // Si está en login y ya tiene token, redirigir al admin - COMENTADO TEMPORALMENTE
  // if (request.nextUrl.pathname === "/login") {
  //   const token = request.cookies.get("admin_token")?.value || 
  //                 request.headers.get("authorization")?.replace("Bearer ", "");

  //   if (token) {
  //     return NextResponse.redirect(new URL("/admin", request.url));
  //   }
  // }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};

