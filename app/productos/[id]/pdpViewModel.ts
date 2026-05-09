import type { Product as ApiProduct } from "@/lib/api";
import { calculateProductPrice } from "@/utils/priceUtils";

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
}

/** Variantes vitrina — disponibilidad vía `has_crm_stock` global del producto. */
export interface ProductVariant {
  id: string;
  name?: string;
  size?: string;
  sku?: string;
  stock?: number;
  attributes?: Record<string, string>;
  options?: Array<{
    id: string;
    name: string;
    stock: number;
  }>;
  prices?: Array<{
    id: string;
    price: number;
    locality_id?: string;
    locality_name?: string;
  }>;
}

export interface PdpProduct {
  id: string;
  name: string;
  description?: string;
  currentPrice: string;
  originalPrice?: string;
  discount?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  promos?: Array<unknown>;
  firmness?: string;
  firmnessLevel?: number;
  maxWeight?: string;
  size?: string;
  fillingType?: string;
  technicalDescription?: string;
  warrantyMonths?: number;
  warrantyDescription?: string;
  materials?: string;
  basic_color?: string;
  /** Textos cargados desde admin (prioridad sobre basic_color en vitrina). */
  manual_color_labels?: string[];
  filling_type?: string;
  max_supported_weight_kg?: number;
  has_pillow_top?: boolean;
  is_bed_in_box?: boolean;
  mattress_firmness?: string;
  mattress_height_cm?: number;
  mattress_fabric_type?: string;
  has_double_pillow?: boolean;
  has_moisture_breathers?: boolean;
  has_side_handles?: boolean;
  size_label?: string;
  warranty?: string;
  has_crm_stock?: boolean;
  is_active?: boolean;
  min_card_price?: number;
  max_card_price?: number;
  min_transfer_price?: number;
  max_transfer_price?: number;
  display_reference_price?: number | null;
  show_transfer_price_highlight?: boolean;
  smart_screen_size?: string;
  smart_resolution?: string;
  smart_tv?: boolean | null;
  ac_inverter?: boolean | null;
  ac_climate_type?: string;
  ac_frigorias?: number | null;
  wm_load_type?: string;
  wm_wash_capacity_kg?: number | null;
  fridge_capacity_liters?: number | null;
  freezer_capacity_liters?: number | null;
}

export function firmnessLabelToBarLevel(label: string | undefined | null): number {
  const key = (label ?? "").trim().toUpperCase();
  if (key === "SOFT" || key === "BLANDO" || key === "SUAVE") return 1;
  if (key === "MEDIO" || key === "MEDIUM" || key === "MEDIA") return 3;
  if (key === "FIRME" || key === "FIRM" || key === "HARD") return 5;
  return 3;
}

export type PdpMapResult = {
  product: PdpProduct;
  initialSelectedOptions: Record<string, string>;
  selectedVariant: string;
  variantsNormalized: ProductVariant[];
};

export function mapApiProductToPdp(apiProduct: ApiProduct): PdpMapResult {
  const priceInfo = calculateProductPrice(apiProduct, 1);

  const sortedGallery = [...(apiProduct.images ?? [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );
  let images: ProductImage[] = sortedGallery
    .filter((img) => img.image_url?.trim())
    .map((img) => ({
      id: img.id,
      url: img.image_url!.trim(),
      alt: img.alt_text || apiProduct.name,
    }));
  if (images.length === 0 && apiProduct.main_image?.trim()) {
    images = [
      {
        id: "main",
        url: apiProduct.main_image.trim(),
        alt: apiProduct.name,
      },
    ];
  }

  const variantsNormalized: ProductVariant[] = (apiProduct.variants || []).map((variant) => ({
    ...variant,
    options: variant.options || [],
  }));

  const apiProductWithTech = apiProduct as unknown as Record<string, unknown>;
  const productPromos = Array.isArray((apiProduct as { promos?: unknown }).promos)
    ? ((apiProduct as { promos: unknown[] }).promos ?? [])
    : [];

  const tp = apiProductWithTech;

  const product: PdpProduct = {
    id: apiProduct.id,
    name: apiProduct.name,
    description: apiProduct.description || "",
    currentPrice: priceInfo.currentPrice,
    originalPrice: priceInfo.originalPrice,
    discount: priceInfo.discount,
    images: images.length > 0 ? images : [],
    variants: variantsNormalized.length > 0 ? variantsNormalized : [],
    promos: productPromos,
    technicalDescription: (tp.technical_description as string) || "",
    warrantyMonths: tp.warranty_months as number | undefined,
    warrantyDescription: (tp.warranty_description as string) || "",
    materials: (tp.materials as string) || "",
    basic_color: tp.basic_color && String(tp.basic_color).trim()
      ? String(tp.basic_color).trim()
      : undefined,
    manual_color_labels: (() => {
      let raw: unknown = apiProduct.manual_color_labels;
      if (typeof raw === "string") {
        const tx = raw.trim();
        if (!tx) raw = undefined;
        else {
          try {
            raw = JSON.parse(tx) as unknown;
          } catch {
            raw = undefined;
          }
        }
      }
      if (!Array.isArray(raw)) return undefined;
      const list = raw
        .map((x) => String(x).trim())
        .filter(Boolean);
      return list.length > 0 ? list : undefined;
    })(),
    filling_type: (tp.filling_type as string) || "",
    max_supported_weight_kg: tp.max_supported_weight_kg as number | undefined,
    has_pillow_top: tp.has_pillow_top as boolean | undefined,
    is_bed_in_box: tp.is_bed_in_box as boolean | undefined,
    mattress_firmness: (tp.mattress_firmness as string) || "",
    mattress_height_cm: tp.mattress_height_cm as number | undefined,
    mattress_fabric_type: (tp.mattress_fabric_type as string) || "",
    has_double_pillow: tp.has_double_pillow === true,
    has_moisture_breathers: tp.has_moisture_breathers === true,
    has_side_handles: tp.has_side_handles === true,
    size_label: (tp.size_label as string) || "",
    firmness: (tp.mattress_firmness as string) || "",
    firmnessLevel: firmnessLabelToBarLevel(tp.mattress_firmness as string | undefined),
    maxWeight: tp.max_supported_weight_kg
      ? `${String(tp.max_supported_weight_kg)} kg`
      : undefined,
    size:
      variantsNormalized.length > 0
        ? variantsNormalized[0].size ||
          variantsNormalized[0].name ||
          ((tp.size_label as string) || "Tamaño...")
        : (tp.size_label as string) || "Tamaño...",
    fillingType: (tp.filling_type as string) || "",
    warranty:
      (tp.warranty_description as string) ||
      (tp.warranty_months
        ? `Garantía de ${String(tp.warranty_months)} meses`
        : ""),
    has_crm_stock:
      tp.has_crm_stock !== undefined ? Boolean(tp.has_crm_stock) : true,
    is_active: apiProduct.is_active,
    min_card_price: apiProduct.min_card_price,
    max_card_price: apiProduct.max_card_price,
    min_transfer_price: apiProduct.min_transfer_price,
    max_transfer_price: apiProduct.max_transfer_price,
    display_reference_price:
      apiProduct.display_reference_price != null
        ? Number(apiProduct.display_reference_price)
        : undefined,
    show_transfer_price_highlight: apiProduct.show_transfer_price_highlight === true,
    smart_screen_size:
      tp.smart_screen_size && String(tp.smart_screen_size).trim()
        ? String(tp.smart_screen_size).trim()
        : undefined,
    smart_resolution:
      tp.smart_resolution && String(tp.smart_resolution).trim()
        ? String(tp.smart_resolution).trim()
        : undefined,
    smart_tv:
      tp.smart_tv === true || tp.smart_tv === false ? (tp.smart_tv as boolean) : undefined,
    ac_inverter:
      tp.ac_inverter === true || tp.ac_inverter === false ? (tp.ac_inverter as boolean) : undefined,
    ac_climate_type:
      tp.ac_climate_type && String(tp.ac_climate_type).trim()
        ? String(tp.ac_climate_type).trim()
        : undefined,
    ac_frigorias:
      tp.ac_frigorias != null && tp.ac_frigorias !== ""
        ? Number(tp.ac_frigorias)
        : undefined,
    wm_load_type:
      tp.wm_load_type && String(tp.wm_load_type).trim()
        ? String(tp.wm_load_type).trim()
        : undefined,
    wm_wash_capacity_kg:
      tp.wm_wash_capacity_kg != null && tp.wm_wash_capacity_kg !== ""
        ? Number(tp.wm_wash_capacity_kg)
        : undefined,
    fridge_capacity_liters:
      tp.fridge_capacity_liters != null && tp.fridge_capacity_liters !== ""
        ? Number(tp.fridge_capacity_liters)
        : undefined,
    freezer_capacity_liters:
      tp.freezer_capacity_liters != null && tp.freezer_capacity_liters !== ""
        ? Number(tp.freezer_capacity_liters)
        : undefined,
  };

  const initialSelectedOptions: Record<string, string> = {};
  if (variantsNormalized.length > 0) {
    for (const variant of variantsNormalized) {
      const variantKey =
        variant.id || variant.name || variant.sku || "default";
      const hasOptions =
        variant.options && Array.isArray(variant.options) && variant.options.length > 0;

      if (hasOptions && variant.options!.length === 1) {
        const option = variant.options![0];
        const variantName = variant.name || variant.sku || "";
        if (
          (variantName === "Atributo" ||
            variantName === "" ||
            variant.sku === null ||
            variant.sku === undefined) &&
          option.name === "Default"
        ) {
          initialSelectedOptions[variantKey] = option.id;
        } else if (hasOptions) {
          initialSelectedOptions[variantKey] = option.id;
        }
      } else if (hasOptions && variant.options!.length > 1) {
        initialSelectedOptions[variantKey] = variant.options![0].id;
      }
    }
  }

  return {
    product,
    initialSelectedOptions,
    selectedVariant: variantsNormalized[0]?.id || "",
    variantsNormalized,
  };
}
