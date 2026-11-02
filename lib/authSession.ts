/** Devuelve el `exp` (en segundos) del payload de un JWT, o null si no se puede leer. */
function getJwtExp(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
    return typeof json.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

/** true si el JWT ya venció. Un token ilegible o sin `exp` no se considera vencido. */
export function isTokenExpired(token: string): boolean {
  const exp = getJwtExp(token);
  return exp !== null && exp * 1000 <= Date.now();
}

/** Acepta solo rutas internas para evitar open redirects. */
export function safeRedirectPath(path: string | null | undefined): string {
  if (path && path.startsWith("/") && !path.startsWith("//")) return path;
  return "/";
}
