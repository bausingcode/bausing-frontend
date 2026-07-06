import { NextResponse } from "next/server";
import {
  resolveOgImageBytes,
  resolveOgImageFallbackBytes,
} from "@/lib/seo/homeHeroOgImage";

export const dynamic = "force-dynamic";

const CACHE_CONTROL = "public, max-age=300, s-maxage=300, stale-while-revalidate=600";

export async function GET() {
  const heroImage = await resolveOgImageBytes();
  if (heroImage) {
    return new NextResponse(heroImage.bytes, {
      headers: {
        "Content-Type": heroImage.contentType,
        "Cache-Control": CACHE_CONTROL,
      },
    });
  }

  const fallback = await resolveOgImageFallbackBytes();
  if (fallback) {
    return new NextResponse(fallback.bytes, {
      headers: {
        "Content-Type": fallback.contentType,
        "Cache-Control": CACHE_CONTROL,
      },
    });
  }

  return NextResponse.json({ error: "OG image unavailable" }, { status: 404 });
}
