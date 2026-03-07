"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import Loader from "@/components/Loader";
import Spinner from "@/components/Spinner";
import { 
  fetchHeroImages, 
  uploadHeroImageFile,
  uploadVideoFile,
  deleteHeroImage,
  updateHeroImage,
  HeroImage,
  getAuthHeaders
} from "@/lib/api";
import wsrvLoader from "@/lib/wsrvLoader";
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

// Función para formatear la fecha de creación
const formatDate = (dateString?: string): string => {
  if (!dateString) return "Fecha no disponible";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return "Fecha no disponible";
  }
};

export default function ImagenesPage() {
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [infoImages, setInfoImages] = useState<HeroImage[]>([]);
  const [discountImage, setDiscountImage] = useState<HeroImage | null>(null);
  const [productBanner, setProductBanner] = useState<HeroImage | null>(null);
  const [localImage, setLocalImage] = useState<HeroImage | null>(null);
  const [videoData, setVideoData] = useState<HeroImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Estados para editar video
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoButtonText, setVideoButtonText] = useState("");
  const [videoButtonLink, setVideoButtonLink] = useState("");
  const [isEditingVideo, setIsEditingVideo] = useState(false);

  // Estados para archivos pendientes de subir
  const [pendingHeroFiles, setPendingHeroFiles] = useState<File[]>([]);
  const [pendingInfoFiles, setPendingInfoFiles] = useState<File[]>([]);
  const [pendingDiscountFile, setPendingDiscountFile] = useState<File | null>(null);
  const [pendingProductFile, setPendingProductFile] = useState<File | null>(null);
  const [pendingLocalFile, setPendingLocalFile] = useState<File | null>(null);
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);
  
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
      
      const [hero, info, discount, product, local, videos] = await Promise.all([
        fetchHeroImages(1),
        fetchHeroImages(2, true),
        fetchHeroImages(3, true),
        fetchHeroImages(4, true),
        fetchHeroImages(5, true),
        fetchHeroImages(6, true),
      ]);

      setHeroImages(hero);
      setInfoImages(info);
      setDiscountImage(discount.length > 0 ? discount[0] : null);
      setProductBanner(product.length > 0 ? product[0] : null);
      setLocalImage(local.length > 0 ? local[0] : null);
      const video = videos.length > 0 ? videos[0] : null;
      setVideoData(video);
      if (video) {
        setVideoTitle(video.title || "");
        setVideoDescription(video.subtitle || "");
        setVideoButtonText(video.cta_text || "");
        setVideoButtonLink(video.cta_link || "");
      } else {
        setVideoTitle("");
        setVideoDescription("");
        setVideoButtonText("");
        setVideoButtonLink("");
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar las imágenes");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file: File, type: 'hero' | 'info' | 'discount' | 'product' | 'local') => {
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
      setPendingInfoFiles([...pendingInfoFiles, file]);
    } else if (type === 'discount') {
      setPendingDiscountFile(file);
    } else if (type === 'product') {
      setPendingProductFile(file);
    } else {
      setPendingLocalFile(file);
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

      // Eliminar imágenes marcadas (incluyendo videos del storage)
      for (const imageId of imagesToDelete) {
        try {
          // Buscar la imagen/video para obtener su URL y eliminar del storage si es necesario
          const allImages = [...heroImages, ...infoImages, discountImage, productBanner, localImage, videoData].filter((img): img is HeroImage => img !== null);
          const imageToDelete = allImages.find(img => img.id === imageId);
          await deleteHeroImage(imageId, imageToDelete?.image_url);
        } catch (err: any) {
          console.error(`Error al eliminar imagen ${imageId}:`, err);
        }
      }

      // Subir nuevas imágenes
      for (const file of pendingHeroFiles) {
        await uploadHeroImageFile(file, 1);
      }
      setPendingHeroFiles([]);

      for (const file of pendingInfoFiles) {
        await uploadHeroImageFile(file, 2);
      }
      setPendingInfoFiles([]);

      if (pendingDiscountFile) {
        await uploadHeroImageFile(pendingDiscountFile, 3);
        setPendingDiscountFile(null);
      }

      if (pendingProductFile) {
        // Desactivar el banner anterior si existe
        if (productBanner && !imagesToDelete.has(productBanner.id)) {
          try {
            await updateHeroImage(productBanner.id, { is_active: false });
          } catch (err: any) {
            console.error(`Error al desactivar banner anterior:`, err);
          }
        }
        await uploadHeroImageFile(pendingProductFile, 4);
        setPendingProductFile(null);
      }

      if (pendingLocalFile) {
        // Desactivar la imagen anterior si existe
        if (localImage && !imagesToDelete.has(localImage.id)) {
          try {
            await updateHeroImage(localImage.id, { is_active: false });
          } catch (err: any) {
            console.error(`Error al desactivar imagen anterior:`, err);
          }
        }
        await uploadHeroImageFile(pendingLocalFile, 5);
        setPendingLocalFile(null);
      }

      // Subir/actualizar video
      if (pendingVideoFile) {
        // Desactivar el video anterior si existe
        if (videoData && !imagesToDelete.has(videoData.id)) {
          try {
            await updateHeroImage(videoData.id, { is_active: false });
          } catch (err: any) {
            console.error(`Error al desactivar video anterior:`, err);
          }
        }
        // Subir nuevo video
        const uploadedVideo = await uploadVideoFile(pendingVideoFile, 6);
        // Actualizar con título, descripción y botón si se proporcionaron
        if (videoTitle.trim() || videoDescription.trim() || videoButtonText.trim() || videoButtonLink.trim()) {
          await updateHeroImage(uploadedVideo.id, {
            title: videoTitle.trim() || undefined,
            subtitle: videoDescription.trim() || undefined,
            cta_text: videoButtonText.trim() || undefined,
            cta_link: videoButtonLink.trim() || undefined,
          });
        }
        setPendingVideoFile(null);
        setIsEditingVideo(false);
      } else if (isEditingVideo && videoData && !imagesToDelete.has(videoData.id)) {
        // Solo actualizar metadatos si no hay archivo nuevo
        const hasChanges = 
          (videoData.title || '') !== videoTitle.trim() ||
          (videoData.subtitle || '') !== videoDescription.trim() ||
          (videoData.cta_text || '') !== videoButtonText.trim() ||
          (videoData.cta_link || '') !== videoButtonLink.trim();
        
        if (hasChanges) {
          await updateHeroImage(videoData.id, {
            title: videoTitle.trim() || undefined,
            subtitle: videoDescription.trim() || undefined,
            cta_text: videoButtonText.trim() || undefined,
            cta_link: videoButtonLink.trim() || undefined,
          });
        }
        setIsEditingVideo(false);
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
    return imagesToDelete.size > 0 || pendingHeroFiles.length > 0 || pendingInfoFiles.length > 0 || pendingDiscountFile || pendingProductFile || pendingLocalFile || pendingVideoFile || isEditingVideo;
  };




  if (loading) {
    return (
      <div>
        <PageHeader 
          title="Gestión de Imágenes" 
          description="Administra las imágenes del encabezado, informativas, de descuentos y banner de productos"
        />
        <Loader message="Cargando imágenes..." fullScreen={false} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Gestión de Imágenes" 
        description="Administra las imágenes del encabezado, informativas, de descuentos y banner de productos"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mensajes de éxito/error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError("")} className="ml-auto cursor-pointer hover:bg-red-100 rounded p-1 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-lg flex items-center gap-3 text-green-700">
            <Check className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{success}</span>
            <button onClick={() => setSuccess("")} className="ml-auto cursor-pointer hover:bg-green-100 rounded p-1 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="space-y-6">
        {/* Sección: Imágenes de Encabezado */}
        <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
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
                className={`px-3 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
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
          </div>
          
          <div className="p-6">
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
                    <div className="bg-gray-100 relative" style={{ aspectRatio: '1920/600', maxHeight: '150px' }}>
                      <img
                        src={image.image_url}
                        alt={image.title || "Hero image"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback a wsrvLoader si la imagen directa falla
                          const target = e.target as HTMLImageElement;
                          if (target.src !== wsrvLoader({ src: image.image_url, width: 400 })) {
                            target.src = wsrvLoader({ src: image.image_url, width: 400 });
                          }
                        }}
                      />
                      {isMarkedForDelete && (
                        <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                          <span className="text-red-700 font-semibold bg-white px-3 py-1 rounded">Se eliminará</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setPreviewImage(image.image_url)}
                          className="p-2 rounded-full cursor-pointer bg-blue-500 text-white hover:bg-blue-600"
                          title="Visualizar imagen"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-3 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {image.title || formatDate(image.created_at)}
                        </h3>
                        <button
                          onClick={() => toggleImageDelete(image.id)}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
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
            <div className="mt-4 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg inline-block">
              {heroImages.filter(img => !imagesToDelete.has(img.id)).length + pendingHeroFiles.length} de {MAX_HERO_IMAGES} imágenes
            </div>
          )}
          </div>
        </section>

        {/* Sección: Imagen Informativa */}
        <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Imagen Informativa (Carousel)
                </h2>
                <p className="text-sm text-gray-600">
                  Múltiples imágenes para carousel. Recomendado: 1650x350px, formato JPG/PNG
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
                className="px-3 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
              >
                <Upload className="w-4 h-4" />
                <span>Agregar</span>
              </label>
            </div>
          </div>
          </div>
          
          <div className="p-6">
          {/* Preview de imágenes pendientes */}
          {pendingInfoFiles.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-blue-900">
                  {pendingInfoFiles.length} imagen(es) pendiente(s) de subir
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {pendingInfoFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div 
                      className="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ aspectRatio: '1650/350' }}
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
                        const newFiles = pendingInfoFiles.filter((_, i) => i !== index);
                        setPendingInfoFiles(newFiles);
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

          {/* Lista de imágenes existentes */}
          {infoImages.filter(img => !imagesToDelete.has(img.id)).length > 0 || pendingInfoFiles.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {infoImages.filter(img => !imagesToDelete.has(img.id)).map((image) => {
                const isMarkedForDelete = imagesToDelete.has(image.id);
                return (
                  <div
                    key={image.id}
                    className={`border rounded-lg overflow-hidden group relative ${
                      isMarkedForDelete ? "border-red-300 opacity-50" : "border-gray-200"
                    }`}
                  >
                    <div className="bg-gray-100 relative" style={{ aspectRatio: '1650/350', maxHeight: '150px' }}>
                      <img
                        src={image.image_url}
                        alt={image.title || "Imagen informativa"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== wsrvLoader({ src: image.image_url, width: 400 })) {
                            target.src = wsrvLoader({ src: image.image_url, width: 400 });
                          }
                        }}
                      />
                      {isMarkedForDelete && (
                        <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                          <span className="text-red-700 font-semibold bg-white px-3 py-1 rounded">Se eliminará</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setPreviewImage(image.image_url)}
                          className="p-2 rounded-full cursor-pointer bg-blue-500 text-white hover:bg-blue-600"
                          title="Visualizar imagen"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-3 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {image.title || formatDate(image.created_at)}
                        </h3>
                        <button
                          onClick={() => toggleImageDelete(image.id)}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
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
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hay imágenes informativas</p>
            </div>
          )}
          </div>
        </section>

        {/* Sección: Imagen de Descuentos */}
        <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Imagen de Descuentos
                </h2>
                <p className="text-sm text-gray-600">
                  Una sola imagen. Se reemplazará la actual si existe. Recomendado: 300x400px, formato JPG/PNG
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
                className="px-3 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
              >
                <Upload className="w-4 h-4" />
                <span>Agregar</span>
              </label>
            </div>
          </div>
          </div>
          
          <div className="p-6">
          {/* Preview de imagen pendiente */}
          {pendingDiscountFile && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
              <div className="flex items-center justify-between flex-1">
                <span className="text-sm font-medium text-blue-900">Nueva imagen pendiente de subir</span>
                <button
                  onClick={() => setPendingDiscountFile(null)}
                  className="text-blue-600 hover:text-blue-800 cursor-pointer"
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
              <div className="bg-gray-100 relative flex items-center justify-center" style={{ aspectRatio: '300/400', maxHeight: '150px', maxWidth: '112px' }}>
                <img
                  src={discountImage.image_url}
                  alt={discountImage.title || "Imagen de descuentos"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback a wsrvLoader si la imagen directa falla
                    const target = e.target as HTMLImageElement;
                    if (target.src !== wsrvLoader({ src: discountImage.image_url, width: 300 })) {
                      target.src = wsrvLoader({ src: discountImage.image_url, width: 300 });
                    }
                  }}
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
                    {discountImage.title || formatDate(discountImage.created_at)}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewImage(discountImage.image_url)}
                      className="p-1.5 rounded transition-colors cursor-pointer text-blue-600 hover:bg-blue-50"
                      title="Visualizar imagen"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleImageDelete(discountImage.id)}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        imagesToDelete.has(discountImage.id)
                          ? "bg-red-100 text-red-700"
                          : "text-red-600 hover:bg-red-50"
                      }`}
                      title={imagesToDelete.has(discountImage.id) ? "Cancelar eliminación" : "Marcar para eliminar"}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
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
          </div>
        </section>

        {/* Sección: Banner de Productos */}
        <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Banner de Productos
                </h2>
              <p className="text-sm text-gray-600">
                Una sola imagen. Se reemplazará la actual si existe. Se muestra debajo de las características en la página de productos. Recomendado: 1200x200px, formato JPG/PNG
              </p>
            </div>
            <div>
              <input
                type="file"
                id="product-file-input"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, 'product');
                  e.target.value = '';
                }}
              />
              <label
                htmlFor="product-file-input"
                className="px-3 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
              >
                <Upload className="w-4 h-4" />
                <span>Agregar</span>
              </label>
            </div>
          </div>
          </div>
          
          <div className="p-6">
          {/* Preview de imagen pendiente */}
          {pendingProductFile && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
              <div className="flex items-center justify-between flex-1">
                <span className="text-sm font-medium text-blue-900">Nueva imagen pendiente de subir</span>
                <button
                  onClick={() => setPendingProductFile(null)}
                  className="text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div 
                className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setPreviewImage(URL.createObjectURL(pendingProductFile))}
              >
                <img
                  src={URL.createObjectURL(pendingProductFile)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {productBanner && !imagesToDelete.has(productBanner.id) ? (
            <div className={`border rounded-lg overflow-hidden ${
              imagesToDelete.has(productBanner.id) ? "border-red-300 opacity-50" : "border-gray-200"
            }`}>
              <div className="bg-gray-100 relative flex items-center justify-center" style={{ aspectRatio: '1200/200', maxHeight: '150px' }}>
                <img
                  src={productBanner.image_url}
                  alt={productBanner.title || "Banner de productos"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback a wsrvLoader si la imagen directa falla
                    const target = e.target as HTMLImageElement;
                    if (target.src !== wsrvLoader({ src: productBanner.image_url, width: 400 })) {
                      target.src = wsrvLoader({ src: productBanner.image_url, width: 400 });
                    }
                  }}
                />
                {imagesToDelete.has(productBanner.id) && (
                  <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                    <span className="text-red-700 font-semibold bg-white px-3 py-1 rounded">Se eliminará</span>
                  </div>
                )}
              </div>
              <div className="p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">
                    {productBanner.title || formatDate(productBanner.created_at)}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewImage(productBanner.image_url)}
                      className="p-1.5 rounded transition-colors cursor-pointer text-blue-600 hover:bg-blue-50"
                      title="Visualizar imagen"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleImageDelete(productBanner.id)}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        imagesToDelete.has(productBanner.id)
                          ? "bg-red-100 text-red-700"
                          : "text-red-600 hover:bg-red-50"
                      }`}
                      title={imagesToDelete.has(productBanner.id) ? "Cancelar eliminación" : "Marcar para eliminar"}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {productBanner.subtitle && (
                  <p className="text-sm text-gray-500">{productBanner.subtitle}</p>
                )}
              </div>
            </div>
          ) : !pendingProductFile ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hay banner de productos</p>
            </div>
          ) : null}
          </div>
        </section>

        {/* Sección: Imagen de Página Local */}
        <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Imagen de Página Local
                </h2>
              <p className="text-sm text-gray-600">
                Una sola imagen. Se reemplazará la actual si existe. Se muestra en la página /local. Recomendado: 1200x600px, formato JPG/PNG
              </p>
            </div>
            <div>
              <input
                type="file"
                id="local-file-input"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, 'local');
                  e.target.value = '';
                }}
              />
              <label
                htmlFor="local-file-input"
                className="px-3 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
              >
                <Upload className="w-4 h-4" />
                <span>Agregar</span>
              </label>
            </div>
          </div>
          </div>
          
          <div className="p-6">
          {/* Preview de imagen pendiente */}
          {pendingLocalFile && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
              <div className="flex items-center justify-between flex-1">
                <span className="text-sm font-medium text-blue-900">Nueva imagen pendiente de subir</span>
                <button
                  onClick={() => setPendingLocalFile(null)}
                  className="text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div 
                className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setPreviewImage(URL.createObjectURL(pendingLocalFile))}
              >
                <img
                  src={URL.createObjectURL(pendingLocalFile)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {localImage && !imagesToDelete.has(localImage.id) ? (
            <div className={`border rounded-lg overflow-hidden ${
              imagesToDelete.has(localImage.id) ? "border-red-300 opacity-50" : "border-gray-200"
            }`}>
              <div className="bg-gray-100 relative flex items-center justify-center" style={{ aspectRatio: '1200/600', maxHeight: '150px' }}>
                <img
                  src={localImage.image_url}
                  alt={localImage.title || "Imagen de página local"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback a wsrvLoader si la imagen directa falla
                    const target = e.target as HTMLImageElement;
                    if (target.src !== wsrvLoader({ src: localImage.image_url, width: 400 })) {
                      target.src = wsrvLoader({ src: localImage.image_url, width: 400 });
                    }
                  }}
                />
                {imagesToDelete.has(localImage.id) && (
                  <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                    <span className="text-red-700 font-semibold bg-white px-3 py-1 rounded">Se eliminará</span>
                  </div>
                )}
              </div>
              <div className="p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">
                    {localImage.title || formatDate(localImage.created_at)}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewImage(localImage.image_url)}
                      className="p-1.5 rounded transition-colors cursor-pointer text-blue-600 hover:bg-blue-50"
                      title="Visualizar imagen"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleImageDelete(localImage.id)}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        imagesToDelete.has(localImage.id)
                          ? "bg-red-100 text-red-700"
                          : "text-red-600 hover:bg-red-50"
                      }`}
                      title={imagesToDelete.has(localImage.id) ? "Cancelar eliminación" : "Marcar para eliminar"}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {localImage.subtitle && (
                  <p className="text-sm text-gray-500">{localImage.subtitle}</p>
                )}
              </div>
            </div>
          ) : !pendingLocalFile ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hay imagen de página local</p>
            </div>
          ) : null}
          </div>
        </section>

        {/* Sección: Video */}
        <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Video del Home
                </h2>
                <p className="text-sm text-gray-600">
                  Video que se muestra encima de la sección "Nuestros Colchones". Resolución recomendada: 1280x720px (16:9)
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!isEditingVideo && (
                  <button
                    onClick={() => setIsEditingVideo(true)}
                    className="px-3 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>{videoData ? "Editar" : "Agregar"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {isEditingVideo ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video *
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    id="video-file-input"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 100 * 1024 * 1024) {
                          setError("El archivo de video es demasiado grande. Máximo: 100MB");
                          return;
                        }
                        setPendingVideoFile(file);
                        setError("");
                      }
                      e.target.value = '';
                    }}
                  />
                  <label
                    htmlFor="video-file-input"
                    className="block w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    {pendingVideoFile ? (
                      <span className="text-sm font-medium text-blue-600">{pendingVideoFile.name}</span>
                    ) : (
                      <span className="text-sm">Seleccionar archivo de video (MP4, WebM, etc.)</span>
                    )}
                  </label>
                  {pendingVideoFile && (
                    <button
                      onClick={() => setPendingVideoFile(null)}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Eliminar archivo seleccionado
                    </button>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Formatos soportados: MP4, WebM, MOV. Máximo: 100MB
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="Título del video"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={videoDescription}
                    onChange={(e) => setVideoDescription(e.target.value)}
                    placeholder="Descripción del video"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Texto del Botón
                  </label>
                  <input
                    type="text"
                    value={videoButtonText}
                    onChange={(e) => setVideoButtonText(e.target.value)}
                    placeholder="Ej: Ver más, Comprar ahora, etc."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link del Botón
                  </label>
                  <input
                    type="text"
                    value={videoButtonLink}
                    onChange={(e) => setVideoButtonLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setIsEditingVideo(false);
                      setPendingVideoFile(null);
                      if (videoData) {
                        setVideoTitle(videoData.title || "");
                        setVideoDescription(videoData.subtitle || "");
                        setVideoButtonText(videoData.cta_text || "");
                        setVideoButtonLink(videoData.cta_link || "");
                      } else {
                        setVideoTitle("");
                        setVideoDescription("");
                        setVideoButtonText("");
                        setVideoButtonLink("");
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <p className="px-4 py-2 text-sm text-gray-600 flex items-center">
                    Los cambios se guardarán al hacer clic en "Guardar Cambios" de la página
                  </p>
                </div>
              </div>
            ) : videoData ? (
              <div className="border rounded-lg overflow-hidden border-gray-200">
                <div className="bg-gray-100 relative flex items-center justify-center" style={{ aspectRatio: '1650/350', maxHeight: '200px' }}>
                  {videoData.image_url.includes('youtube.com') || videoData.image_url.includes('youtu.be') ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <div className="text-white text-center">
                        <p className="text-sm mb-2">Video de YouTube</p>
                        <p className="text-xs text-gray-400 truncate max-w-md">{videoData.image_url}</p>
                      </div>
                    </div>
                  ) : (
                    <video
                      src={videoData.image_url}
                      className="w-full h-full object-cover"
                      controls={false}
                      muted
                    />
                  )}
                  {imagesToDelete.has(videoData.id) && (
                    <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                      <span className="text-red-700 font-semibold bg-white px-3 py-1 rounded">Se eliminará</span>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">
                      {videoData.title || "Video"}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleImageDelete(videoData.id)}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${
                          imagesToDelete.has(videoData.id)
                            ? "bg-red-100 text-red-700"
                            : "text-red-600 hover:bg-red-50"
                        }`}
                        title={imagesToDelete.has(videoData.id) ? "Cancelar eliminación" : "Marcar para eliminar"}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {videoData.subtitle && (
                    <p className="text-sm text-gray-500 mb-2">{videoData.subtitle}</p>
                  )}
                  {videoData.cta_text && videoData.cta_link && (
                    <p className="text-xs text-gray-400">
                      Botón: {videoData.cta_text} → {videoData.cta_link}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No hay video configurado</p>
              </div>
            )}
          </div>
        </section>

        {/* Botón Guardar */}
        {hasChanges() && (
          <div className="sticky bottom-4 mt-6">
            <div className="bg-white border border-gray-200 p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {imagesToDelete.size > 0 && (
                    <span className="mr-4">{imagesToDelete.size} imagen(es) marcada(s) para eliminar</span>
                  )}
                  {(pendingHeroFiles.length > 0 || pendingInfoFiles.length > 0 || pendingDiscountFile || pendingProductFile || pendingLocalFile || pendingVideoFile || isEditingVideo) && (
                    <span>Cambios pendiente(s) de guardar</span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setImagesToDelete(new Set());
                      setPendingHeroFiles([]);
                      setPendingInfoFiles([]);
                      setPendingDiscountFile(null);
                      setPendingProductFile(null);
                      setPendingLocalFile(null);
                      setPendingVideoFile(null);
                      setIsEditingVideo(false);
                      if (videoData) {
                        setVideoTitle(videoData.title || "");
                        setVideoDescription(videoData.subtitle || "");
                        setVideoButtonText(videoData.cta_text || "");
                        setVideoButtonLink(videoData.cta_link || "");
                      }
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
                        <Spinner size="sm" />
                        <span className="text-sm">Guardando...</span>
                      </>
                    ) : (
                      "Guardar Cambios"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Modal de preview ampliado */}
        {previewImage && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/50"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors z-10 cursor-pointer"
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
    </div>
  );
}
