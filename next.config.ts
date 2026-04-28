import type { NextConfig } from "next";
import { backendOriginFromEnv } from "./lib/backendOrigin";

// Reescribe /api/* → backend. Por defecto 127.0.0.1: en muchos sistemas "localhost"
// resuelve a IPv6 (::1) y Flask en 0.0.0.0:5050 no acepta ahí; el proxy de Next devuelve 502.
// En local: BACKEND_URL=http://127.0.0.1:5050 o dejar el default.
const backendBase = backendOriginFromEnv();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
      },
      {
        protocol: "https",
        hostname: "wsrv.nl",
      },
    ],
    loader: "custom",
    loaderFile: "./lib/wsrvLoader.ts",
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;
