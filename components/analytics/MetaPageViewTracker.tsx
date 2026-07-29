"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/meta/track";

/**
 * PageView en cada navegación del App Router (incluye el primer render).
 * El script base del Pixel solo hace init; este tracker dispara PageView + CAPI.
 */
export default function MetaPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/login-admin")) {
      return;
    }

    const key = `${pathname}?${searchParams?.toString() || ""}`;
    if (lastKey.current === key) return;
    lastKey.current = key;

    trackPageView();
  }, [pathname, searchParams]);

  return null;
}
