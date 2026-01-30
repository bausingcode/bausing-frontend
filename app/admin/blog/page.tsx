"use client";

import { useState, useEffect, useRef } from "react";
import PageHeader from "@/components/PageHeader";
import Loader from "@/components/Loader";
import Spinner from "@/components/Spinner";
import { 
  fetchBlogPosts, 
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  uploadBlogPostImageFile,
  BlogPost
} from "@/lib/api";
import wsrvLoader from "@/lib/wsrvLoader";
import AutoResizeTextarea from "@/components/AutoResizeTextarea";
import { 
  FileText, 
  X, 
  Edit2, 
  Trash2, 
  Check, 
  AlertCircle,
  Plus,
  Save,
  ImagePlus
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
  // Estado para el modal de eliminar
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
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
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para keyword input
  const [keywordInput, setKeywordInput] = useState("");

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchBlogPosts({ include_keywords: true });
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
      setCoverImageFile(null);
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
      setCoverImageFile(null);
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
    setCoverImageFile(null);
    setKeywordInput("");
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError("Por favor selecciona un archivo de imagen válido");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError("El archivo es demasiado grande. Máximo: 5MB");
      return;
    }
    
    setError("");
    setCoverImageFile(file);
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
    try {
      setSubmitting(true);
      setError("");
      await deleteBlogPost(postId);
      setSuccess("Post eliminado correctamente");
      setPostToDelete(null);
      await loadPosts();
    } catch (err: any) {
      setError(err.message || "Error al eliminar el post");
    } finally {
      setSubmitting(false);
    }
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
                  onClick={() => setPostToDelete(post)}
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

      {/* Modal de eliminar */}
      {postToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-[14px] max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 text-center">Eliminar post</h3>
            <p className="mt-2 text-sm text-gray-600 text-center">
              ¿Estás seguro de que querés eliminar <strong>"{postToDelete.title}"</strong>?
            </p>
            <p className="mt-1 text-sm text-gray-600 text-center">
              Esta acción no se puede deshacer.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => handleDelete(postToDelete.id)}
                disabled={submitting}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Spinner size="sm" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setPostToDelete(null)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de crear/editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
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
              {/* Imagen de portada */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen de Portada
                </label>
                <input
                  ref={coverImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                    e.target.value = '';
                  }}
                />
                {(coverImageFile || formData.cover_image_url) ? (
                  <div className="relative group">
                    <div className="w-full min-h-[180px] max-h-64 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                      <img
                        src={coverImageFile ? URL.createObjectURL(coverImageFile) : formData.cover_image_url}
                        alt="Portada"
                        className="w-full h-full min-h-[180px] max-h-64 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src && !coverImageFile) {
                            target.src = wsrvLoader({ src: formData.cover_image_url, width: 800 });
                          }
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => coverImageInputRef.current?.click()}
                        className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-white/90 text-gray-800 rounded-lg text-sm font-medium hover:bg-white transition-all cursor-pointer"
                      >
                        Cambiar imagen
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCoverImageFile(null);
                          setFormData({ ...formData, cover_image_url: "" });
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-opacity cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => coverImageInputRef.current?.click()}
                    className="flex flex-col items-center justify-center min-h-[160px] rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-blue-600 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                        <ImagePlus className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Arrastrá la imagen o hacé clic para subir</p>
                        <p className="text-xs text-gray-400 mt-0.5">JPG, PNG o WebP. Imagen de portada.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

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
                <AutoResizeTextarea
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
                  minRows={3}
                  placeholder="Breve descripción del post"
                />
              </div>

              {/* Contenido */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenido
                </label>
                <AutoResizeTextarea
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
                  minRows={10}
                  placeholder="Contenido del post"
                />
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

    </div>
  );
}

