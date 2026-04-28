/**
 * En muchos entornos `localhost` resuelve a ::1 (IPv6) y el backend Flask suele
 * escuchar solo en IPv4 (0.0.0.0 / 127.0.0.1). Los fetch desde Node pueden
 * quedar colgados en lugar de fallar rápido; el rewrite /api → backend idem.
 */
export function normalizeLocalhostToIpv4(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");
  try {
    const u = new URL(trimmed);
    if (u.hostname === "localhost") u.hostname = "127.0.0.1";
    return u.origin;
  } catch {
    return trimmed;
  }
}

/** Origen del backend Flask para este proceso (sin barra final). */
export function backendOriginFromEnv(): string {
  const raw = (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://127.0.0.1:5050"
  ).replace(/\/+$/, "");
  return normalizeLocalhostToIpv4(raw);
}
