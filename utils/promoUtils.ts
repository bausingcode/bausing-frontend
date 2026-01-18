/**
 * Utilidades para calcular precios con promociones
 */

import { Promo } from "@/lib/api";

export interface PromoCalculationResult {
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  discountPercentage?: number;
  promo?: Promo;
  promoLabel?: string;
}

/**
 * Calcula el precio final aplicando promociones
 * Soporta: percentage, fixed, 2x1, bundle
 */
export function calculatePriceWithPromo(
  basePrice: number,
  quantity: number = 1,
  promos?: Promo[]
): PromoCalculationResult {
  if (!promos || promos.length === 0) {
    return {
      originalPrice: basePrice * quantity,
      discountedPrice: basePrice * quantity,
      discountAmount: 0,
    };
  }

  // Tomar la primera promo válida
  const promo = promos[0];
  const originalPrice = basePrice * quantity;
  let discountedPrice = originalPrice;
  let discountAmount = 0;
  let discountPercentage: number | undefined;
  let promoLabel: string | undefined;

  const now = new Date();
  const startAt = new Date(promo.start_at);
  const endAt = new Date(promo.end_at);

  // Verificar que la promo esté vigente
  if (!promo.is_active || now < startAt || now > endAt) {
    return {
      originalPrice,
      discountedPrice,
      discountAmount: 0,
    };
  }

  switch (promo.type) {
    case "percentage":
      // Descuento por porcentaje (ej: 20% OFF)
      discountPercentage = promo.value;
      discountAmount = (originalPrice * promo.value) / 100;
      discountedPrice = originalPrice - discountAmount;
      promoLabel = `${promo.value}% OFF`;
      break;

    case "fixed":
      // Descuento fijo (ej: $5000 OFF)
      discountAmount = promo.value * quantity;
      discountedPrice = Math.max(0, originalPrice - discountAmount);
      promoLabel = `$${promo.value.toLocaleString("es-AR")} OFF`;
      break;

    case "2x1":
      // 2x1: pagas por la mitad de los items (redondeado hacia abajo)
      if (quantity >= 2) {
        const pairs = Math.floor(quantity / 2);
        const remaining = quantity % 2;
        discountedPrice = basePrice * pairs + basePrice * remaining;
        discountAmount = originalPrice - discountedPrice;
        promoLabel = "2x1";
      }
      break;

    case "bundle":
      // Bundle: compras X, pagas Y (ej: {"buy": 3, "pay": 2})
      if (promo.extra_config?.buy && promo.extra_config?.pay) {
        const buy = promo.extra_config.buy;
        const pay = promo.extra_config.pay;
        if (quantity >= buy) {
          const bundles = Math.floor(quantity / buy);
          const remaining = quantity % buy;
          discountedPrice = basePrice * pay * bundles + basePrice * remaining;
          discountAmount = originalPrice - discountedPrice;
          promoLabel = `${buy}x${pay}`;
        }
      }
      break;

    case "wallet_multiplier":
      // Multiplicador de Pesos Bausing (no afecta el precio, solo los pesos que se ganan)
      // Este tipo no cambia el precio, solo el cálculo de wallet
      break;
  }

  return {
    originalPrice,
    discountedPrice: Math.max(0, discountedPrice),
    discountAmount: Math.max(0, discountAmount),
    discountPercentage,
    promo,
    promoLabel,
  };
}

/**
 * Obtiene el texto de descuento para mostrar en UI
 */
export function getPromoLabel(promos?: Promo[]): string | undefined {
  if (!promos || promos.length === 0) return undefined;

  const promo = promos[0];
  const now = new Date();
  const startAt = new Date(promo.start_at);
  const endAt = new Date(promo.end_at);

  // Verificar que la promo esté vigente
  if (!promo.is_active || now < startAt || now > endAt) return undefined;

  switch (promo.type) {
    case "percentage":
      return `${promo.value}% OFF`;
    case "fixed":
      return `$${promo.value.toLocaleString("es-AR")} OFF`;
    case "2x1":
      return "2x1";
    case "bundle":
      if (promo.extra_config?.buy && promo.extra_config?.pay) {
        return `${promo.extra_config.buy}x${promo.extra_config.pay}`;
      }
      return "OFERTA";
    case "wallet_multiplier":
      return `x${promo.value} Pesos Bausing`;
    default:
      return "OFERTA";
  }
}
