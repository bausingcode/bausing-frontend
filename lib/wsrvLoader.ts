// lib/wsrvLoader.ts
import type { ImageLoaderProps } from "next/image";

const wsrvLoader = ({ src, width }: ImageLoaderProps) => {
  const base = process.env.NEXT_PUBLIC_ASSETS_BASE || "";
  const absolute = src.startsWith("http") ? src : `${base}${src}`;

  const q = 70; // calidad efectiva solo si output=webp
  return (
    `https://wsrv.nl/?url=${encodeURIComponent(absolute)}` +
    `&w=${width}` +
    `&q=${q}` +
    `&fit=inside` +
    `&output=webp` +    // forzá WebP
    `&n=1` +            // no upscale
    `&maxage=31536000`
  );
};

export default wsrvLoader;

