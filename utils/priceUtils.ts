/**
 * Utilidades centralizadas para calcular precios de productos
 * Esta función debe ser el único lugar donde se calculan precios
 * para facilitar agregar nuevas condiciones en el futuro
 */

import { Product } from "@/lib/api";
import { calculatePriceWithPromo, getPromoLabel, PromoCalculationResult } from "./promoUtils";

export interface ProductPriceInfo {
  // Precio formateado para mostrar
  currentPrice: string;
  originalPrice?: string;
  discount?: string;
  
  // Valores numéricos
  currentPriceValue: number;
  originalPriceValue: number;
  discountAmount: number;
  
  // Info adicional
  hasDiscount: boolean;
  promoCalculation?: PromoCalculationResult;
}

/**
 * Formatea un precio numérico a string en formato argentino
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Calcula el precio final de un producto aplicando todas las condiciones
 * (promociones, descuentos, etc.)
 * 
 * Esta es la función central que debe usarse en TODO el código
 * para calcular precios. Si necesitas agregar nuevas condiciones
 * (descuentos por usuario, descuentos por cantidad, etc.), 
 * agrégalas aquí.
 * 
 * @param product - Producto del que calcular el precio
 * @param quantity - Cantidad (default: 1)
 * @returns Información completa del precio calculado
 */
export function calculateProductPrice(
  product: Product,
  quantity: number = 1
): ProductPriceInfo {
  // Precio base del producto
  const basePrice = product.min_price || 0;
  const maxPrice = product.max_price || basePrice;
  
  // ============================================
  // APLICAR CONDICIONES DE PRECIO
  // ============================================
  // TODO: En el futuro, agregar aquí más condiciones:
  // - Descuentos por usuario (suscripciones, etc.)
  // - Descuentos por cantidad
  // - Precios especiales por localidad
  // - Descuentos por método de pago
  // etc.
  
  // 1. Aplicar promociones
  const promoCalculation = calculatePriceWithPromo(
    basePrice,
    quantity,
    product.promos as any
  );
  
  // Precio final después de aplicar todas las condiciones
  const finalPrice = promoCalculation.discountedPrice;
  const originalPriceValue = promoCalculation.originalPrice;
  
  // Determinar si hay descuento
  const hasDiscount = promoCalculation.discountAmount > 0;
  
  // Formatear precios para mostrar
  const currentPrice = formatPrice(finalPrice);
  const originalPrice = hasDiscount
    ? formatPrice(originalPriceValue)
    : (maxPrice > basePrice ? formatPrice(maxPrice) : undefined);
  
  // Label de descuento/promo
  const discount = promoCalculation.promoLabel || 
                   (product.promos && product.promos.length > 0 ? getPromoLabel(product.promos as any) : undefined);
  
  return {
    currentPrice,
    originalPrice,
    discount,
    currentPriceValue: finalPrice,
    originalPriceValue,
    discountAmount: promoCalculation.discountAmount,
    hasDiscount,
    promoCalculation,
  };
}

/**
 * Calcula el precio para múltiples productos (para carritos, etc.)
 */
export function calculateTotalPrice(
  items: Array<{ product: Product; quantity: number }>
): number {
  return items.reduce((total, item) => {
    const priceInfo = calculateProductPrice(item.product, item.quantity);
    return total + priceInfo.currentPriceValue;
  }, 0);
}
