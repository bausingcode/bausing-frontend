"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { getAuthHeaders } from "@/lib/api";

interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
}

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCategoryModal({ isOpen, onClose, onSuccess }: CreateCategoryModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [isSubcategory, setIsSubcategory] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories?parent_id=");
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name,
          description: description || null,
          parent_id: isSubcategory && parentId ? parentId : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setName("");
        setDescription("");
        setParentId("");
        setIsSubcategory(false);
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Error al crear la categoría");
      }
    } catch (err) {
      setError("Error al crear la categoría");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm" style={{ pointerEvents: 'none', backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
      <div className="bg-white rounded-[14px] w-full max-w-md mx-4 shadow-2xl" style={{ pointerEvents: 'auto' }}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Nueva Categoría</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la categoría <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Ej: Colchones"
            />
          </div>

          <div className="mb-4">
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

          <div className="mb-6">
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={isSubcategory}
                onChange={(e) => {
                  setIsSubcategory(e.target.checked);
                  if (!e.target.checked) {
                    setParentId("");
                  }
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Es subcategoría</span>
            </label>

            {isSubcategory && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría padre <span className="text-red-500">*</span>
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  required={isSubcategory}
                  className="w-full px-3 py-2 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-[6px] hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-white rounded-[6px] font-medium hover:opacity-90 transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#155DFC" }}
            >
              {loading ? "Creando..." : "Crear Categoría"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

