"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus, ChevronRight, ChevronLeft, Trash2, ChevronDown, ChevronUp, ImagePlus } from "lucide-react";
import AutoResizeTextarea from "@/components/AutoResizeTextarea";
import { CrmProduct, CrmCombo, completeCrmProduct, uploadProductImageFile, fetchCatalogs, Catalog, createCompleteProduct, fetchProductById, Product } from "@/lib/api";

interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
}

interface CategoryFromPage {
  id: string;
  nombre: string;
  tipo: "Categoría" | "Subcategoría";
  productos: number;
  subcategorias?: number;
  categoriaPadre?: string;
  parentId?: string;
  parent_id?: string; // Legacy support
  opciones?: string[];
  opcionesConIds?: Array<{ id: string; value: string; category_id: string }>; // Opciones con IDs
}

interface Attribute {
  id: string;
  name: string;
  type: "text" | "number" | "color" | "select";
  options: string[];
}

interface Variant {
  attributes: Record<string, string>;
  stock: number;
  prices: Record<string, number>; // catalog_id -> price
}

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories?: CategoryFromPage[];
  crmProduct?: CrmProduct | CrmCombo | null;
}

export default function CreateProductModal({ isOpen, onClose, onSuccess, categories: propCategories = [], crmProduct }: CreateProductModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  
  // Step 1: Datos básicos
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [subcategoryIds, setSubcategoryIds] = useState<string[]>([]); // Múltiples subcategorías
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({}); // Opciones seleccionadas por subcategoría (múltiples)
  const [pendingSubcategories, setPendingSubcategories] = useState<{ ids: string[], options: Record<string, string[]> } | null>(null);
  const [isActive, setIsActive] = useState(true);
  
  // Technical fields
  const [technicalDescription, setTechnicalDescription] = useState("");
  const [warrantyMonths, setWarrantyMonths] = useState<number | undefined>(undefined);
  const [warrantyDescription, setWarrantyDescription] = useState("");
  const [materials, setMaterials] = useState("");
  const [showMattressFields, setShowMattressFields] = useState(false);
  const [fillingType, setFillingType] = useState("");
  const [maxSupportedWeightKg, setMaxSupportedWeightKg] = useState<number | undefined>(undefined);
  const [hasPillowTop, setHasPillowTop] = useState(false);
  const [isBedInBox, setIsBedInBox] = useState(false);
  const [mattressFirmness, setMattressFirmness] = useState("");
  const [sizeLabel, setSizeLabel] = useState("");
  
  // Images
  const [images, setImages] = useState<Array<{ image_url: string; alt_text?: string; position: number }>>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Atributos (generados automáticamente según categoría, pero editables)
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [newAttributeName, setNewAttributeName] = useState("");
  const [isAddingAttribute, setIsAddingAttribute] = useState(false);
  const [newOptionValues, setNewOptionValues] = useState<Record<string, string>>({});
  
  // Step 3: Variantes
  const [variants, setVariants] = useState<Variant[]>([]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [expandedVariant, setExpandedVariant] = useState<number | null>(null);
  
  // Otros estados
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Convertir categorías del formato de la página al formato del modal
  const categories: Category[] = propCategories.map((cat) => ({
    id: cat.id,
    name: cat.nombre,
    description: undefined,
    parent_id: cat.parentId,
  }));

  // Separar categorías principales de subcategorías
  const mainCategories = categories.filter((cat) => !cat.parent_id);
  const subcategories = categories.filter((cat) => cat.parent_id);
  
  // Obtener la categoría seleccionada para verificar si tiene opciones
  const selectedCategory = propCategories.find((cat) => cat.id === categoryId);
  const hasCategoryOptions = selectedCategory?.opciones && selectedCategory.opciones.length > 0;
  
  // Filtrar subcategorías según la categoría seleccionada
  // Mostrar todas las subcategorías disponibles para la categoría seleccionada
  const availableSubcategories = categoryId 
    ? propCategories
        .filter(cat => cat.parentId === categoryId)
        .map(cat => ({
          id: cat.id,
          name: cat.nombre,
          description: undefined,
          parent_id: categoryId,
          opciones: cat.opciones || [],
        }))
    : [];
  
  // Verificar si alguna subcategoría seleccionada tiene opciones
  const hasSubcategoryOptions = subcategoryIds.some(subcatId => {
    const subcat = propCategories.find(cat => cat.id === subcatId);
    return subcat?.opciones && subcat.opciones.length > 0;
  });
  
  // Obtener las subcategorías seleccionadas
  const selectedSubcategories = propCategories.filter(cat => subcategoryIds.includes(cat.id));
  
  // Para Colchones, verificar si "Por tamaño" está seleccionada
  const hasPorTamañoSelected = selectedCategory?.nombre === "Colchones" && 
    subcategoryIds.some(id => {
      const subcat = propCategories.find(c => c.id === id);
      return subcat?.nombre === "Por tamaño";
    });

  // Obtener opciones seleccionadas para una subcategoría específica
  const getSelectedOptionsForSubcategory = (subcatId: string): string[] => {
    return selectedOptions[subcatId] || [];
  };
  
  // Verificar si una opción está seleccionada para una subcategoría
  const isOptionSelected = (subcatId: string, option: string): boolean => {
    return getSelectedOptionsForSubcategory(subcatId).includes(option);
  };
  
  // Toggle opción para una subcategoría
  const toggleOption = (subcatId: string, option: string) => {
    const currentOptions = getSelectedOptionsForSubcategory(subcatId);
    const isSelected = currentOptions.includes(option);
    
    if (isSelected) {
      // Remover opción
      setSelectedOptions({
        ...selectedOptions,
        [subcatId]: currentOptions.filter(opt => opt !== option)
      });
    } else {
      // Agregar opción
      setSelectedOptions({
        ...selectedOptions,
        [subcatId]: [...currentOptions, option]
      });
    }
  };

  // Función para generar atributos según la categoría seleccionada
  const generateAttributesForCategory = (catId: string, selectedSubcatIds: string[], selectedOptions: Record<string, string>): Attribute[] => {
    const category = propCategories.find(c => c.id === catId);
    
    // Colchones - generar atributos según las subcategorías seleccionadas
    if (category?.nombre === "Colchones" && selectedSubcatIds.length > 0) {
      const attributes: Attribute[] = [];
      
      // Si "Por tamaño" NO está seleccionada como subcategoría, agregar tamaño como atributo
      const hasPorTamaño = selectedSubcatIds.some(id => {
        const subcat = propCategories.find(c => c.id === id);
        return subcat?.nombre === "Por tamaño";
      });
      
      if (!hasPorTamaño) {
        attributes.push({
          id: "tamaño-colchones",
          name: "Tamaño de colchones",
          type: "select",
          options: [
            "Una plaza (80x190)",
            "Una plaza y media (100x190)",
            "Dos plazas (140x190)",
            "Queen size (160x200)",
            "Extra-queen size (180x200)",
            "King size (200x200)"
          ]
        });
      }
      
      return attributes;
    }
    
    // Para otras categorías que no sean Colchones, mantener la lógica anterior
    const subcategory = propCategories.find(c => c.id === selectedSubcatIds[0]);
    const finalCategory = subcategory || category;
    const categoryName = finalCategory?.nombre || category?.nombre || "";
    
    // Respaldos - modelos y colores
    const directOptions = getSelectedOptionsForSubcategory("direct");
    const firstSubcatOptions = subcategoryIds.length > 0 ? getSelectedOptionsForSubcategory(subcategoryIds[0]) : [];
    const respaldosOption = directOptions[0] || firstSubcatOptions[0] || "";
    if (categoryName === "Sommier" && respaldosOption === "Respaldos") {
      return [
        {
          id: "modelo-respaldo",
          name: "Modelo",
          type: "select",
          options: [
            "Pana capitoné",
            "Tela alpha gris",
            "Pana de listones verticales",
            "Lino liso"
          ]
        },
        {
          id: "tamaño-respaldo",
          name: "Tamaño",
          type: "select",
          options: [
            "Una plaza (80x190)",
            "Una plaza y media (100x190)",
            "Dos plazas (140x190)",
            "Queen size (160x200)",
            "Extra-queen size (180x200)",
            "King size (200x200)"
          ]
        }
      ];
    }
    
    // Muebles de cocina
    if (categoryName === "Muebles de cocina") {
      return [{
        id: "tamaño-mueble",
        name: "Tamaño",
        type: "select",
        options: [
          "120cm",
          "140cm"
        ]
      }];
    }
    
    // Accesorios de descanso - según la opción seleccionada
    if (categoryName === "Accesorios de descanso") {
      const directOptions = getSelectedOptionsForSubcategory("direct");
      const firstSubcatOptions = subcategoryIds.length > 0 ? getSelectedOptionsForSubcategory(subcategoryIds[0]) : [];
      const accesoriosOption = directOptions[0] || firstSubcatOptions[0] || "";
      if (accesoriosOption === "Almohadas") {
        return [{
          id: "tipo-almohada",
          name: "Tipo de almohada",
          type: "select",
          options: [
            "Inteligente",
            "Premium",
            "Estándar"
          ]
        }];
      }
      // Para otros accesorios (Sábanas, Cubre colchón, Acolchados) no hay atributos específicos
      return [];
    }
    
    // Por defecto, sin atributos
    return [];
  };

  // Fetch catalogs when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCatalogs(false).then(setCatalogs).catch((err) => {
        console.error("Error fetching catalogs:", err);
        setError("Error al cargar catálogos");
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setCurrentStep(1);
      
      // Los datos completos se cargarán en el siguiente useEffect usando fetchProductById
      // Solo inicializar campos básicos aquí si es necesario
      if (crmProduct && crmProduct.product_id) {
        // Editing completed CRM product - los datos se cargarán en el useEffect siguiente
        // Solo inicializar valores por defecto aquí
      } else if (crmProduct) {
        // Completing CRM product - NO inicializar campos desde CRM, solo mostrar info
        setName("");
        setDescription("");
        setIsActive(crmProduct.is_active ?? true);
        setImages([]);
      } else {
        // New product
        setName("");
        setDescription("");
        setCategoryId("");
        setSubcategoryIds([]);
        setSelectedOptions({});
        setIsActive(true);
        setTechnicalDescription("");
        setWarrantyMonths(undefined);
        setWarrantyDescription("");
        setMaterials("");
        setShowMattressFields(false);
        setFillingType("");
        setMaxSupportedWeightKg(undefined);
        setHasPillowTop(false);
        setIsBedInBox(false);
        setMattressFirmness("");
        setSizeLabel("");
        setImages([]);
      }
      
      // Solo resetear estos campos si NO estamos editando un producto completo
      // (Los datos completos se cargarán en el siguiente useEffect)
      if (!(crmProduct && crmProduct.product_id)) {
        setSubcategoryIds([]);
        setSelectedOptions({});
        setAttributes([]);
        setVariants([]);
      }
      setNewAttributeName("");
      setIsAddingAttribute(false);
      setNewOptionValues({});
      setImageFiles([]);
      setError("");
      setExpandedVariant(null);
    }
  }, [isOpen, crmProduct]);

  // Cargar datos completos del producto cuando se está editando un producto completo
  useEffect(() => {
    const loadCompleteProductData = async () => {
      if (!isOpen || !crmProduct || !crmProduct.product_id) {
        return;
      }

      try {
        const fullProduct = await fetchProductById(crmProduct.product_id) as any;
        if (!fullProduct) {
          return;
        }

        // Actualizar TODOS los campos del formulario con los datos del producto completo
        setName(fullProduct.name || "");
        setDescription(fullProduct.description || "");
        setCategoryId(fullProduct.category_id || "");
        setIsActive(fullProduct.is_active ?? true);
        setTechnicalDescription(fullProduct.technical_description || "");
        setWarrantyMonths(fullProduct.warranty_months);
        setWarrantyDescription(fullProduct.warranty_description || "");
        setMaterials(fullProduct.materials || "");
        
        // Campos de colchón
        const hasMattressData = !!(fullProduct.filling_type || fullProduct.max_supported_weight_kg || 
          fullProduct.has_pillow_top || fullProduct.is_bed_in_box || fullProduct.mattress_firmness || fullProduct.size_label);
        setShowMattressFields(hasMattressData);
        setFillingType(fullProduct.filling_type || "");
        setMaxSupportedWeightKg(fullProduct.max_supported_weight_kg);
        setHasPillowTop(fullProduct.has_pillow_top || false);
        setIsBedInBox(fullProduct.is_bed_in_box || false);
        setMattressFirmness(fullProduct.mattress_firmness || "");
        setSizeLabel(fullProduct.size_label || "");
        
        // Imágenes
        if (fullProduct.images && fullProduct.images.length > 0) {
          setImages(fullProduct.images.map((img: any) => ({
            image_url: img.image_url,
            alt_text: img.alt_text,
            position: img.position || 0,
          })));
        }

        // Cargar categoría y subcategorías
        let loadedCategoryId = "";
        const loadedSubcatIds: string[] = [];
        const loadedOptions: Record<string, string[]> = {};
        
        // PRIMERO: Cargar desde product_subcategories (tabla de relación muchos-a-muchos)
        if (fullProduct.subcategories && Array.isArray(fullProduct.subcategories) && fullProduct.subcategories.length > 0) {
          fullProduct.subcategories.forEach((subcat: any, index: number) => {
            if (subcat.subcategory_id) {
              // Normalizar a string para consistencia
              const subcatIdStr = String(subcat.subcategory_id);
              
              // Si esta subcategoría ya está en loadedSubcatIds, solo agregar la opción
              // Si no está, agregarla a loadedSubcatIds
              if (!loadedSubcatIds.includes(subcatIdStr)) {
                loadedSubcatIds.push(subcatIdStr);
                loadedOptions[subcatIdStr] = [];
              }
              
              // Cargar opción si existe (puede haber múltiples opciones para la misma subcategoría)
              if (subcat.category_option_id && subcat.category_option_value) {
                const optionValue = String(subcat.category_option_value);
                // Solo agregar si no está ya en el array (evitar duplicados)
                if (!loadedOptions[subcatIdStr].includes(optionValue)) {
                  loadedOptions[subcatIdStr].push(optionValue);
                }
              }
            }
          });
        }
        
        // SEGUNDO: Si no hay subcategorías desde product_subcategories, verificar category_id legacy
        if (loadedSubcatIds.length === 0 && fullProduct.category_id) {
          const categoryFromProduct = propCategories.find(cat => cat.id === fullProduct.category_id);
          
          if (categoryFromProduct?.parentId || categoryFromProduct?.parent_id) {
            // Es una subcategoría (caso legacy)
            const parentId = categoryFromProduct.parentId || categoryFromProduct.parent_id;
            if (parentId) {
              loadedCategoryId = parentId;
              loadedSubcatIds.push(fullProduct.category_id);
              
              // Cargar opción si existe
              if (fullProduct.category_option_id && categoryFromProduct.opcionesConIds) {
                const optionObj = categoryFromProduct.opcionesConIds.find(opt => opt.id === fullProduct.category_option_id);
                if (optionObj) {
                  loadedOptions[fullProduct.category_id] = [optionObj.value];
                }
              }
            }
          } else {
            // Es una categoría principal
            loadedCategoryId = fullProduct.category_id;
          }
        }
        
        // TERCERO: Establecer los valores cargados
        if (loadedSubcatIds.length > 0) {
          // PRIMERO establecer la categoría padre ANTES de establecer las subcategorías
          // (esto asegura que availableSubcategories se calcule correctamente)
          if (!loadedCategoryId && loadedSubcatIds.length > 0) {
            const firstSubcat = propCategories.find(c => c.id === loadedSubcatIds[0]);
            if (firstSubcat?.parentId || firstSubcat?.parent_id) {
              loadedCategoryId = firstSubcat.parentId || firstSubcat.parent_id;
            }
          }
          
          // Establecer categoría padre PRIMERO
          if (loadedCategoryId) {
            setCategoryId(loadedCategoryId);
            
            // Guardar las subcategorías pendientes para establecerlas cuando categoryId se actualice
            setPendingSubcategories({
              ids: loadedSubcatIds,
              options: loadedOptions
            });
          } else {
            setSubcategoryIds(loadedSubcatIds);
            if (Object.keys(loadedOptions).length > 0) {
              setSelectedOptions(loadedOptions);
            }
          }
        } else if (loadedCategoryId) {
          // Solo hay categoría, sin subcategorías
          setCategoryId(loadedCategoryId);
        }

        // Cargar variantes y atributos desde el producto completo
        if (fullProduct.variants && fullProduct.variants.length > 0) {
          // El backend estructura las variantes así:
          // - Cada variant tiene un sku que es el nombre del atributo (ej: "Tamaño")
          // - Cada variant tiene options, donde cada option.name es el valor del atributo (ej: "M")
          // - Cada variant tiene prices (array) con precios por catálogo
          // - El stock está en cada option
          
          // Extraer atributos únicos de las variantes
          const attributeMap: Record<string, Set<string>> = {};
          
          // Primero, recopilar todos los atributos y sus valores
          fullProduct.variants.forEach((variant: any) => {
            if (variant.options && variant.options.length > 0) {
              const attrName = variant.sku || 'Atributo';
              variant.options.forEach((option: any) => {
                if (!attributeMap[attrName]) {
                  attributeMap[attrName] = new Set();
                }
                attributeMap[attrName].add(option.name);
              });
            } else if (variant.attributes) {
              // Si tiene attributes directamente, usarlos
              Object.entries(variant.attributes).forEach(([attrName, attrValue]) => {
                if (!attributeMap[attrName]) {
                  attributeMap[attrName] = new Set();
                }
                attributeMap[attrName].add(attrValue as string);
              });
            }
          });
          
          // Crear un mapa de combinaciones de atributos a precios y stock
          // Cada variant tiene un atributo (sku) y múltiples options con stock
          // Los precios están en la variant (compartidos entre todas las options)
          const variantMap: Map<string, Variant> = new Map();
          const attributeNames = Object.keys(attributeMap);
          
          if (attributeNames.length > 0) {
            // Recorrer todas las variants para obtener precios y stocks
            fullProduct.variants.forEach((variant: any, variantIndex: number) => {
              const variantAttrName = variant.sku || 'Atributo';
              
              // Los precios ahora están en cada option, no en la variant
              // Si esta variant tiene options, crear una variante por cada option con sus precios
              if (variant.options && variant.options.length > 0) {
                variant.options.forEach((option: any) => {
                  // Crear atributos para esta combinación
                  const attributes: Record<string, string> = {
                    [variantAttrName]: option.name
                  };
                  
                  const attrKey = JSON.stringify(attributes);
                  
                  // Cargar precios desde esta opción específica
                  const optionPrices: Record<string, number> = {};
                  if (option.prices && Array.isArray(option.prices)) {
                    console.log(`[PRICES] Option "${option.name}" - Precios encontrados:`, option.prices);
                    option.prices.forEach((price: any) => {
                      // Preferir catalog_id, pero mantener compatibilidad con locality_id
                      const priceKey = price.catalog_id || price.locality_id;
                      if (priceKey) {
                        optionPrices[priceKey] = price.price;
                        console.log(`[PRICES] Precio cargado: option="${option.name}", catalog_id=${price.catalog_id || 'N/A'}, locality_id=${price.locality_id || 'N/A'}, price=${price.price}`);
                      }
                    });
                  }
                  
                  // Si ya existe esta combinación, actualizar precios (merge)
                  if (variantMap.has(attrKey)) {
                    const existing = variantMap.get(attrKey)!;
                    variantMap.set(attrKey, {
                      ...existing,
                      prices: { ...existing.prices, ...optionPrices }, // Merge de precios
                    });
                  } else {
                    variantMap.set(attrKey, {
                      attributes,
                      stock: 0, // No guardamos stock
                      prices: { ...optionPrices }, // Precios de esta opción específica
                    });
                    
                    if (Object.keys(optionPrices).length > 0) {
                      console.log(`[PRICES] Variante creada con precios:`, {
                        attributes,
                        optionName: option.name,
                        prices: optionPrices,
                      });
                    }
                  }
                });
              } else {
                // Si no tiene options, verificar si la variant tiene precios directamente
                const attributes: Record<string, string> = {};
                if (variant.attributes) {
                  Object.assign(attributes, variant.attributes);
                } else if (variantAttrName !== 'Atributo') {
                  attributes[variantAttrName] = variantAttrName;
                }
                
                const attrKey = JSON.stringify(attributes);
                
                // Intentar cargar precios desde variant.prices (por compatibilidad)
                const variantPrices: Record<string, number> = {};
                if (variant.prices && Array.isArray(variant.prices)) {
                  variant.prices.forEach((price: any) => {
                    // Preferir catalog_id, pero mantener compatibilidad con locality_id
                    const priceKey = price.catalog_id || price.locality_id;
                    if (priceKey) {
                      variantPrices[priceKey] = price.price;
                    }
                  });
                }
                
                variantMap.set(attrKey, {
                  attributes,
                  stock: 0, // No guardamos stock
                  prices: variantPrices,
                });
              }
            });
          } else {
            // Si no hay atributos estructurados, usar las variants directamente
            // Los precios pueden estar en variant.prices o en option.prices
            fullProduct.variants.forEach((variant: any) => {
              const prices: Record<string, number> = {};
              
              // Primero intentar cargar desde las opciones (nueva estructura)
              if (variant.options && variant.options.length > 0) {
                variant.options.forEach((option: any) => {
                  if (option.prices && Array.isArray(option.prices)) {
                    option.prices.forEach((price: any) => {
                      // Preferir catalog_id, pero mantener compatibilidad con locality_id
                      const priceKey = price.catalog_id || price.locality_id;
                      if (priceKey) {
                        prices[priceKey] = price.price;
                      }
                    });
                  }
                });
              }
              
              // Si no hay precios en las opciones, intentar desde variant.prices (compatibilidad)
              if (Object.keys(prices).length === 0 && variant.prices && Array.isArray(variant.prices)) {
                variant.prices.forEach((price: any) => {
                  // Preferir catalog_id, pero mantener compatibilidad con locality_id
                  const priceKey = price.catalog_id || price.locality_id;
                  if (priceKey) {
                    prices[priceKey] = price.price;
                  }
                });
              }
              
              const attributes: Record<string, string> = variant.attributes || {};
              const attrKey = JSON.stringify(attributes);
              
              if (!variantMap.has(attrKey)) {
                variantMap.set(attrKey, {
                  attributes,
                  stock: 0, // No guardamos stock
                  prices,
                });
              }
            });
          }

          // Convertir el mapa de atributos al formato esperado
          const loadedAttributes: Attribute[] = Object.entries(attributeMap).map(([name, values], index) => ({
            id: `attr-${index}`,
            name,
            type: "select" as const,
            options: Array.from(values),
          }));

          if (loadedAttributes.length > 0) {
            setAttributes(loadedAttributes);
          }

          // Cargar variantes desde el mapa
          const loadedVariants: Variant[] = Array.from(variantMap.values());
          loadedVariants.forEach((variant, index) => {
            const pricesCount = Object.keys(variant.prices).length;
            if (pricesCount > 0) {
              console.log(`[PRICES] Variante ${index} (${JSON.stringify(variant.attributes)}) tiene ${pricesCount} precio(s):`, variant.prices);
              Object.entries(variant.prices).forEach(([catalogId, price]) => {
                const catalog = catalogs.find(c => c.id === catalogId);
                console.log(`[PRICES]   - Catálogo ${catalogId} (${catalog?.name || 'N/A'}): ${price}`);
              });
            }
          });

          if (loadedVariants.length > 0) {
            setVariants(loadedVariants);
          }
        }
      } catch (error) {
        console.error("Error loading complete product data:", error);
        // No mostrar error al usuario, simplemente no cargar datos adicionales
      }
    };

    loadCompleteProductData();
  }, [isOpen, crmProduct?.product_id, propCategories]);

  // Establecer subcategorías pendientes cuando categoryId se actualice
  useEffect(() => {
    if (categoryId && pendingSubcategories) {
      setSubcategoryIds(pendingSubcategories.ids);
      
      if (Object.keys(pendingSubcategories.options).length > 0) {
        setSelectedOptions(pendingSubcategories.options);
      }
      
      // Limpiar las subcategorías pendientes
      setPendingSubcategories(null);
    }
  }, [categoryId, pendingSubcategories]);

  // Generar atributos cuando cambia la categoría, subcategorías u opción (solo si no hay atributos ya)
  useEffect(() => {
    if (categoryId && currentStep >= 2 && attributes.length === 0) {
      const generatedAttributes = generateAttributesForCategory(categoryId, subcategoryIds, selectedOptions);
      setAttributes(generatedAttributes);
    } else if (!categoryId) {
      setAttributes([]);
    }
  }, [categoryId, subcategoryIds, selectedOptions, currentStep]);

  // Funciones para editar atributos
  const handleAddAttribute = () => {
    if (!newAttributeName.trim()) {
      setError("El nombre del atributo es requerido");
      return;
    }

    if (attributes.some((attr) => attr.name.toLowerCase() === newAttributeName.toLowerCase().trim())) {
      setError("Ya existe un atributo con ese nombre");
      return;
    }

    const newAttribute: Attribute = {
      id: Date.now().toString(),
      name: newAttributeName.trim(),
      type: "select",
      options: [],
    };

    setAttributes([...attributes, newAttribute]);
    setNewAttributeName("");
    setIsAddingAttribute(false);
    setError("");
  };

  const handleAddOption = (attributeId: string) => {
    const optionValue = newOptionValues[attributeId]?.trim();
    if (!optionValue) {
      return;
    }

    setAttributes((prev) =>
      prev.map((attr) => {
        if (attr.id === attributeId) {
          if (attr.options.includes(optionValue)) {
            setError("Esta opción ya existe");
            return attr;
          }
          return {
            ...attr,
            options: [...attr.options, optionValue],
          };
        }
        return attr;
      })
    );

    setNewOptionValues((prev) => ({
      ...prev,
      [attributeId]: "",
    }));
    setError("");
  };

  const handleRemoveAttribute = (attributeId: string) => {
    setAttributes((prev) => prev.filter((attr) => attr.id !== attributeId));
  };

  const handleRemoveOption = (attributeId: string, option: string) => {
    setAttributes((prev) =>
      prev.map((attr) => {
        if (attr.id === attributeId) {
          return {
            ...attr,
            options: attr.options.filter((opt) => opt !== option),
          };
        }
        return attr;
      })
    );
  };

  useEffect(() => {
    // Generar variantes cuando cambian los atributos o cuando se llega al paso 3
    // IMPORTANTE: Preservar variantes existentes si ya coinciden con los atributos (para mantener precios cargados)
    if (currentStep === 3) {
      if (attributes.length === 0) {
        // Si no hay atributos, crear una variante única solo si no hay variantes
        setVariants((prev) => {
          if (prev.length === 0) {
            return [{
              attributes: {},
              stock: 99999,
              prices: {},
            }];
          }
          return prev; // Preservar variantes existentes
        });
      } else {
        // Verificar si las variantes actuales ya coinciden con los atributos antes de regenerar
        setVariants((prev) => {
          // Si ya hay variantes, verificar si coinciden
          if (prev.length > 0) {
            // Generar todas las combinaciones esperadas
            const expectedCombos: string[] = [];
            const generateExpected = (current: Record<string, string>, attrIndex: number) => {
              if (attrIndex === attributes.length) {
                expectedCombos.push(JSON.stringify(current));
                return;
              }
              const attr = attributes[attrIndex];
              if (attr.options.length === 0) {
                generateExpected(current, attrIndex + 1);
              } else {
                attr.options.forEach(opt => {
                  generateExpected({ ...current, [attr.name]: opt }, attrIndex + 1);
                });
              }
            };
            generateExpected({}, 0);
            
            const currentCombos = prev.map(v => JSON.stringify(v.attributes)).sort();
            const expectedSorted = expectedCombos.sort();
            
            // Si coinciden, preservar las variantes existentes (con sus precios)
            if (currentCombos.length === expectedSorted.length && 
                currentCombos.every((combo, i) => combo === expectedSorted[i])) {
              console.log("[PRICES] Variantes actuales coinciden con atributos, preservando precios");
              return prev;
            }
          }
          
          // No coinciden o no hay variantes, generar nuevas preservando precios
          generateVariants();
          return prev; // generateVariants actualizará el estado
        });
      }
    }
  }, [attributes, currentStep]);


  const generateVariants = () => {
    if (attributes.length === 0) {
      setVariants([]);
      return;
    }

    // Generar todas las combinaciones posibles
    const combinations: Record<string, string>[] = [];
    
    const generateCombinations = (current: Record<string, string>, index: number) => {
      if (index === attributes.length) {
        combinations.push({ ...current });
        return;
      }

      const attribute = attributes[index];
      if (attribute.options.length === 0) {
        generateCombinations(current, index + 1);
      } else {
        attribute.options.forEach((option) => {
          generateCombinations(
            { ...current, [attribute.name]: option },
            index + 1
          );
        });
      }
    };

    generateCombinations({}, 0);

    // Crear variantes preservando precios existentes si las variantes ya existen
    setVariants((prevVariants) => {
      const newVariants: Variant[] = combinations.map((combo) => {
        // Buscar si ya existe una variante con estos atributos para preservar sus precios
        const existingVariant = prevVariants.find((v) => {
          const comboKey = JSON.stringify(combo);
          const variantKey = JSON.stringify(v.attributes);
          return comboKey === variantKey;
        });
        
        if (existingVariant) {
          console.log(`[PRICES] Preservando precios para variante ${JSON.stringify(combo)}:`, existingVariant.prices);
        }
        
        return {
          attributes: combo,
          stock: 99999,
          prices: existingVariant?.prices || {}, // Preservar precios existentes
        };
      });

      console.log(`[PRICES] Variantes generadas: ${newVariants.length}, precios preservados`);
      return newVariants;
    });
  };


  const handleVariantChange = (index: number, field: "stock", value: string | number) => {
    setVariants((prev) =>
      prev.map((variant, i) => {
        if (i === index) {
          return {
            ...variant,
            [field]: Number(value),
          };
        }
        return variant;
      })
    );
  };

  const handlePriceChange = (variantIndex: number, catalogId: string, value: string | number) => {
    setVariants((prev) =>
      prev.map((variant, i) => {
        if (i === variantIndex) {
          const newPrices = { ...variant.prices };
          const numValue = Number(value);
          if (numValue > 0) {
            newPrices[catalogId] = numValue;
          } else {
            delete newPrices[catalogId];
          }
          return {
            ...variant,
            prices: newPrices,
          };
        }
        return variant;
      })
    );
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validar paso 1
      if (!name.trim() || !categoryId) {
        setError("Por favor completa todos los campos requeridos");
        return;
      }
      // Validar opciones según el caso
      const selectedCat = propCategories.find((cat) => cat.id === categoryId);
      
      // Si la categoría tiene opciones directas (sin subcategorías), validar opción
      if (selectedCat?.opciones && selectedCat.opciones.length > 0 && availableSubcategories.length === 0) {
        const directOptions = Array.isArray(selectedOptions["direct"]) ? selectedOptions["direct"] : (selectedOptions["direct"] ? [selectedOptions["direct"]] : []);
        if (directOptions.length === 0) {
          setError("Por favor selecciona al menos una opción");
          return;
        }
      }
      
      // Si hay subcategorías seleccionadas, validar que cada una tenga al menos una opción seleccionada si tiene opciones
      for (const subcatId of subcategoryIds) {
        const subcat = propCategories.find((cat) => cat.id === subcatId);
        if (subcat?.opciones && subcat.opciones.length > 0) {
          const subcatOptions = selectedOptions[subcatId] || [];
          if (subcatOptions.length === 0) {
            setError(`Por favor selecciona al menos una opción para la subcategoría "${subcat.nombre}"`);
            return;
          }
        }
      }
      
      setError("");
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Los atributos se generan automáticamente, no hay validación adicional necesaria
      setError("");
      setCurrentStep(3);
      // Las variantes se generarán en el useEffect cuando cambie currentStep
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
      setError("");
    }
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      // Validar variantes (solo precios, sin stock)
      const invalidVariants = variants.filter(
        (v) => Object.values(v.prices).some(price => price <= 0)
      );

      if (invalidVariants.length > 0) {
        setError("Por favor completa todos los campos de las variantes correctamente");
        setLoading(false);
        return;
      }

      // Validar que al menos una variante tenga precios
      const variantsWithPrices = variants.filter(
        (v) => Object.keys(v.prices).length > 0
      );

      if (variantsWithPrices.length === 0) {
        setError("Por favor agrega al menos un precio por catálogo para las variantes");
        setLoading(false);
        return;
      }

      // Si es un producto CRM, usar completeCrmProduct
      if (crmProduct) {
        // Determinar category_id (categoría padre)
        let finalCategoryId = categoryId;
        if (subcategoryIds.length > 0) {
          // Si hay subcategorías, usar la categoría padre de la primera subcategoría
          const firstSubcat = propCategories.find(c => c.id === subcategoryIds[0]);
          if (firstSubcat?.parentId || firstSubcat?.parent_id) {
            finalCategoryId = firstSubcat.parentId || firstSubcat.parent_id;
          }
        }
        
        const productData = {
          product_id: crmProduct.product_id || undefined, // Permitir que el backend lo busque automáticamente
          name,
          description: description || undefined,
          technical_description: technicalDescription || undefined,
          warranty_months: warrantyMonths || undefined,
          warranty_description: warrantyDescription || undefined,
          materials: materials || undefined,
          filling_type: fillingType || undefined,
          max_supported_weight_kg: maxSupportedWeightKg || undefined,
          has_pillow_top: hasPillowTop,
          is_bed_in_box: isBedInBox,
          mattress_firmness: mattressFirmness || undefined,
          size_label: sizeLabel || undefined,
          category_id: finalCategoryId || undefined, // Categoría padre
          subcategory_ids: subcategoryIds.length > 0 ? subcategoryIds : undefined, // Múltiples subcategorías
          subcategory_options: Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined, // Opciones por subcategoría
          category_option_id: (() => {
            // Obtener el ID de la primera opción seleccionada (para compatibilidad)
            // Si hay subcategorías seleccionadas, usar la primera subcategoría
            if (subcategoryIds.length > 0) {
              const subcatId = subcategoryIds[0];
              const selectedOpts = selectedOptions[subcatId] || [];
              if (selectedOpts.length > 0) {
                const subcat = propCategories.find(c => c.id === subcatId);
                const optionObj = subcat?.opcionesConIds?.find(opt => opt.value === selectedOpts[0]);
                return optionObj?.id;
              }
            }
            // Si no hay subcategorías, usar opciones directas
            const directOpts = selectedOptions["direct"] || [];
            if (directOpts.length > 0) {
              const optionObj = selectedCategory?.opcionesConIds?.find(opt => opt.value === directOpts[0]);
              return optionObj?.id;
            }
            return undefined;
          })(),
          is_active: isActive,
          images: images,
          variants: variants.map((variant) => {
            // Generar nombre descriptivo de la variant basado en atributos
            const variantName = Object.entries(variant.attributes)
              .map(([attrName, attrValue]) => `${attrName}: ${attrValue}`)
              .join(', ');
            
            return {
              sku: variantName || undefined,
              stock: variant.stock,
              attributes: variant.attributes,
              prices: Object.entries(variant.prices).map(([catalog_id, price]) => ({
                catalog_id,
                price,
              })),
            };
          }),
        };

        console.log("📦 [CRM] Creando producto CRM con datos:", JSON.stringify(productData, null, 2));
        console.log("📦 [CRM] Variants:", variants);
        console.log("📦 [CRM] Variants mapped:", productData.variants);

        const completedProduct = await completeCrmProduct(crmProduct.id, productData);
        
        // Upload new images if any
        if (imageFiles.length > 0 && completedProduct.id) {
          for (const file of imageFiles) {
            await uploadProductImageFile(file, completedProduct.id);
          }
        }
      } else {
        // Crear producto nuevo
        const productData = {
          name,
          description: description || undefined,
          category_id: subcategoryIds.length > 0 ? undefined : categoryId,
          subcategory_id: subcategoryIds.length > 0 ? subcategoryIds[0] : undefined,
          is_active: isActive,
          variants: variants.map((variant) => {
            // Generar nombre descriptivo de la variant basado en atributos
            const variantName = Object.entries(variant.attributes)
              .map(([attrName, attrValue]) => `${attrName}: ${attrValue}`)
              .join(', ');
            
            return {
              sku: variantName || undefined,
              stock: variant.stock,
              attributes: variant.attributes,
              prices: Object.entries(variant.prices).map(([catalog_id, price]) => ({
                catalog_id,
                price,
              })),
            };
          }),
        };

        console.log("📦 Creando producto con datos:", JSON.stringify(productData, null, 2));
        console.log("📦 Variants:", variants);
        console.log("📦 Variants mapped:", productData.variants);

        try {
          const createdProduct = await createCompleteProduct(productData);
          console.log("✅ Producto creado exitosamente:", createdProduct);
          
          // Upload new images if any
          if (imageFiles.length > 0 && createdProduct.id) {
            for (const file of imageFiles) {
              await uploadProductImageFile(file, createdProduct.id);
            }
          }
        } catch (createError: any) {
          console.error("❌ Error al crear producto:", createError);
          console.error("❌ Error details:", createError.message);
          throw createError;
        }
      }

      // Limpiar formulario
      setName("");
      setDescription("");
      setCategoryId("");
      setSubcategoryIds([]);
      setSelectedOptions({});
      setIsActive(true);
      setAttributes([]);
      setVariants([]);
      setTechnicalDescription("");
      setWarrantyMonths(undefined);
      setWarrantyDescription("");
      setMaterials("");
      setFillingType("");
      setMaxSupportedWeightKg(undefined);
      setHasPillowTop(false);
      setIsBedInBox(false);
      setMattressFirmness("");
      setSizeLabel("");
      setImages([]);
      setImageFiles([]);
      setCurrentStep(1);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar el producto");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 overflow-y-auto"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="bg-white rounded-[16px] w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] my-auto"
        style={{ pointerEvents: "auto" }}
      >
        {/* Header - Sticky */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 sticky top-0 bg-white z-20 rounded-t-[16px]">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {crmProduct ? (crmProduct.is_completed ? "Editar Producto CRM" : "Completar Producto CRM") : "Nuevo Producto"}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  currentStep === 1
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                1. Datos básicos
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  currentStep === 2
                    ? "bg-blue-600 text-white shadow-sm"
                    : currentStep > 2
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                2. Atributos
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  currentStep === 3
                    ? "bg-blue-600 text-white shadow-sm"
                    : currentStep > 3
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                3. Variantes
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Datos básicos */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Información del CRM (solo lectura) */}
              {crmProduct && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3">Información del CRM (solo lectura)</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">ID CRM:</span>
                      <span className="ml-2 text-gray-900">{crmProduct.crm_product_id}</span>
                    </div>
                    {crmProduct.price_sale && (
                      <div>
                        <span className="font-medium text-gray-700">Precio de Venta:</span>
                        <span className="ml-2 text-gray-900">${crmProduct.price_sale}</span>
                      </div>
                    )}
                    {crmProduct.commission && (
                      <div>
                        <span className="font-medium text-gray-700">Comisión:</span>
                        <span className="ml-2 text-gray-900">{crmProduct.commission}%</span>
                      </div>
                    )}
                    {crmProduct.description && (
                      <div className="col-span-2">
                        <span className="font-medium text-gray-700">Descripción CRM:</span>
                        <p className="mt-1 text-gray-900">{crmProduct.description}</p>
                      </div>
                    )}
                    {crmProduct.alt_description && (
                      <div className="col-span-2">
                        <span className="font-medium text-gray-700">Descripción Alternativa:</span>
                        <p className="mt-1 text-gray-900">{crmProduct.alt_description}</p>
                      </div>
                    )}
                    {'items' in crmProduct && crmProduct.items && crmProduct.items.length > 0 && (
                      <div className="col-span-2">
                        <span className="font-medium text-gray-700">Items del Combo:</span>
                        <ul className="mt-1 list-disc list-inside text-gray-900">
                          {crmProduct.items.map((item, idx) => (
                            <li key={idx}>
                              {item.quantity}x {item.item_name || `ID: ${item.crm_product_id}`}
                              {item.item_description && ` - ${item.item_description}`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Imágenes - Movidas al principio */}
              <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Imágenes del Producto</h3>
                
                {/* Imágenes existentes */}
                {images.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img.image_url}
                          alt={img.alt_text || `Imagen ${idx + 1}`}
                          className="w-full h-28 object-cover rounded-lg border border-gray-200 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImages((prevImages) => prevImages.filter((_, i) => i !== idx));
                          }}
                          className="absolute top-1.5 right-1.5 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Zona para agregar imágenes */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setImageFiles((prev) => [...prev, ...files]);
                    e.target.value = "";
                  }}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative flex flex-col items-center justify-center min-h-[140px] rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-blue-600 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                      <ImagePlus className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Arrastrá imágenes o hacé clic para subir</p>
                      <p className="text-xs text-gray-400 mt-0.5">JPG, PNG o WebP. Múltiples archivos.</p>
                    </div>
                  </div>
                </div>

                {/* Previews de archivos seleccionados */}
                {imageFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">{imageFiles.length} archivo(s) nuevo(s)</p>
                    <div className="grid grid-cols-4 gap-2">
                      {imageFiles.map((file, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-20 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setImageFiles(imageFiles.filter((_, i) => i !== idx));
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-colors"
                  placeholder="Ej: Colchón Fénix"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <AutoResizeTextarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  minRows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-colors resize-none"
                  placeholder="Descripción del producto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setSubcategoryIds([]); // Limpiar subcategorías cuando cambia la categoría
                    setSelectedOptions({}); // Limpiar opciones cuando cambia la categoría
                  }}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-colors"
                >
                  <option value="">Selecciona una categoría</option>
                  {mainCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Si la categoría tiene opciones directas (sin subcategorías), mostrar opciones */}
              {categoryId && hasCategoryOptions && availableSubcategories.length === 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opciones <span className="text-red-500">*</span> <span className="text-xs font-normal text-gray-500">(puedes seleccionar múltiples)</span>
                  </label>
                  <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    {selectedCategory?.opciones?.map((opcion, index) => (
                      <label key={index} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isOptionSelected("direct", opcion)}
                          onChange={() => toggleOption("direct", opcion)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{opcion}</span>
                      </label>
                    ))}
                    {getSelectedOptionsForSubcategory("direct").length > 0 && (
                      <div className="text-xs text-gray-500 mt-2">
                        {getSelectedOptionsForSubcategory("direct").length} opción(es) seleccionada(s)
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Si la categoría tiene subcategorías, mostrar checkboxes para múltiples selecciones */}
              {categoryId && availableSubcategories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Subcategorías {subcategoryIds.length > 1 && <span className="text-xs font-normal text-gray-500">({subcategoryIds.length} seleccionadas, se guardará la primera)</span>}
                  </label>
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    {availableSubcategories.map((subcat) => {
                      // Asegurar que la comparación se hace con strings
                      const subcatIdStr = String(subcat.id);
                      const isSelected = subcategoryIds.some(id => String(id) === subcatIdStr);
                      const subcatFromPage = propCategories.find(c => String(c.id) === subcatIdStr);
                      return (
                        <div key={subcat.id} className="space-y-2">
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSubcategoryIds([...subcategoryIds, subcat.id]);
                                } else {
                                  setSubcategoryIds(subcategoryIds.filter(id => id !== subcat.id));
                                  // Limpiar opción de esta subcategoría si se deselecciona
                                  const newOptions = { ...selectedOptions };
                                  delete newOptions[subcat.id];
                                  setSelectedOptions(newOptions);
                                }
                              }}
                              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                              {subcat.name}
                            </span>
                          </label>
                          
                          {/* Si la subcategoría está seleccionada y tiene opciones, mostrar opciones */}
                          {isSelected && subcatFromPage?.opciones && subcatFromPage.opciones.length > 0 && (
                            <div className="ml-8 mt-2 space-y-2">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Selecciona opciones de {subcat.name} (puedes seleccionar múltiples):
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {subcatFromPage.opciones.map((opcion, index) => {
                                  // Opciones pueden ser strings o objetos {id, value}
                                  const optionValue = typeof opcion === 'string' ? opcion : opcion.value;
                                  const optionId = typeof opcion === 'string' ? undefined : opcion.id;
                                  const isOptSelected = isOptionSelected(subcat.id, optionValue);
                                  return (
                                    <label key={index} className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={!!isOptSelected}
                                        onChange={() => toggleOption(subcat.id, optionValue)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      />
                                      <span className="text-sm text-gray-700">{optionValue}</span>
                                    </label>
                                  );
                                })}
                              </div>
                              {getSelectedOptionsForSubcategory(subcat.id).length > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {getSelectedOptionsForSubcategory(subcat.id).length} opción(es) seleccionada(s)
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Campos técnicos - Solo mostrar si es un producto CRM o si se especifica */}
              {(crmProduct || true) && (
                <>
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Información Técnica</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Descripción Técnica
                        </label>
                        <AutoResizeTextarea
                          value={technicalDescription}
                          onChange={(e) => setTechnicalDescription(e.target.value)}
                          minRows={2}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-colors resize-none"
                          placeholder="Descripción técnica del producto"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Meses de Garantía
                        </label>
                        <input
                          type="number"
                          value={warrantyMonths || ""}
                          onChange={(e) => setWarrantyMonths(e.target.value ? parseInt(e.target.value) : undefined)}
                          min="0"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-colors"
                          placeholder="Ej: 12"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Descripción de Garantía
                        </label>
                        <AutoResizeTextarea
                          value={warrantyDescription}
                          onChange={(e) => setWarrantyDescription(e.target.value)}
                          minRows={2}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-colors resize-none"
                          placeholder="Detalles de la garantía"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Materiales
                        </label>
                        <AutoResizeTextarea
                          value={materials}
                          onChange={(e) => setMaterials(e.target.value)}
                          minRows={2}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-colors resize-none"
                          placeholder="Materiales utilizados en el producto"
                        />
                      </div>

                      {/* Toggle para campos específicos de colchones */}
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-center gap-3 mb-4">
                          <input
                            type="checkbox"
                            id="showMattressFields"
                            checked={showMattressFields}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setShowMattressFields(checked);
                              // Si se desactiva, limpiar los campos específicos de colchones
                              if (!checked) {
                                setFillingType("");
                                setMaxSupportedWeightKg(undefined);
                                setHasPillowTop(false);
                                setIsBedInBox(false);
                                setMattressFirmness("");
                                setSizeLabel("");
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="showMattressFields" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Mostrar campos específicos de colchones
                          </label>
                        </div>

                        {showMattressFields && (
                          <div className="space-y-4 pl-7 border-l-2 border-gray-200">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Tipo de Relleno
                                </label>
                                <input
                                  type="text"
                                  value={fillingType}
                                  onChange={(e) => setFillingType(e.target.value)}
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-colors"
                                  placeholder="Ej: Espuma de memoria"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Peso Máximo Soportado (kg)
                                </label>
                                <input
                                  type="number"
                                  value={maxSupportedWeightKg || ""}
                                  onChange={(e) => setMaxSupportedWeightKg(e.target.value ? parseInt(e.target.value) : undefined)}
                                  min="0"
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-colors"
                                  placeholder="Ej: 150"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Firmeza del Colchón
                              </label>
                              <select
                                value={mattressFirmness}
                                onChange={(e) => setMattressFirmness(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-colors"
                              >
                                <option value="">Selecciona firmeza</option>
                                <option value="SOFT">SOFT</option>
                                <option value="MEDIO">MEDIO</option>
                                <option value="FIRME">FIRME</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="hasPillowTop"
                                  checked={hasPillowTop}
                                  onChange={(e) => setHasPillowTop(e.target.checked)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="hasPillowTop" className="text-sm font-medium text-gray-700">
                                  Con Pillow
                                </label>
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="isBedInBox"
                                  checked={isBedInBox}
                                  onChange={(e) => setIsBedInBox(e.target.checked)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="isBedInBox" className="text-sm font-medium text-gray-700">
                                  Colchón en Caja
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Activo
                </label>
              </div>
            </div>
          )}

          {/* Step 2: Atributos y Opciones */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Atributos del Producto</h3>
                  {!isAddingAttribute && (
                    <button
                      type="button"
                      onClick={() => setIsAddingAttribute(true)}
                      className="px-4 py-2 text-white rounded-[6px] text-sm font-medium hover:opacity-90 transition-colors flex items-center gap-2"
                      style={{ backgroundColor: "#155DFC" }}
                    >
                      <Plus className="w-4 h-4" />
                      Agregar atributo
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-5">
                  Los atributos se generan automáticamente según la categoría seleccionada, pero puedes editarlos si es necesario.
                </p>

                {/* Formulario para agregar atributo */}
                {isAddingAttribute && (
                  <div className="mb-6 p-5 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex gap-3 mb-3">
                      <input
                        type="text"
                        value={newAttributeName}
                        onChange={(e) => setNewAttributeName(e.target.value)}
                        placeholder="Nombre del atributo (ej: Tamaño)"
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-colors"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddAttribute();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddAttribute}
                        className="px-5 py-2.5 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-colors shadow-sm"
                        style={{ backgroundColor: "#155DFC" }}
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingAttribute(false);
                          setNewAttributeName("");
                          setError("");
                        }}
                        className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de atributos */}
                {attributes.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <p className="font-medium">No hay atributos agregados aún.</p>
                    <p className="text-sm mt-2 text-gray-400">Haz clic en "Agregar atributo" para comenzar.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {attributes.map((attribute) => (
                      <div
                        key={attribute.id}
                        className="p-5 bg-gray-50 border border-gray-200 rounded-lg shadow-sm hover:shadow transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{attribute.name}</h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttribute(attribute.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            Opciones:
                          </div>
                          {attribute.options.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {attribute.options.map((option) => (
                                <span
                                  key={option}
                                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-2"
                                >
                                  {option}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOption(attribute.id, option)}
                                    className="hover:text-blue-900"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newOptionValues[attribute.id] || ""}
                              onChange={(e) =>
                                setNewOptionValues({
                                  ...newOptionValues,
                                  [attribute.id]: e.target.value,
                                })
                              }
                              placeholder="Agregar nueva opción"
                              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-colors"
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddOption(attribute.id);
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleAddOption(attribute.id)}
                              className="px-4 py-2.5 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-colors flex items-center gap-2 shadow-sm"
                              style={{ backgroundColor: "#155DFC" }}
                            >
                              <Plus className="w-4 h-4" />
                              Agregar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Variantes */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Variantes del Producto
                </h3>
                <span className="text-sm text-gray-600">
                  {variants.length} variante{variants.length !== 1 ? "s" : ""} generada
                  {variants.length !== 1 ? "s" : ""}
                </span>
              </div>

              {variants.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <p className="font-medium">Generando variantes...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {variants.map((variant, index) => {
                    const isExpanded = expandedVariant === index;
                    
                    // Log detallado del estado de la variante
                    console.log(`[PRICES] Variante ${index} en render:`, {
                      attributes: variant.attributes,
                      pricesObject: variant.prices,
                      pricesType: typeof variant.prices,
                      pricesIsObject: variant.prices instanceof Object,
                      pricesKeys: variant.prices ? Object.keys(variant.prices) : [],
                      hasPrices: variant.prices && Object.keys(variant.prices).length > 0,
                      variantObject: variant,
                    });
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        {/* Header row - always visible */}
                        <div 
                          className="bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => setExpandedVariant(isExpanded ? null : index)}
                        >
                          <div className="px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              {attributes.length > 0 && attributes.map((attr) => (
                                <div key={attr.id} className="flex-shrink-0">
                                  <span className="text-xs font-medium text-gray-500 uppercase">
                                    {attr.name}:
                                  </span>
                                  <span className="ml-2 text-sm font-medium text-gray-900">
                                    {variant.attributes[attr.name] || "-"}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedVariant(isExpanded ? null : index);
                              }}
                              className="ml-4 p-1.5 hover:bg-gray-200 rounded transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-600" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-600" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Expanded content - prices by catalog */}
                        {isExpanded && (
                          <div className="border-t border-gray-200 bg-gray-50 p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">
                              Precios por Catálogo
                            </h4>
                            {catalogs.length === 0 ? (
                              <p className="text-sm text-gray-500">Cargando catálogos...</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {catalogs.map((catalog) => {
                                  const currentPrice = variant.prices[catalog.id] || "";
                                  console.log(`[PRICES] Renderizando precio para variante ${index}, catálogo ${catalog.id} (${catalog.name}):`, {
                                    catalogId: catalog.id,
                                    catalogIdType: typeof catalog.id,
                                    variantPrices: variant.prices,
                                    variantPricesKeys: Object.keys(variant.prices),
                                    currentPrice,
                                    priceFound: variant.prices[catalog.id],
                                  });
                                  return (
                                    <div key={catalog.id} className="bg-white rounded-lg border border-gray-200 p-3">
                                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                        {catalog.name}
                                      </label>
                                      {catalog.description && (
                                        <p className="text-xs text-gray-500 mb-1.5">{catalog.description}</p>
                                      )}
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">$</span>
                                        <input
                                          type="number"
                                          value={currentPrice}
                                          onChange={(e) =>
                                            handlePriceChange(index, catalog.id, e.target.value)
                                          }
                                          min="0"
                                          step="0.01"
                                          placeholder="0.00"
                                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm transition-colors"
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          </div>
        </div>

        {/* Advertencia abajo - misma que arriba */}
        {error && (
          <div className="px-6 py-3 bg-red-50 border-t border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Footer con botones de navegación - Sticky */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white sticky bottom-0 rounded-b-[16px]">
          <button
            type="button"
            onClick={currentStep === 1 ? onClose : handlePrevious}
            className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 font-medium"
          >
            {currentStep > 1 && <ChevronLeft className="w-4 h-4" />}
            {currentStep === 1 ? "Cancelar" : "Anterior"}
          </button>

          <div className="flex gap-3">
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 text-white rounded-lg font-semibold hover:opacity-90 transition-colors flex items-center gap-2 shadow-sm"
                style={{ backgroundColor: "#155DFC" }}
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || variants.length === 0}
                className="px-5 py-2.5 text-white rounded-lg font-semibold hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                style={{ backgroundColor: "#155DFC" }}
              >
                {loading ? "Creando..." : "Crear Producto"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

