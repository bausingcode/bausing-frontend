"use client";

import { useState, useEffect } from "react";
import { X, Plus, ChevronRight, ChevronLeft, Trash2 } from "lucide-react";

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
  opciones?: string[];
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
  price: number;
}

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories?: CategoryFromPage[];
}

export default function CreateProductModal({ isOpen, onClose, onSuccess, categories: propCategories = [] }: CreateProductModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  
  // Step 1: Datos básicos
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [subcategoryIds, setSubcategoryIds] = useState<string[]>([]); // Múltiples subcategorías
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({}); // Opciones seleccionadas por subcategoría
  const [isActive, setIsActive] = useState(true);
  
  // Step 2: Atributos (generados automáticamente según categoría, pero editables)
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [newAttributeName, setNewAttributeName] = useState("");
  const [isAddingAttribute, setIsAddingAttribute] = useState(false);
  const [newOptionValues, setNewOptionValues] = useState<Record<string, string>>({});
  
  // Step 3: Variantes
  const [variants, setVariants] = useState<Variant[]>([]);
  
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
  // Para Colchones, mostrar "Por tipo" y "Por tamaño" como subcategorías seleccionables
  const availableSubcategories = categoryId 
    ? (() => {
        if (selectedCategory?.nombre === "Colchones") {
          // Para Colchones, mostrar "Por tipo" y "Por tamaño" como subcategorías
          return propCategories.filter(cat => 
            cat.parentId === categoryId && 
            (cat.nombre === "Por tipo" || cat.nombre === "Por tamaño")
          ).map(cat => ({
            id: cat.id,
            name: cat.nombre,
            description: undefined,
            parent_id: categoryId,
            opciones: cat.opciones,
          }));
        }
        // Para otras categorías, usar el comportamiento normal
        return subcategories.filter((subcat) => {
          const subcatFromPage = propCategories.find((cat) => cat.id === subcat.id);
          return subcatFromPage?.parentId === categoryId;
        });
      })()
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
      
      // Si "Por combo" NO está seleccionada como subcategoría, agregar combo como atributo
      const hasPorCombo = selectedSubcatIds.some(id => {
        const subcat = propCategories.find(c => c.id === id);
        return subcat?.nombre === "Por combo";
      });
      
      if (!hasPorCombo) {
        attributes.push({
          id: "combo-colchones",
          name: "Combo",
          type: "select",
          options: [
            "Colchón solo",
            "Colchón + base",
            "Colchón + base + respaldo"
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
    const respaldosOption = selectedOptions["direct"] || Object.values(selectedOptions)[0];
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
      const accesoriosOption = selectedOptions["direct"] || (Object.values(selectedOptions).length > 0 ? Object.values(selectedOptions)[0] : "");
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

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setCurrentStep(1);
      setName("");
      setDescription("");
      setCategoryId("");
      setSubcategoryIds([]);
      setSelectedOptions({});
      setIsActive(true);
      setAttributes([]);
      setVariants([]);
      setNewAttributeName("");
      setIsAddingAttribute(false);
      setNewOptionValues({});
      setError("");
    }
  }, [isOpen]);

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
    if (currentStep === 3) {
      if (attributes.length === 0) {
        // Si no hay atributos, crear una variante única
        setVariants([
          {
            attributes: {},
            stock: 0,
            price: 0,
          },
        ]);
      } else {
        generateVariants();
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

    // Crear variantes iniciales
    const newVariants: Variant[] = combinations.map((combo) => ({
      attributes: combo,
      stock: 0,
      price: 0,
    }));

    setVariants(newVariants);
  };


  const handleVariantChange = (index: number, field: "stock" | "price", value: string | number) => {
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

  const handleNext = () => {
    if (currentStep === 1) {
      // Validar paso 1
      if (!name.trim() || !categoryId) {
        setError("Por favor completa todos los campos requeridos");
        return;
      }
      // Validar opciones según el caso
      const selectedCat = propCategories.find((cat) => cat.id === categoryId);
      
      // Si es Colchones, requiere al menos una subcategoría
      if (selectedCat?.nombre === "Colchones" && subcategoryIds.length === 0) {
        setError("Por favor selecciona al menos una subcategoría");
        return;
      }
      
      // Si la categoría tiene opciones directas (sin subcategorías), validar opción
      if (selectedCat?.opciones && selectedCat.opciones.length > 0 && availableSubcategories.length === 0 && !selectedOptions["direct"]) {
        setError("Por favor selecciona una opción");
        return;
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
      // Validar variantes
      const invalidVariants = variants.filter(
        (v) => v.stock < 0 || v.price < 0
      );

      if (invalidVariants.length > 0) {
        setError("Por favor completa todos los campos de las variantes correctamente");
        setLoading(false);
        return;
      }

      // Preparar datos para enviar
      const productData = {
        name,
        description: description || null,
        category_id: subcategoryIds.length > 0 ? subcategoryIds[0] : categoryId, // Usar primera subcategoría si hay, sino la categoría principal
        category_options: selectedOptions, // Enviar todas las opciones seleccionadas por subcategoría
        is_active: isActive,
        attributes: attributes.map((attr) => ({
          name: attr.name,
          type: attr.type,
          options: attr.options,
        })),
        variants: variants.map((variant) => ({
          attributes: variant.attributes,
          stock: variant.stock,
          price: variant.price,
        })),
      };

      // Simular guardado (sin llamada al backend por ahora)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Limpiar formulario
      setName("");
      setDescription("");
      setCategoryId("");
      setSubcategoryIds([]);
      setOptionValue("");
      setIsActive(true);
      setAttributes([]);
      setVariants([]);
      setCurrentStep(1);
      onSuccess();
      onClose();
    } catch (err) {
      setError("Error al crear el producto");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto"
      style={{ pointerEvents: "none", backgroundColor: "rgba(0, 0, 0, 0.05)" }}
    >
      <div
        className="bg-white rounded-[16px] w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] my-auto"
        style={{ pointerEvents: "auto" }}
      >
        {/* Header - Sticky */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 sticky top-0 bg-white z-20 rounded-t-[16px]">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Nuevo Producto</h2>
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
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-colors"
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
                    Opción <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedOptions["direct"] || ""}
                    onChange={(e) => setSelectedOptions({ ...selectedOptions, "direct": e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-colors"
                  >
                    <option value="">Selecciona una opción</option>
                    {selectedCategory?.opciones?.map((opcion, index) => (
                      <option key={index} value={opcion}>
                        {opcion}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Si la categoría tiene subcategorías, mostrar checkboxes para múltiples selecciones */}
              {categoryId && availableSubcategories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Subcategorías {selectedCategory?.nombre === "Colchones" && <span className="text-red-500">*</span>}
                  </label>
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    {availableSubcategories.map((subcat) => {
                      const isSelected = subcategoryIds.includes(subcat.id);
                      const subcatFromPage = propCategories.find(c => c.id === subcat.id);
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
                                Selecciona opciones de {subcat.name}:
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {subcatFromPage.opciones.map((opcion, index) => (
                                  <label key={index} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`subcat-${subcat.id}`}
                                      checked={selectedOptions[subcat.id] === opcion}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedOptions({
                                            ...selectedOptions,
                                            [subcat.id]: opcion
                                          });
                                        }
                                      }}
                                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{opcion}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
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
                <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {attributes.length > 0 && attributes.map((attr) => (
                          <th
                            key={attr.id}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase"
                          >
                            {attr.name}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          Stock
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          Precio Base
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {variants.map((variant, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {attributes.length > 0 && attributes.map((attr) => (
                            <td key={attr.id} className="px-4 py-3 text-sm text-gray-900">
                              {variant.attributes[attr.name] || "-"}
                            </td>
                          ))}
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={variant.stock}
                              onChange={(e) =>
                                handleVariantChange(index, "stock", e.target.value)
                              }
                              min="0"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm transition-colors"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={variant.price}
                              onChange={(e) =>
                                handleVariantChange(index, "price", e.target.value)
                              }
                              min="0"
                              step="0.01"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm transition-colors"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          </div>
        </div>

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

