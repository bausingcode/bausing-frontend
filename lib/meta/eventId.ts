/** ID único para deduplicación Pixel ↔ Conversions API. */
export function createMetaEventId(prefix = "evt"): string {
  const rand =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "")
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
  return `${prefix}_${rand}`;
}
