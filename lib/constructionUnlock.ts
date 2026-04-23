/** Nombre de la cookie de sesión para el bypass del modo "en construcción". */
export const CONSTRUCTION_COOKIE_NAME = "bausing_construction_unlock";

const SUFFIX = "bausing_construction_v1";

export function buildConstructionCookiePayload(passkey: string): string {
  return `${passkey}::${SUFFIX}`;
}

/** Valor de cookie (hex SHA-256) derivado de CONSTRUCTION_PASSKEY. Edge y Node. */
export async function expectedCookieValueFromPasskey(
  passkey: string
): Promise<string> {
  const data = new TextEncoder().encode(buildConstructionCookiePayload(passkey));
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function isCookieValueValid(
  passkey: string,
  cookieHex: string
): Promise<boolean> {
  const expected = await expectedCookieValueFromPasskey(passkey);
  if (expected.length !== cookieHex.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ cookieHex.charCodeAt(i);
  }
  return diff === 0;
}

export function isConstructionModeEnabled(): boolean {
  const v = process.env.CONSTRUCTION_MODE;
  return v === "true" || v === "1" || v === "yes";
}

export function getConstructionPasskey(): string {
  return process.env.CONSTRUCTION_PASSKEY?.trim() ?? "";
}
