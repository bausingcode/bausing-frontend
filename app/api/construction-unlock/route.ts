import { NextResponse } from "next/server";
import {
  CONSTRUCTION_COOKIE_NAME,
  expectedCookieValueFromPasskey,
  getConstructionPasskey,
  isConstructionModeEnabled,
} from "@/lib/constructionUnlock";

const MAX_AGE = 60 * 60 * 24 * 90; // 90 días

function safeNextPath(from: unknown): string {
  if (typeof from !== "string" || from.length > 2048) return "/";
  const t = from.trim();
  if (!t.startsWith("/") || t.startsWith("//") || t.includes("://"))
    return "/";
  return t;
}

export async function POST(request: Request) {
  if (!isConstructionModeEnabled()) {
    return NextResponse.json(
      { success: false, error: "Modo desactivado" },
      { status: 400 }
    );
  }

  const passkey = getConstructionPasskey();
  if (!passkey) {
    return NextResponse.json(
      { success: false, error: "Configuración incompleta" },
      { status: 500 }
    );
  }

  let body: { password?: string; from?: string };
  try {
    body = (await request.json()) as { password?: string; from?: string };
  } catch {
    return NextResponse.json(
      { success: false, error: "Cuerpo inválido" },
      { status: 400 }
    );
  }

  if (body.password !== passkey) {
    return NextResponse.json(
      { success: false, error: "Clave incorrecta" },
      { status: 401 }
    );
  }

  const cookieValue = await expectedCookieValueFromPasskey(passkey);
  const res = NextResponse.json({
    success: true,
    redirect: safeNextPath(body.from),
  });
  res.cookies.set(CONSTRUCTION_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
