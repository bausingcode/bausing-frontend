"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import Loader from "@/components/Loader";
import Spinner from "@/components/Spinner";
import { 
  fetchBlogPosts, 
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  uploadBlogPostImageFile,
  deleteBlogPostImage,
  BlogPost,
  BlogPostImage
} from "@/lib/api";
import wsrvLoader from "@/lib/wsrvLoader";
import { 
  FileText, 
  Upload, 
  X, 
  Edit2, 
  Trash2, 
  Check, 
  AlertCircle,
  Plus,
  Image as ImageIcon,
  Maximize2,
  Save
} from "lucide-react";

// Función para formatear la fecha
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

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Estados para el modal de crear/editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image_url: "",
    meta_title: "",
    meta_description: "",
    status: "draft" as "draft" | "published",
    published_at: "",
    keywords: [] as string[],
  });
  
  // Estados para imágenes
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [postImages, setPostImages] = useState<BlogPostImage[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<Set<string>>(new Set());
  
  // Estado para preview ampliado
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Estado para keyword input
  const [keywordInput, setKeywordInput] = useState("");

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchBlogPosts({ include_keywords: true, include_images: true });
      setPosts(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar los posts");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      // Auto-llenar meta título y meta descripción si no existen
      const metaTitle = post.meta_title || post.title || "";
      const metaDesc = post.meta_description || post.excerpt || (post.content ? post.content.substring(0, 160) : "");
      
      setFormData({
        title: post.title || "",
        slug: post.slug || "",
        excerpt: post.excerpt || "",
        content: post.content || "",
        cover_image_url: post.cover_image_url || "",
        meta_title: metaTitle,
        meta_description: metaDesc,
        status: post.status || "draft",
        published_at: post.published_at ? new Date(post.published_at).toISOString().slice(0, 16) : "",
        keywords: post.keywords?.map(k => k.keyword) || [],
      });
      setPostImages(post.images || []);
      setCoverImageFile(null);
      setPendingImages([]);
      setImagesToDelete(new Set());
    } else {
      setEditingPost(null);
      setFormData({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        cover_image_url: "",
        meta_title: "",
        meta_description: "",
        status: "draft",
        published_at: "",
        keywords: [],
      });
      setPostImages([]);
      setCoverImageFile(null);
      setPendingImages([]);
      setImagesToDelete(new Set());
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPost(null);
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      cover_image_url: "",
      meta_title: "",
      meta_description: "",
      status: "draft",
      published_at: "",
      keywords: [],
    });
    setPostImages([]);
    setCoverImageFile(null);
    setPendingImages([]);
    setImagesToDelete(new Set());
    setKeywordInput("");
  };

  const handleFileSelect = (file: File, type: 'cover' | 'content') => {
    if (!file.type.startsWith('image/')) {
      setError("Por favor selecciona un archivo de imagen válido");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError("El archivo es demasiado grande. Máximo: 5MB");
      return;
    }
    
    setError("");
    
    if (type === 'cover') {
      setCoverImageFile(file);
    } else {
      setPendingImages([...pendingImages, file]);
    }
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      let postId = editingPost?.id;

      // Si es un nuevo post, crearlo primero
      if (!postId) {
        const newPost = await createBlogPost({
          title: formData.title,
          // No enviar slug, el backend lo genera automáticamente
          excerpt: formData.excerpt || undefined,
          content: formData.content || undefined,
          cover_image_url: formData.cover_image_url || undefined,
          meta_title: formData.meta_title || undefined,
          meta_description: formData.meta_description || undefined,
          status: formData.status,
          published_at: formData.published_at || undefined,
          keywords: formData.keywords,
          images: [],
        });
        postId = newPost.id;
      } else {
        // Actualizar post existente - solo actualizar slug si el título cambió
        await updateBlogPost(postId, {
          title: formData.title,
          // No enviar slug, el backend lo genera automáticamente si cambia el título
          excerpt: formData.excerpt || undefined,
          content: formData.content || undefined,
          cover_image_url: formData.cover_image_url || undefined,
          meta_title: formData.meta_title || undefined,
          meta_description: formData.meta_description || undefined,
          status: formData.status,
          published_at: formData.published_at || undefined,
          keywords: formData.keywords,
        });
      }

      // Subir imagen de portada si hay una nueva
      if (coverImageFile && postId) {
        const coverImage = await uploadBlogPostImageFile(coverImageFile, postId);
        await updateBlogPost(postId, {
          cover_image_url: coverImage.image_url,
        });
      }

      // Eliminar imágenes marcadas para eliminar
      for (const imageId of imagesToDelete) {
        try {
          await deleteBlogPostImage(imageId);
        } catch (err: any) {
          console.error(`Error al eliminar imagen ${imageId}:`, err);
        }
      }

      // Subir nuevas imágenes de contenido
      for (const file of pendingImages) {
        if (postId) {
          await uploadBlogPostImageFile(file, postId);
        }
      }

      setSuccess("Post guardado correctamente");
      await loadPosts();
      handleCloseModal();
    } catch (err: any) {
      setError(err.message || "Error al guardar el post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este post?")) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await deleteBlogPost(postId);
      setSuccess("Post eliminado correctamente");
      await loadPosts();
    } catch (err: any) {
      setError(err.message || "Error al eliminar el post");
    } finally {
      setSubmitting(false);
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

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, keywordInput.trim()],
      });
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter(k => k !== keyword),
    });
  };

  if (loading) {
    return (
      <div>
        <PageHeader 
          title="Blog" 
          description="Administra los artículos del blog"
        />
        <Loader message="Cargando posts..." fullScreen={false} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Blog" 
        description="Administra los artículos del blog"
      />

      {/* Mensajes de éxito/error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <Check className="w-5 h-5" />
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="ml-auto cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Botón crear nuevo */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Post</span>
        </button>
      </div>

      {/* Lista de posts */}
      {posts.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-white">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No hay posts del blog</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-gray-200 rounded-[14px] p-6 relative"
            >
              <div className="absolute top-6 right-6 flex items-center gap-3">
                <button
                  onClick={() => handleOpenModal(post)}
                  className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="pr-20">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    post.status === 'published' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {post.status === 'published' ? 'Publicado' : 'Borrador'}
                  </span>
                </div>
                
                {post.excerpt && (
                  <p className="text-sm text-gray-600 mb-3">{post.excerpt}</p>
                )}
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>URL: {post.slug}</span>
                  <span>Vistas: {post.view_count}</span>
                  {post.published_at && (
                    <span>Publicado: {formatDate(post.published_at)}</span>
                  )}
                  <span>Creado: {formatDate(post.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de crear/editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/50">
          <div className="bg-white rounded-[14px] max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingPost ? "Editar Post" : "Nuevo Post"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setFormData({ 
                      ...formData, 
                      title: newTitle,
                      meta_title: newTitle // Auto-llenar meta título con el título
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Título del post"
                />
              </div>


              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Extracto
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => {
                    const newExcerpt = e.target.value;
                    // Auto-llenar meta descripción con extracto, o parte del contenido si no hay extracto
                    const metaDesc = newExcerpt || (formData.content ? formData.content.substring(0, 160) : '');
                    setFormData({ 
                      ...formData, 
                      excerpt: newExcerpt,
                      meta_description: metaDesc
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  rows={3}
                  placeholder="Breve descripción del post"
                />
              </div>

              {/* Contenido */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenido
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => {
                    const newContent = e.target.value;
                    // Si no hay extracto, usar parte del contenido para meta descripción
                    const metaDesc = formData.excerpt || (newContent ? newContent.substring(0, 160) : '');
                    setFormData({ 
                      ...formData, 
                      content: newContent,
                      meta_description: metaDesc
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  rows={10}
                  placeholder="Contenido del post"
                />
              </div>

              {/* Imagen de portada */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen de Portada
                </label>
                <input
                  type="file"
                  id="cover-image-input"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file, 'cover');
                    e.target.value = '';
                  }}
                />
                <label
                  htmlFor="cover-image-input"
                  className="px-3 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors cursor-pointer bg-blue-600 text-white hover:bg-blue-700 w-fit"
                >
                  <Upload className="w-4 h-4" />
                  <span>Subir Imagen de Portada</span>
                </label>
                
                {(coverImageFile || formData.cover_image_url) && (
                  <div className="mt-3 relative group">
                    <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={coverImageFile ? URL.createObjectURL(coverImageFile) : formData.cover_image_url}
                        alt="Portada"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src && !coverImageFile) {
                            target.src = wsrvLoader({ src: formData.cover_image_url, width: 800 });
                          }
                        }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        setCoverImageFile(null);
                        setFormData({ ...formData, cover_image_url: "" });
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Imágenes de contenido */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imágenes de Contenido
                </label>
                <input
                  type="file"
                  id="content-images-input"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file, 'content');
                    e.target.value = '';
                  }}
                />
                <label
                  htmlFor="content-images-input"
                  className="px-3 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors cursor-pointer bg-blue-600 text-white hover:bg-blue-700 w-fit mb-3"
                >
                  <Upload className="w-4 h-4" />
                  <span>Agregar Imagen</span>
                </label>

                {/* Previews de imágenes pendientes */}
                {pendingImages.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-blue-900">
                        {pendingImages.length} imagen(es) pendiente(s) de subir
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {pendingImages.map((file, index) => (
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
                              const newFiles = pendingImages.filter((_, i) => i !== index);
                              setPendingImages(newFiles);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Imágenes existentes */}
                {postImages.filter(img => !imagesToDelete.has(img.id)).length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {postImages.filter(img => !imagesToDelete.has(img.id)).map((image) => {
                      const isMarkedForDelete = imagesToDelete.has(image.id);
                      return (
                        <div
                          key={image.id}
                          className={`border rounded-lg overflow-hidden group relative ${
                            isMarkedForDelete ? "border-red-300 opacity-50" : "border-gray-200"
                          }`}
                        >
                          <div className="aspect-square bg-gray-100 relative">
                            <img
                              src={image.image_url}
                              alt={image.alt_text || "Imagen"}
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
                                <span className="text-red-700 font-semibold bg-white px-2 py-1 rounded text-xs">Se eliminará</span>
                              </div>
                            )}
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setPreviewImage(image.image_url)}
                                className="p-1.5 rounded-full cursor-pointer bg-blue-500 text-white hover:bg-blue-600"
                                title="Visualizar imagen"
                              >
                                <Maximize2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="p-2 bg-white">
                            <button
                              onClick={() => toggleImageDelete(image.id)}
                              className={`w-full p-1.5 rounded transition-colors cursor-pointer text-xs ${
                                isMarkedForDelete
                                  ? "bg-red-100 text-red-700"
                                  : "text-red-600 hover:bg-red-50"
                              }`}
                            >
                              {isMarkedForDelete ? "Cancelar" : "Eliminar"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addKeyword();
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Agregar keyword"
                  />
                  <button
                    onClick={addKeyword}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {formData.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
                      >
                        {keyword}
                        <button
                          onClick={() => removeKeyword(keyword)}
                          className="text-blue-700 hover:text-blue-900 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as "draft" | "published" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="draft">Borrador</option>
                  <option value="published">Publicado</option>
                </select>
              </div>

              {/* Fecha de publicación */}
              {formData.status === 'published' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Publicación
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.published_at}
                    onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex items-center justify-end gap-3 z-10">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={submitting || !formData.title}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Spinner size="sm" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar</span>
                  </>
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
  );
}

