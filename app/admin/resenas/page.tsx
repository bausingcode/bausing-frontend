"use client";

import { useState, useEffect, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { Search, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";
import { getAllReviews, updateReviewStatus, ProductReview } from "@/lib/api";

export default function Resenas() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 1,
    has_prev: false,
    has_next: false,
  });

  const loadReviews = async (pageNum: number) => {
    try {
      setIsLoading(true);
      const response = await getAllReviews({ page: pageNum, per_page: perPage });
      setReviews(response.reviews);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews(page);
  }, [page]);

  // Filter reviews based on search query (client-side filtering)
  const filteredReviews = useMemo(() => {
    if (!searchQuery.trim()) {
      return reviews;
    }

    const query = searchQuery.toLowerCase();
    return reviews.filter(
      (review) =>
        review.user_name?.toLowerCase().includes(query) ||
        review.title?.toLowerCase().includes(query) ||
        review.comment?.toLowerCase().includes(query) ||
        review.status.toLowerCase().includes(query)
    );
  }, [reviews, searchQuery]);

  const handleToggleStatus = async (reviewId: string, currentStatus: string) => {
    try {
      setUpdatingIds((prev) => new Set(prev).add(reviewId));
      const newStatus = currentStatus === 'published' ? 'hidden' : 'published';
      await updateReviewStatus(reviewId, newStatus as 'published' | 'hidden');
      
      // Recargar lista de reseñas en la página actual
      await loadReviews(page);
    } catch (error: any) {
      alert(`Error al actualizar reseña: ${error.message}`);
    } finally {
      setUpdatingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(reviewId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={i < rating ? "text-yellow-400" : "text-gray-300"}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <PageHeader 
        title="Reseñas" 
        description="Gestiona todas las reseñas de productos" 
      />

      {/* Search Section */}
      <div className="bg-white rounded-[10px] border border-gray-200 p-4 mb-6" style={{ borderRadius: '14px' }}>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por usuario, título, comentario o estado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            />
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="bg-white rounded-[10px] border border-gray-200 p-8 text-center" style={{ borderRadius: '14px' }}>
          <p className="text-gray-500">Cargando reseñas...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white rounded-[10px] border border-gray-200 p-8 text-center" style={{ borderRadius: '14px' }}>
          <p className="text-gray-500">
            {searchQuery ? "No se encontraron reseñas con ese criterio de búsqueda." : "No hay reseñas registradas."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[10px] border border-gray-200" style={{ borderRadius: '14px' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Usuario</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Rating</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Título</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Comentario</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Fecha</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((review) => (
                  <tr key={review.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {review.user_name || 'Usuario desconocido'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                        <span className="ml-2 text-sm text-gray-600">({review.rating})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {review.title || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                      <div className="truncate" title={review.comment || ''}>
                        {review.comment || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          review.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : review.status === 'hidden'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {review.status === 'published' ? 'Publicada' : review.status === 'hidden' ? 'Oculta' : review.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(review.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(review.id, review.status)}
                        disabled={updatingIds.has(review.id)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-[6px] transition-colors flex items-center gap-2 ${
                          review.status === 'published'
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        } ${updatingIds.has(review.id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {updatingIds.has(review.id) ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            {review.status === 'published' ? 'Ocultando...' : 'Mostrando...'}
                          </>
                        ) : review.status === 'published' ? (
                          <>
                            <EyeOff className="w-4 h-4" />
                            Ocultar
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            Mostrar
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Mostrando {((pagination.page - 1) * pagination.per_page) + 1} a {Math.min(pagination.page * pagination.per_page, pagination.total)} de {pagination.total} reseñas
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.has_prev}
                  className={`px-4 py-2 text-sm font-medium rounded-[6px] transition-colors flex items-center gap-1 ${
                    !pagination.has_prev
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
                <span className="text-sm text-gray-700">
                  Página {pagination.page} de {pagination.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={!pagination.has_next}
                  className={`px-4 py-2 text-sm font-medium rounded-[6px] transition-colors flex items-center gap-1 ${
                    !pagination.has_next
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                  }`}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
