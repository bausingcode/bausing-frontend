/**
 * Utilidades centralizadas para calcular precios de productos
 * Esta función debe ser el único lugar donde se calculan precios
 * para facilitar agregar nuevas condiciones en el futuro
 */

import { Product, fetchCatalogs, Catalog, fetchCatalogIdForLocality } from "@/lib/api";
import { calculatePriceWithPromo, getPromoLabel, PromoCalculationResult } from "./promoUtils";

// Cache para mapeo de localidad a catálogo (para evitar múltiples llamadas)
let localityToCatalogCache: Map<string, string> | null = null;
let catalogsCache: Catalog[] | null = null;

/**
 * Obtiene el catálogo de una localidad (con cache)
 * Esta función ya no se usa directamente, pero se mantiene por compatibilidad
 */
async function getCatalogForLocality(localityId: string): Promise<string | null> {
  try {
    // Si ya tenemos el cache, usarlo
    if (localityToCatalogCache && localityToCatalogCache.has(localityId)) {
      return localityToCatalogCache.get(localityId) || null;
    }

    // Cargar catálogos con localidades si no están en cache
    if (!catalogsCache) {
      catalogsCache = await fetchCatalogs(true);
      // Construir el mapa de localidad -> catálogo
      localityToCatalogCache = new Map();
      catalogsCache.forEach(catalog => {
        if (catalog.localities) {
          catalog.localities.forEach(locality => {
            if (localityToCatalogCache) {
              localityToCatalogCache.set(locality.id, catalog.id);
            }
          });
        }
      });
    }

    return localityToCatalogCache?.get(localityId) || null;
  } catch (error) {
    console.error('[getCatalogForLocality] Error obteniendo catálogo:', error);
    return null;
  }
}

/**
 * Inicializa el mapeo localidad → catálogo para la página actual.
 * Con localityId: una sola petición GET /localities/:id/catalog (evita GET /catalogs?include_localities=true).
 */
export async function initializeCatalogCache(localityId?: string | null): Promise<void> {
  try {
    if (!localityId) {
      return;
    }
    if (!localityToCatalogCache) {
      localityToCatalogCache = new Map();
    }
    if (localityToCatalogCache.has(localityId)) {
      return;
    }
    const catalogId = await fetchCatalogIdForLocality(localityId);
    if (catalogId) {
      localityToCatalogCache.set(localityId, catalogId);
    }
  } catch (error) {
    console.error('[initializeCatalogCache] Error inicializando cache:', error);
  }
}

/**
 * Limpia el cache de catálogos (útil cuando se actualizan los catálogos)
 */
export function clearCatalogCache() {
  localityToCatalogCache = null;
  catalogsCache = null;
}

export interface ProductPriceInfo {
  // Precio formateado para mostrar
  currentPrice: string;
  originalPrice?: string;
  discount?: string;
  /** Texto bajo el precio (ej. precio efectivo / transferencia) */
  priceNote?: string;

  /** Precio efectivo/transferencia (formateado) */
  transferPrice: string;
  /** Precio tarjeta (formateado). Presente si el producto tiene precio de tarjeta. */
  cardPrice?: string;
  hasCardPrice: boolean;
  
  // Valores numéricos
  currentPriceValue: number;
  originalPriceValue: number;
  discountAmount: number;

  transferPriceValue: number;
  cardPriceValue?: number;
  
  // Info adicional
  hasDiscount: boolean;
  promoCalculation?: PromoCalculationResult;
}

export type PaymentPriceKind = "transfer" | "card";

export interface CalculateProductPriceOptions {
  /** Base numérica antes de promo: transfer (default) o tarjeta */
  paymentPriceKind?: PaymentPriceKind;
}

/** Textos para mostrar precio transferencia vs tarjeta (UI) */
export const PRICE_UI_TRANSFER_CAPTION = "Efectivo o transferencia";
export const PRICE_UI_CARD_CAPTION = "Precio con tarjeta";

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
  quantity: number = 1,
  options?: CalculateProductPriceOptions
): ProductPriceInfo {
  const paymentKind: PaymentPriceKind = options?.paymentPriceKind ?? "transfer";
  const transferMin =
    product.min_price !== undefined && product.min_price !== null ? product.min_price : 0;
  const transferMax =
    product.max_price !== undefined && product.max_price !== null ? product.max_price : transferMin;
  const cardMin =
    product.min_card_price !== undefined && product.min_card_price !== null
      ? product.min_card_price
      : transferMin;
  const cardMax =
    product.max_card_price !== undefined && product.max_card_price !== null
      ? product.max_card_price
      : cardMin;

  // Precio base según método (checkout: tarjeta vs transferencia/efectivo)
  const basePrice = paymentKind === "card" ? cardMin : transferMin;
  const maxPrice = paymentKind === "card" ? cardMax : transferMax;
  
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
  // Determinar contexto: si es product view, usar 'product_view', sino 'home' o 'catalog'
  const context = typeof window !== 'undefined' && window.location.pathname.includes('/productos/') 
    ? 'product_view' 
    : 'home';
  const promoCalculation = calculatePriceWithPromo(
    basePrice,
    quantity,
    product.promos as any,
    context
  );

  // También calcular precios para la otra forma de pago, para poder mostrar ambos en cards/product view.
  const hasCardPrice =
    product.min_card_price !== undefined &&
    product.min_card_price !== null &&
    product.min_card_price > 0;

  const promoTransfer = paymentKind === "transfer"
    ? promoCalculation
    : calculatePriceWithPromo(transferMin, quantity, product.promos as any, context);

  const promoCard = hasCardPrice
    ? (paymentKind === "card"
        ? promoCalculation
        : calculatePriceWithPromo(cardMin, quantity, product.promos as any, context))
    : null;
  
  // Precio final después de aplicar todas las condiciones
  const finalPrice = promoCalculation.discountedPrice;
  const originalPriceValue = promoCalculation.originalPrice;
  
  // Determinar si hay descuento
  const hasPromoDiscount = promoCalculation.discountAmount > 0;

  // Formatear precios para mostrar
  const currentPrice = formatPrice(finalPrice);
  let originalPrice: string | undefined;
  let discount: string | undefined;
  let priceNote: string | undefined;

  const refRaw = (product as Product & { display_reference_price?: number | null }).display_reference_price;
  const refNum = refRaw != null ? Number(refRaw) : NaN;
  const refTotal =
    Number.isFinite(refNum) && refNum > 0 ? refNum * quantity : null;

  let outOriginalPriceValue = originalPriceValue;

  if (hasPromoDiscount) {
    /** Con promo: tachado = precio vitrina si existe y es mayor al final; si no, precio previo a la promo. */
    if (refTotal != null && refTotal > finalPrice + 0.005) {
      originalPrice = formatPrice(refTotal);
      outOriginalPriceValue = refTotal;
    } else {
      originalPrice = formatPrice(originalPriceValue);
    }
    discount =
      promoCalculation.promoLabel ||
      (product.promos && product.promos.length > 0
        ? getPromoLabel(product.promos as any, context)
        : undefined);
  } else if (refTotal != null) {
    originalPrice = formatPrice(refTotal);
    outOriginalPriceValue = refTotal;
  }

  const hasDiscount = hasPromoDiscount;

  const transferPriceValue = promoTransfer.discountedPrice;
  const transferPrice = formatPrice(transferPriceValue);

  const cardDiscounted = promoCard ? promoCard.discountedPrice : undefined;
  /** Solo mostrar tarjeta en UI si hay monto distinto al de transferencia (evita duplicar cuando no hay precio tarjeta real). */
  const hasDistinctCardPrice =
    cardDiscounted != null &&
    Math.abs(cardDiscounted - transferPriceValue) > 0.005;
  const cardPriceValue = hasDistinctCardPrice ? cardDiscounted : undefined;
  const cardPrice = cardPriceValue != null ? formatPrice(cardPriceValue) : undefined;

  return {
    currentPrice,
    originalPrice,
    discount,
    priceNote,
    currentPriceValue: finalPrice,
    originalPriceValue: outOriginalPriceValue,
    discountAmount: promoCalculation.discountAmount,
    transferPrice,
    transferPriceValue,
    cardPrice,
    cardPriceValue,
    hasCardPrice: hasDistinctCardPrice,
    hasDiscount,
    promoCalculation,
  };
}

/**
 * Calcula el precio para múltiples productos (para carritos, etc.)
 */
export function calculateTotalPrice(
  items: Array<{ product: Product; quantity: number }>,
  options?: CalculateProductPriceOptions
): number {
  return items.reduce((total, item) => {
    const priceInfo = calculateProductPrice(item.product, item.quantity, options);
    return total + priceInfo.currentPriceValue;
  }, 0);
}

/**
 * Obtiene el precio de una variante/opción para una localidad específica
 * Busca el precio por catálogo (nuevo sistema) o por localidad (compatibilidad hacia atrás)
 * Si no se encuentra precio, retorna 0
 * 
 * @param variant - Variante del producto (puede tener options con prices)
 * @param optionId - ID de la opción específica (opcional, si no se proporciona usa la primera opción)
 * @param localityId - ID de la localidad para filtrar el precio (se buscará su catálogo correspondiente)
 * @param catalogId - ID del catálogo directamente (opcional, si se proporciona se usa este en lugar de buscar por localidad)
 * @returns Precio numérico (0 si no se encuentra)
 */
export function getVariantPriceByLocality(
  variant: any,
  optionId?: string,
  localityId?: string,
  catalogId?: string,
  priceKind: PaymentPriceKind = "transfer"
): number {
  console.log('[getVariantPriceByLocality] Iniciando búsqueda de precio:', {
    variantId: variant?.id,
    variantSku: variant?.sku,
    optionId,
    localityId,
    catalogId,
    hasOptions: variant?.options && Array.isArray(variant.options),
    optionsCount: variant?.options?.length || 0
  });

  // Si no hay localidad ni catálogo, retornar 0
  if (!localityId && !catalogId) {
    console.log('[getVariantPriceByLocality] No hay localityId ni catalogId, retornando 0');
    return 0;
  }

  try {
    // Si hay localityId pero no catalogId, obtener el catálogo de la localidad del cache
    let targetCatalogId = catalogId;
    if (localityId && !targetCatalogId && localityToCatalogCache) {
      const cachedCatalogId = localityToCatalogCache.get(localityId);
      console.log('[getVariantPriceByLocality] Cache lookup:', {
        localityId,
        cachedCatalogId,
        cacheSize: localityToCatalogCache.size
      });
      if (cachedCatalogId) {
        targetCatalogId = cachedCatalogId;
      }
    } else if (localityId && !targetCatalogId) {
      console.log('[getVariantPriceByLocality] Cache no disponible para localityId:', localityId);
    }
    
    console.log('[getVariantPriceByLocality] targetCatalogId final:', targetCatalogId);

    // Si hay opciones, buscar el precio en la opción específica
    if (variant.options && Array.isArray(variant.options) && variant.options.length > 0) {
      const targetOption = optionId 
        ? variant.options.find((opt: any) => opt.id === optionId)
        : variant.options[0];
      
      if (targetOption) {
        console.log('[getVariantPriceByLocality] Opción encontrada:', {
          optionId: targetOption.id,
          optionName: targetOption.name,
          optionPrice: targetOption.price,
          hasPrices: targetOption.prices && Array.isArray(targetOption.prices),
          pricesCount: targetOption.prices?.length || 0,
          prices: targetOption.prices?.map((p: any) => ({
            id: p.id,
            catalog_id: p.catalog_id,
            locality_id: p.locality_id,
            price: p.price
          })) || []
        });

        // option.price suele ser el precio transfer filtrado por catálogo/localidad.
        // Para price_kind "card" hay que leer la fila en prices[], no este atajo.
        if (
          priceKind === "transfer" &&
          targetOption.price !== undefined &&
          targetOption.price !== null &&
          targetOption.price > 0
        ) {
          const finalPrice =
            typeof targetOption.price === "number"
              ? targetOption.price
              : parseFloat(targetOption.price) || 0;
          console.log("[getVariantPriceByLocality] Precio encontrado en option.price:", finalPrice);
          return finalPrice;
        }
        
        // Si no hay price directo, buscar en el array de precios
        if (targetOption.prices && Array.isArray(targetOption.prices)) {
          const kindMatches = (p: any) =>
            (p.price_kind || "transfer") === priceKind;

          let priceFound = null;
          
          // Priorizar búsqueda por catálogo si tenemos catalogId
          if (targetCatalogId) {
            console.log('[getVariantPriceByLocality] Buscando precio por catalog_id:', targetCatalogId);
            priceFound = targetOption.prices.find(
              (price: any) => {
                const matches =
                  kindMatches(price) &&
                  (price.catalog_id === targetCatalogId ||
                    (price.catalog_id && String(price.catalog_id) === String(targetCatalogId)));
                if (matches) {
                  console.log('[getVariantPriceByLocality] Precio encontrado por catalog_id:', {
                    priceId: price.id,
                    catalog_id: price.catalog_id,
                    price: price.price
                  });
                }
                return matches;
              }
            );
            if (!priceFound && priceKind === "card") {
              priceFound = targetOption.prices.find(
                (price: any) =>
                  (price.catalog_id === targetCatalogId ||
                    (price.catalog_id && String(price.catalog_id) === String(targetCatalogId))) &&
                  (price.price_kind || "transfer") === "transfer",
              );
            }
          }
          
          // Si no se encontró por catálogo y hay localityId, buscar por localidad (compatibilidad hacia atrás)
          if (!priceFound && localityId) {
            console.log('[getVariantPriceByLocality] Buscando precio por locality_id:', localityId);
            priceFound = targetOption.prices.find(
              (price: any) => {
                const matches =
                  kindMatches(price) &&
                  (price.locality_id === localityId ||
                    (price.locality_id && String(price.locality_id) === String(localityId)));
                if (matches) {
                  console.log('[getVariantPriceByLocality] Precio encontrado por locality_id:', {
                    priceId: price.id,
                    locality_id: price.locality_id,
                    price: price.price
                  });
                }
                return matches;
              }
            );
          }
          
          // Si aún no se encontró, usar el primer precio con catálogo (el backend ya filtró por catálogo)
          if (!priceFound && targetOption.prices.length > 0) {
            const byKind = targetOption.prices.filter(kindMatches);
            const pool = byKind.length > 0 ? byKind : targetOption.prices;
            console.log('[getVariantPriceByLocality] Usando primer precio disponible (backend ya filtró):', {
              priceId: pool[0].id,
              catalog_id: pool[0].catalog_id,
              locality_id: pool[0].locality_id,
              price: pool[0].price
            });
            priceFound = pool[0];
          }
          
          if (priceFound) {
            const finalPrice = typeof priceFound.price === 'number' 
              ? priceFound.price 
              : parseFloat(priceFound.price) || 0;
            console.log('[getVariantPriceByLocality] Precio final encontrado:', finalPrice);
            return finalPrice;
          }
        }
        
        // Si no hay precios en la opción, retornar 0
        console.log('[getVariantPriceByLocality] No se encontró precio, retornando 0');
        return 0;
      }
    }
    
    // Si no hay opciones pero la variante tiene precios directamente
    if (variant.prices && Array.isArray(variant.prices)) {
      console.log('[getVariantPriceByLocality] Variante tiene precios directamente:', {
        pricesCount: variant.prices.length,
        prices: variant.prices.map((p: any) => ({
          id: p.id,
          catalog_id: p.catalog_id,
          locality_id: p.locality_id,
          price: p.price
        }))
      });
      
      const kindMatchesV = (p: any) => (p.price_kind || "transfer") === priceKind;

      let priceFound = null;
      
      // Priorizar búsqueda por catálogo si tenemos catalogId
      if (targetCatalogId) {
        console.log('[getVariantPriceByLocality] Buscando precio en variant.prices por catalog_id:', targetCatalogId);
        priceFound = variant.prices.find(
          (price: any) =>
            kindMatchesV(price) &&
            (price.catalog_id === targetCatalogId ||
              (price.catalog_id && String(price.catalog_id) === String(targetCatalogId))),
        );
        if (!priceFound && priceKind === "card") {
          priceFound = variant.prices.find(
            (price: any) =>
              (price.catalog_id === targetCatalogId ||
                (price.catalog_id && String(price.catalog_id) === String(targetCatalogId))) &&
              (price.price_kind || "transfer") === "transfer",
          );
        }
      }
      
      // Si no se encontró por catálogo y hay localityId, buscar por localidad (compatibilidad hacia atrás)
      if (!priceFound && localityId) {
        console.log('[getVariantPriceByLocality] Buscando precio en variant.prices por locality_id:', localityId);
        priceFound = variant.prices.find(
          (price: any) =>
            kindMatchesV(price) &&
            (price.locality_id === localityId ||
              (price.locality_id && String(price.locality_id) === String(localityId))),
        );
      }
      
      // Si aún no se encontró y hay precios con catálogo, usar el primero (el backend ya filtró)
      if (!priceFound && variant.prices.length > 0) {
        const pool = variant.prices.filter(kindMatchesV);
        const pick = pool.length > 0 ? pool : variant.prices;
        console.log('[getVariantPriceByLocality] Usando primer precio de variant.prices:', pick[0]);
        priceFound = pick[0];
      }
      
      if (priceFound) {
        const finalPrice = typeof priceFound.price === 'number' 
          ? priceFound.price 
          : parseFloat(priceFound.price) || 0;
        console.log('[getVariantPriceByLocality] Precio final encontrado en variant.prices:', finalPrice);
        return finalPrice;
      }
    }
    
    // Si no se encuentra precio, retornar 0
    console.log('[getVariantPriceByLocality] No se encontró precio en ninguna parte, retornando 0');
    return 0;
  } catch (error) {
    console.error('[getVariantPriceByLocality] Error obteniendo precio:', error);
    return 0;
  }
}
