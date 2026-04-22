/**
 * Código postal solo numérico (p. ej. 5000, sin letras). Máx. 8 para flexibilidad.
 */
export function postalCodeDigitsOnly(value: string, maxLen = 8): string {
  return value.replace(/\D/g, "").slice(0, maxLen);
}
