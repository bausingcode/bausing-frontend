/**
 * Utilidades centralizadas para calcular precios de productos
 * Esta función debe ser el único lugar donde se calculan precios
 * para facilitar agregar nuevas condiciones en el futuro
 */

import { Product, fetchCatalogs, Catalog } from "@/lib/api";
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
 * Inicializa el cache de catálogos (debe llamarse cuando se carga la localidad)
 */
export async function initializeCatalogCache(): Promise<void> {
  try {
    console.log('[initializeCatalogCache] Iniciando inicialización del cache...');
    if (!catalogsCache) {
      console.log('[initializeCatalogCache] Cache no existe, cargando catálogos...');
      catalogsCache = await fetchCatalogs(true);
      console.log('[initializeCatalogCache] Catálogos cargados:', catalogsCache.length);
      
      // Construir el mapa de localidad -> catálogo
      localityToCatalogCache = new Map();
      let totalLocalities = 0;
      catalogsCache.forEach(catalog => {
        if (catalog.localities) {
          catalog.localities.forEach(locality => {
            localityToCatalogCache!.set(locality.id, catalog.id);
            totalLocalities++;
          });
          console.log('[initializeCatalogCache] Catálogo:', catalog.name, '- Localidades:', catalog.localities.length);
        }
      });
      console.log('[initializeCatalogCache] Cache inicializado. Total localidades mapeadas:', totalLocalities);
      console.log('[initializeCatalogCache] Mapa completo:', Array.from(localityToCatalogCache.entries()));
    } else {
      console.log('[initializeCatalogCache] Cache ya existe, no es necesario recargar');
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
  // Si no hay precio (undefined/null), usar 0
  const basePrice = product.min_price !== undefined && product.min_price !== null ? product.min_price : 0;
  const maxPrice = product.max_price !== undefined && product.max_price !== null ? product.max_price : basePrice;
  
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
  // Solo mostrar precio original (tachado) si hay un descuento real de promoción
  // No mostrar precio tachado solo por tener múltiples variantes con diferentes precios
  const originalPrice = hasDiscount
    ? formatPrice(originalPriceValue)
    : undefined;
  
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
  catalogId?: string
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

        // El backend ya filtra los precios por catálogo cuando se pasa locality_id
        // y devuelve option.price con el precio del catálogo correspondiente
        // Priorizar este campo ya que el backend ya hizo el trabajo de filtrado
        if (targetOption.price !== undefined && targetOption.price !== null && targetOption.price > 0) {
          const finalPrice = typeof targetOption.price === 'number' 
            ? targetOption.price 
            : parseFloat(targetOption.price) || 0;
          console.log('[getVariantPriceByLocality] Precio encontrado en option.price:', finalPrice);
          return finalPrice;
        }
        
        // Si no hay price directo, buscar en el array de precios
        if (targetOption.prices && Array.isArray(targetOption.prices)) {
          let priceFound = null;
          
          // Priorizar búsqueda por catálogo si tenemos catalogId
          if (targetCatalogId) {
            console.log('[getVariantPriceByLocality] Buscando precio por catalog_id:', targetCatalogId);
            priceFound = targetOption.prices.find(
              (price: any) => {
                const matches = price.catalog_id === targetCatalogId || 
                             (price.catalog_id && String(price.catalog_id) === String(targetCatalogId));
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
          }
          
          // Si no se encontró por catálogo y hay localityId, buscar por localidad (compatibilidad hacia atrás)
          if (!priceFound && localityId) {
            console.log('[getVariantPriceByLocality] Buscando precio por locality_id:', localityId);
            priceFound = targetOption.prices.find(
              (price: any) => {
                const matches = price.locality_id === localityId ||
                             (price.locality_id && String(price.locality_id) === String(localityId));
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
            console.log('[getVariantPriceByLocality] Usando primer precio disponible (backend ya filtró):', {
              priceId: targetOption.prices[0].id,
              catalog_id: targetOption.prices[0].catalog_id,
              locality_id: targetOption.prices[0].locality_id,
              price: targetOption.prices[0].price
            });
            priceFound = targetOption.prices[0];
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
      
      let priceFound = null;
      
      // Priorizar búsqueda por catálogo si tenemos catalogId
      if (targetCatalogId) {
        console.log('[getVariantPriceByLocality] Buscando precio en variant.prices por catalog_id:', targetCatalogId);
        priceFound = variant.prices.find(
          (price: any) => price.catalog_id === targetCatalogId ||
                         (price.catalog_id && String(price.catalog_id) === String(targetCatalogId))
        );
      }
      
      // Si no se encontró por catálogo y hay localityId, buscar por localidad (compatibilidad hacia atrás)
      if (!priceFound && localityId) {
        console.log('[getVariantPriceByLocality] Buscando precio en variant.prices por locality_id:', localityId);
        priceFound = variant.prices.find(
          (price: any) => price.locality_id === localityId ||
                         (price.locality_id && String(price.locality_id) === String(localityId))
        );
      }
      
      // Si aún no se encontró y hay precios con catálogo, usar el primero (el backend ya filtró)
      if (!priceFound && variant.prices.length > 0) {
        console.log('[getVariantPriceByLocality] Usando primer precio de variant.prices:', variant.prices[0]);
        priceFound = variant.prices[0];
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
