/** Parsea precios mostrados en UI (ARS) a número. */
export function parseArsPrice(price: string | number | null | undefined): number {
  if (price == null) return 0;
  if (typeof price === "number") {
    return Number.isFinite(price) ? price : 0;
  }
  const raw = String(price).trim();
  if (!raw) return 0;

  let s = raw.replace(/[^\d.,-]/g, "");
  if (!s) return 0;

  if (s.includes(",") && s.includes(".")) {
    // Formato AR: 1.234.567,89
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }

  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export const META_CURRENCY = "ARS";
