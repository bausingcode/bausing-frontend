"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, ChevronRight, ChevronLeft } from "lucide-react";
import { createCategory, createCategoryOption } from "@/lib/api";

interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
}

interface Subcategory {
  id: string;
  name: string;
  options: string[];
}

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (category: {
    id: string;
    nombre: string;
    tipo: "Categoría" | "Subcategoría";
    categoriaPadre?: string;
    parentId?: string;
    opciones?: string[];
  }) => void;
  categories?: Category[];
}

export default function CreateCategoryModal({ isOpen, onClose, onSuccess, categories: propCategories = [] }: CreateCategoryModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  
  // Paso 1: Datos básicos
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [hasSubcategories, setHasSubcategories] = useState(false);
  const [hasDirectOptions, setHasDirectOptions] = useState(false);
  
  // Paso 2: Subcategorías y opciones
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [directOptions, setDirectOptions] = useState<string[]>([]);
  const [newDirectOption, setNewDirectOption] = useState("");
  const [newSubcategoryOptions, setNewSubcategoryOptions] = useState<Record<string, string>>({});
  
  // Otros estados
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setCurrentStep(1);
      setCategoryName("");
      setDescription("");
      setHasSubcategories(false);
      setHasDirectOptions(false);
      setSubcategories([]);
      setNewSubcategoryName("");
      setDirectOptions([]);
      setNewDirectOption("");
      setNewSubcategoryOptions({});
      setError("");
    }
  }, [isOpen]);

  const handleAddSubcategory = () => {
    if (!newSubcategoryName.trim()) {
      setError("El nombre de la subcategoría es requerido");
      return;
    }
    
    setSubcategories([
      ...subcategories,
      {
        id: String(Date.now() + subcategories.length),
        name: newSubcategoryName.trim(),
        options: [],
      },
    ]);
    setNewSubcategoryName("");
    setError("");
  };

  const handleRemoveSubcategory = (id: string) => {
    setSubcategories(subcategories.filter((sub) => sub.id !== id));
    const newOptions = { ...newSubcategoryOptions };
    delete newOptions[id];
    setNewSubcategoryOptions(newOptions);
  };

  const handleAddSubcategoryOption = (subcategoryId: string) => {
    const option = newSubcategoryOptions[subcategoryId]?.trim();
    if (!option) {
      setError("El valor de la opción no puede estar vacío");
      return;
    }
    
    setSubcategories(
      subcategories.map((sub) => {
        if (sub.id === subcategoryId) {
          if (sub.options.includes(option)) {
            setError("Esta opción ya existe");
            return sub;
          }
          return { ...sub, options: [...sub.options, option] };
        }
        return sub;
      })
    );
    
    setNewSubcategoryOptions({
      ...newSubcategoryOptions,
      [subcategoryId]: "",
    });
    setError("");
  };

  const handleRemoveSubcategoryOption = (subcategoryId: string, option: string) => {
    setSubcategories(
      subcategories.map((sub) => {
        if (sub.id === subcategoryId) {
          return {
            ...sub,
            options: sub.options.filter((opt) => opt !== option),
          };
        }
        return sub;
      })
    );
  };

  const handleAddDirectOption = () => {
    if (!newDirectOption.trim()) {
      setError("El valor de la opción no puede estar vacío");
      return;
    }
    
    if (directOptions.includes(newDirectOption.trim())) {
      setError("Esta opción ya existe");
      return;
    }
    
    setDirectOptions([...directOptions, newDirectOption.trim()]);
    setNewDirectOption("");
    setError("");
  };

  const handleRemoveDirectOption = (option: string) => {
    setDirectOptions(directOptions.filter((opt) => opt !== option));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!categoryName.trim()) {
        setError("El nombre de la categoría es requerido");
        return;
      }
      
      // Si no tiene subcategorías ni opciones directas, crear categoría simple
      if (!hasSubcategories && !hasDirectOptions) {
        handleSubmit();
        return;
      }
      
      setError("");
      setCurrentStep(2);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(1);
      setError("");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // Crear la categoría principal
      const mainCategory = await createCategory({
        name: categoryName.trim(),
        description: description.trim() || undefined,
        parent_id: undefined,
      });

      const mainCategoryId = mainCategory.id;
      const mainCategoryName = mainCategory.name;

      // Crear opciones directas si existen
      if (hasDirectOptions && directOptions.length > 0) {
        const optionPromises = directOptions.map((option, index) =>
          createCategoryOption(mainCategoryId, {
            value: option.trim(),
            position: index,
          })
        );
        await Promise.all(optionPromises);
      }

      // Crear subcategorías si existen
      if (hasSubcategories && subcategories.length > 0) {
        for (const subcat of subcategories) {
          // Crear la subcategoría
          const subcategory = await createCategory({
            name: subcat.name.trim(),
            description: undefined,
            parent_id: mainCategoryId,
          });

          // Crear las opciones de la subcategoría
          if (subcat.options.length > 0) {
            const optionPromises = subcat.options.map((option, index) =>
              createCategoryOption(subcategory.id, {
                value: option.trim(),
                position: index,
              })
            );
            await Promise.all(optionPromises);
          }
        }
      }

      // Notificar éxito (la página se refrescará automáticamente)
      onSuccess({
        id: mainCategoryId,
        nombre: mainCategoryName,
        tipo: "Categoría" as const,
      });

      // Limpiar formulario
      setCurrentStep(1);
      setCategoryName("");
      setDescription("");
      setHasSubcategories(false);
      setHasDirectOptions(false);
      setSubcategories([]);
      setDirectOptions([]);
      setNewSubcategoryName("");
      setNewSubcategoryOptions({});
      setError("");
      
      // Cerrar el modal
      onClose();
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Error al crear la categoría");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto backdrop-blur-sm"
      style={{ pointerEvents: "none", backgroundColor: "rgba(0, 0, 0, 0.05)" }}
    >
      <div
        className="bg-white rounded-[14px] w-full max-w-3xl mx-4 my-8 shadow-2xl"
        style={{ pointerEvents: "auto" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Nueva Categoría</h2>
          <div className="flex items-center gap-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                currentStep === 1
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              1. Datos básicos
            </span>
            {(hasSubcategories || hasDirectOptions) && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    currentStep === 2
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  2. Subcategorías y Opciones
                </span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Datos básicos */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la categoría <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Ej: Colchones"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Descripción de la categoría"
                />
              </div>

              <div className="space-y-4 mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={hasSubcategories}
                      onChange={(e) => {
                        setHasSubcategories(e.target.checked);
                        if (e.target.checked) {
                          setHasDirectOptions(false);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Esta categoría tendrá subcategorías
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 ml-6 mt-1">
                    Ejemplo: Colchones → Por tipo, Por tamaño, Por combo
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={hasDirectOptions}
                      onChange={(e) => {
                        setHasDirectOptions(e.target.checked);
                        if (e.target.checked) {
                          setHasSubcategories(false);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Esta categoría tendrá opciones directas (sin subcategorías)
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 ml-6 mt-1">
                    Ejemplo: Accesorios de descanso → Sábanas, Almohadas, etc.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Subcategorías y Opciones */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Subcategorías */}
              {hasSubcategories && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Subcategorías</h3>
                    <button
                      type="button"
                      onClick={handleAddSubcategory}
                      className="px-4 py-2 text-white rounded-[6px] text-sm font-medium hover:opacity-90 transition-colors flex items-center gap-2 cursor-pointer"
                      style={{ backgroundColor: "#155DFC" }}
                    >
                      <Plus className="w-4 h-4" />
                      Agregar Subcategoría
                    </button>
                  </div>

                  <div className="space-y-4">
                    {subcategories.length === 0 && (
                      <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
                        <p>No hay subcategorías agregadas aún.</p>
                        <p className="text-sm mt-2">Usa el formulario de abajo para agregar tu primera subcategoría.</p>
                      </div>
                    )}
                    
                    {subcategories.map((subcat) => (
                      <div
                        key={subcat.id}
                        className="p-4 bg-white border border-gray-200 rounded-[6px]"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">{subcat.name}</h4>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubcategory(subcat.id)}
                            className="text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Opciones de la subcategoría */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700 mb-2">
                            Opciones:
                          </div>
                          {subcat.options.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {subcat.options.map((option) => (
                                <span
                                  key={option}
                                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-2"
                                >
                                  {option}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSubcategoryOption(subcat.id, option)}
                                    className="hover:text-blue-900 cursor-pointer"
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
                              value={newSubcategoryOptions[subcat.id] || ""}
                              onChange={(e) =>
                                setNewSubcategoryOptions({
                                  ...newSubcategoryOptions,
                                  [subcat.id]: e.target.value,
                                })
                              }
                              placeholder="Agregar nueva opción"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddSubcategoryOption(subcat.id);
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleAddSubcategoryOption(subcat.id)}
                              className="px-4 py-2 text-white rounded-[6px] text-sm font-medium hover:opacity-90 transition-colors cursor-pointer"
                              style={{ backgroundColor: "#155DFC" }}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Formulario para agregar nueva subcategoría */}
                    <div className="p-4 bg-gray-50 rounded-[6px] border border-gray-200">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={newSubcategoryName}
                          onChange={(e) => setNewSubcategoryName(e.target.value)}
                          placeholder="Nombre de la subcategoría"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddSubcategory();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleAddSubcategory}
                          className="px-4 py-2 text-white rounded-[6px] text-sm font-medium hover:opacity-90 transition-colors cursor-pointer"
                          style={{ backgroundColor: "#155DFC" }}
                        >
                          Agregar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Opciones directas */}
              {hasDirectOptions && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Opciones Directas</h3>
                  
                  {directOptions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {directOptions.map((option) => (
                        <span
                          key={option}
                          className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-2"
                        >
                          {option}
                          <button
                            type="button"
                            onClick={() => handleRemoveDirectOption(option)}
                            className="hover:text-blue-900 cursor-pointer"
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
                      value={newDirectOption}
                      onChange={(e) => setNewDirectOption(e.target.value)}
                      placeholder="Agregar nueva opción"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddDirectOption();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddDirectOption}
                      className="px-4 py-2 text-white rounded-[6px] text-sm font-medium hover:opacity-90 transition-colors cursor-pointer"
                      style={{ backgroundColor: "#155DFC" }}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={currentStep === 1 ? onClose : handlePrevious}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-[6px] hover:bg-gray-200 transition-colors flex items-center gap-2 cursor-pointer"
          >
            {currentStep > 1 && <ChevronLeft className="w-4 h-4" />}
            {currentStep === 1 ? "Cancelar" : "Anterior"}
          </button>

          <div className="flex gap-3">
            {currentStep < 2 || (!hasSubcategories && !hasDirectOptions) ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 text-white rounded-[6px] font-medium hover:opacity-90 transition-colors flex items-center gap-2 cursor-pointer"
                style={{ backgroundColor: "#155DFC" }}
              >
                {(!hasSubcategories && !hasDirectOptions) ? "Crear Categoría" : "Siguiente"}
                {(!hasSubcategories && !hasDirectOptions) ? null : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 text-white rounded-[6px] font-medium hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                style={{ backgroundColor: "#155DFC" }}
              >
                {loading ? "Creando..." : "Crear Categoría"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

