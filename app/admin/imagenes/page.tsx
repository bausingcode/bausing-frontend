"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import Loader from "@/components/Loader";
import { 
  fetchHeroImages, 
  uploadHeroImageFile,
  updateHeroImage,
  deleteHeroImage,
  HeroImage 
} from "@/lib/api";
import { 
  Image as ImageIcon, 
  Upload, 
  X, 
  Edit2, 
  Trash2, 
  Check, 
  AlertCircle,
  Info,
  Maximize2
} from "lucide-react";

const MAX_HERO_IMAGES = 5;

export default function ImagenesPage() {
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [infoImage, setInfoImage] = useState<HeroImage | null>(null);
  const [discountImage, setDiscountImage] = useState<HeroImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Estados para archivos pendientes de subir
  const [pendingHeroFiles, setPendingHeroFiles] = useState<File[]>([]);
  const [pendingInfoFile, setPendingInfoFile] = useState<File | null>(null);
  const [pendingDiscountFile, setPendingDiscountFile] = useState<File | null>(null);
  
  // Estados para imágenes marcadas para eliminar
  const [imagesToDelete, setImagesToDelete] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  
  // Estado para preview ampliado
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      setLoading(true);
      setError("");
      
      const [hero, info, discount] = await Promise.all([
        fetchHeroImages(1),
        fetchHeroImages(2, true),
        fetchHeroImages(3, true),
      ]);

      setHeroImages(hero);
      setInfoImage(info.length > 0 ? info[0] : null);
      setDiscountImage(discount.length > 0 ? discount[0] : null);
    } catch (err: any) {
      setError(err.message || "Error al cargar las imágenes");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file: File, type: 'hero' | 'info' | 'discount') => {
    if (!file.type.startsWith('image/')) {
      setError("Por favor selecciona un archivo de imagen válido");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError("El archivo es demasiado grande. Máximo: 5MB");
      return;
    }
    
    // Validar límite para hero images
    if (type === 'hero') {
      const currentCount = heroImages.filter(img => !imagesToDelete.has(img.id)).length;
      const totalWithPending = currentCount + pendingHeroFiles.length;
      if (totalWithPending >= MAX_HERO_IMAGES) {
        setError(`Ya tienes ${MAX_HERO_IMAGES} imágenes (incluyendo las pendientes). Elimina algunas primero para agregar más.`);
        return;
      }
    }
    
    setError("");
    
    if (type === 'hero') {
      setPendingHeroFiles([...pendingHeroFiles, file]);
    } else if (type === 'info') {
      setPendingInfoFile(file);
    } else {
      setPendingDiscountFile(file);
    }
  };

  const toggleImageDelete = (imageId: string) => {
    const newSet = new Set(imagesToDelete);
    if (newSet.has(imageId)) {
      newSet.delete(imageId);
    } else {
      newSet.add(imageId);
    }
    setImagesToDelete(newSet);
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      // Eliminar imágenes marcadas
      for (const imageId of imagesToDelete) {
        try {
          await deleteHeroImage(imageId);
        } catch (err: any) {
          console.error(`Error al eliminar imagen ${imageId}:`, err);
        }
      }

      // Subir nuevas imágenes
      for (const file of pendingHeroFiles) {
        await uploadHeroImageFile(file, 1);
      }
      setPendingHeroFiles([]);

      if (pendingInfoFile) {
        await uploadHeroImageFile(pendingInfoFile, 2);
        setPendingInfoFile(null);
      }

      if (pendingDiscountFile) {
        await uploadHeroImageFile(pendingDiscountFile, 3);
        setPendingDiscountFile(null);
      }

      setImagesToDelete(new Set());
      setSuccess("Cambios guardados correctamente");
      await loadImages();
    } catch (err: any) {
      setError(err.message || "Error al guardar los cambios");
    } finally {
      setSubmitting(false);
    }
  };

  const hasChanges = () => {
    return imagesToDelete.size > 0 || pendingHeroFiles.length > 0 || pendingInfoFile || pendingDiscountFile;
  };



  const handleToggleActive = async (image: HeroImage) => {
    try {
      await updateHeroImage(image.id, {
        is_active: !image.is_active,
      });
      await loadImages();
    } catch (err: any) {
      setError(err.message || "Error al actualizar la imagen");
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader 
          title="Gestión de Imágenes" 
          description="Administra las imágenes del encabezado, informativas y de descuentos"
        />
        <Loader message="Cargando imágenes..." fullScreen={false} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Gestión de Imágenes" 
        description="Administra las imágenes del encabezado, informativas y de descuentos"
      />

      {/* Mensajes de éxito/error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <Check className="w-5 h-5" />
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-8">
        {/* Sección: Imágenes de Encabezado */}
        <section className="bg-white border border-gray-200 rounded-[14px] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Imágenes de Encabezado (Hero)
              </h2>
              <p className="text-sm text-gray-600">
                Máximo {MAX_HERO_IMAGES} imágenes. Recomendado: 1920x600px, formato JPG/PNG
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="hero-file-input"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, 'hero');
                  // Reset input para permitir seleccionar el mismo archivo de nuevo
                  e.target.value = '';
                }}
              />
              <label
                htmlFor="hero-file-input"
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                  heroImages.filter(img => !imagesToDelete.has(img.id)).length + pendingHeroFiles.length >= MAX_HERO_IMAGES
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Agregar</span>
              </label>
            </div>
          </div>

          {/* Previews de imágenes pendientes */}
          {pendingHeroFiles.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-blue-900">
                  {pendingHeroFiles.length} imagen(es) pendiente(s) de subir
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {pendingHeroFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div 
                      className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setPreviewImage(URL.createObjectURL(file))}
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const newFiles = pendingHeroFiles.filter((_, i) => i !== index);
                        setPendingHeroFiles(newFiles);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {heroImages.length === 0 && pendingHeroFiles.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hay imágenes de encabezado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {heroImages.map((image) => {
                const isMarkedForDelete = imagesToDelete.has(image.id);
                return (
                  <div
                    key={image.id}
                    className={`border rounded-lg overflow-hidden group relative ${
                      isMarkedForDelete ? "border-red-300 opacity-50" : "border-gray-200"
                    }`}
                  >
                    <div className="aspect-video bg-gray-100 relative">
                      <img
                        src={image.image_url}
                        alt={image.title || "Hero image"}
                        className="w-full h-full object-cover"
                      />
                      {isMarkedForDelete && (
                        <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                          <span className="text-red-700 font-semibold bg-white px-3 py-1 rounded">Se eliminará</span>
                        </div>
                      )}
                      {!image.is_active && !isMarkedForDelete && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white font-semibold">Inactiva</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleToggleActive(image)}
                          className={`p-2 rounded-full ${
                            image.is_active
                              ? "bg-green-500 text-white"
                              : "bg-gray-500 text-white"
                          }`}
                          title={image.is_active ? "Desactivar" : "Activar"}
                        >
                          {image.is_active ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="p-3 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {image.title || "Sin título"}
                        </h3>
                        <button
                          onClick={() => toggleImageDelete(image.id)}
                          className={`p-1.5 rounded transition-colors ${
                            isMarkedForDelete
                              ? "bg-red-100 text-red-700"
                              : "text-red-600 hover:bg-red-50"
                          }`}
                          title={isMarkedForDelete ? "Cancelar eliminación" : "Marcar para eliminar"}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {image.subtitle && (
                        <p className="text-xs text-gray-500 truncate">{image.subtitle}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {heroImages.length > 0 && (
            <div className="mt-4 text-sm text-gray-500">
              {heroImages.filter(img => !imagesToDelete.has(img.id)).length + pendingHeroFiles.length} de {MAX_HERO_IMAGES} imágenes
            </div>
          )}
        </section>

        {/* Sección: Imagen Informativa */}
        <section className="bg-white border border-gray-200 rounded-[14px] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Imagen Informativa
              </h2>
              <p className="text-sm text-gray-600">
                Una sola imagen. Se reemplazará la actual si existe. Recomendado: 1200x400px, formato JPG/PNG
              </p>
            </div>
            <div>
              <input
                type="file"
                id="info-file-input"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, 'info');
                  e.target.value = '';
                }}
              />
              <label
                htmlFor="info-file-input"
                className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
              >
                <Upload className="w-4 h-4" />
                <span>Agregar</span>
              </label>
            </div>
          </div>
          {/* Preview de imagen pendiente */}
          {pendingInfoFile && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
              <div className="flex items-center justify-between flex-1">
                <span className="text-sm font-medium text-blue-900">Nueva imagen pendiente de subir</span>
                <button
                  onClick={() => setPendingInfoFile(null)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div 
                className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setPreviewImage(URL.createObjectURL(pendingInfoFile))}
              >
                <img
                  src={URL.createObjectURL(pendingInfoFile)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {infoImage && !imagesToDelete.has(infoImage.id) ? (
            <div className={`border rounded-lg overflow-hidden ${
              imagesToDelete.has(infoImage.id) ? "border-red-300 opacity-50" : "border-gray-200"
            }`}>
              <div className="aspect-[3/1] bg-gray-100 relative">
                <img
                  src={infoImage.image_url}
                  alt={infoImage.title || "Imagen informativa"}
                  className="w-full h-full object-cover"
                />
                {imagesToDelete.has(infoImage.id) && (
                  <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                    <span className="text-red-700 font-semibold bg-white px-3 py-1 rounded">Se eliminará</span>
                  </div>
                )}
              </div>
              <div className="p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">
                    {infoImage.title || "Sin título"}
                  </h3>
                  <button
                    onClick={() => toggleImageDelete(infoImage.id)}
                    className={`p-1.5 rounded transition-colors ${
                      imagesToDelete.has(infoImage.id)
                        ? "bg-red-100 text-red-700"
                        : "text-red-600 hover:bg-red-50"
                    }`}
                    title={imagesToDelete.has(infoImage.id) ? "Cancelar eliminación" : "Marcar para eliminar"}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {infoImage.subtitle && (
                  <p className="text-sm text-gray-500">{infoImage.subtitle}</p>
                )}
              </div>
            </div>
          ) : !pendingInfoFile ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hay imagen informativa</p>
            </div>
          ) : null}
        </section>

        {/* Sección: Imagen de Descuentos */}
        <section className="bg-white border border-gray-200 rounded-[14px] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Imagen de Descuentos
              </h2>
              <p className="text-sm text-gray-600">
                Una sola imagen. Se reemplazará la actual si existe. Recomendado: 1200x400px, formato JPG/PNG
              </p>
            </div>
            <div>
              <input
                type="file"
                id="discount-file-input"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, 'discount');
                  e.target.value = '';
                }}
              />
              <label
                htmlFor="discount-file-input"
                className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
              >
                <Upload className="w-4 h-4" />
                <span>Agregar</span>
              </label>
            </div>
          </div>

          {/* Preview de imagen pendiente */}
          {pendingDiscountFile && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
              <div className="flex items-center justify-between flex-1">
                <span className="text-sm font-medium text-blue-900">Nueva imagen pendiente de subir</span>
                <button
                  onClick={() => setPendingDiscountFile(null)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div 
                className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setPreviewImage(URL.createObjectURL(pendingDiscountFile))}
              >
                <img
                  src={URL.createObjectURL(pendingDiscountFile)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {discountImage && !imagesToDelete.has(discountImage.id) ? (
            <div className={`border rounded-lg overflow-hidden ${
              imagesToDelete.has(discountImage.id) ? "border-red-300 opacity-50" : "border-gray-200"
            }`}>
              <div className="aspect-[3/1] bg-gray-100 relative">
                <img
                  src={discountImage.image_url}
                  alt={discountImage.title || "Imagen de descuentos"}
                  className="w-full h-full object-cover"
                />
                {imagesToDelete.has(discountImage.id) && (
                  <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                    <span className="text-red-700 font-semibold bg-white px-3 py-1 rounded">Se eliminará</span>
                  </div>
                )}
              </div>
              <div className="p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">
                    {discountImage.title || "Sin título"}
                  </h3>
                  <button
                    onClick={() => toggleImageDelete(discountImage.id)}
                    className={`p-1.5 rounded transition-colors ${
                      imagesToDelete.has(discountImage.id)
                        ? "bg-red-100 text-red-700"
                        : "text-red-600 hover:bg-red-50"
                    }`}
                    title={imagesToDelete.has(discountImage.id) ? "Cancelar eliminación" : "Marcar para eliminar"}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {discountImage.subtitle && (
                  <p className="text-sm text-gray-500">{discountImage.subtitle}</p>
                )}
              </div>
            </div>
          ) : !pendingDiscountFile ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hay imagen de descuentos</p>
            </div>
          ) : null}
        </section>
      </div>

      {/* Botón Guardar */}
      {hasChanges() && (
        <div className="sticky bottom-10 bg-white border border-gray-200 p-6 mt-10 rounded-[14px] shadow-lg">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="text-sm text-gray-600">
              {imagesToDelete.size > 0 && (
                <span className="mr-4">{imagesToDelete.size} imagen(es) marcada(s) para eliminar</span>
              )}
              {(pendingHeroFiles.length > 0 || pendingInfoFile || pendingDiscountFile) && (
                <span>Imagen(es) pendiente(s) de subir</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setImagesToDelete(new Set());
                  setPendingHeroFiles([]);
                  setPendingInfoFile(null);
                  setPendingDiscountFile(null);
                  setError("");
                }}
                className="px-4 py-2 cursor-pointer border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 cursor-pointer text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader message="" fullScreen={false} />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de preview ampliado */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/50"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImage}
              alt="Preview ampliado"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
