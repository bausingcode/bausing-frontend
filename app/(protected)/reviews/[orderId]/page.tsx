"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loader from "@/components/Loader";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserOrder,
  getOrderReviews,
  createReview,
  type Order,
  type OrderItem,
  type ProductReview,
} from "@/lib/api";
import {
  ArrowLeft,
  Star,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function ReviewPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [existingReviews, setExistingReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Estado para cada item de la orden
  const [reviews, setReviews] = useState<Record<string, {
    rating: number;
    title: string;
    comment: string;
  }>>({});

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (orderId && isAuthenticated) {
      loadOrderData();
    }
  }, [orderId, isAuthenticated]);

  const loadOrderData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar orden
      const orderData = await getUserOrder(orderId);
      if (!orderData) {
        setError("Orden no encontrada");
        return;
      }

      // Verificar que el estado sea "finalizado"
      const normalizedStatus = orderData.status === "pending" || orderData.status === "pendiente de entrega"
        ? "pendiente de entrega"
        : orderData.status;

      if (normalizedStatus !== "finalizado") {
        setError(`Solo se pueden crear reseñas para órdenes con estado "finalizado". Estado actual: ${normalizedStatus}`);
        return;
      }

      setOrder(orderData);

      // Cargar reseñas existentes
      try {
        const reviewsData = await getOrderReviews(orderId);
        setExistingReviews(reviewsData.reviews);

        // Inicializar reviews con datos existentes o valores por defecto
        const reviewsMap: Record<string, {
          rating: number;
          title: string;
          comment: string;
        }> = {};

        orderData.items.forEach((item) => {
          const existingReview = reviewsData.reviews.find(
            (r) => r.order_item_id === item.id
          );
          if (existingReview) {
            reviewsMap[item.id] = {
              rating: existingReview.rating,
              title: existingReview.title || "",
              comment: existingReview.comment || "",
            };
          } else {
            reviewsMap[item.id] = {
              rating: 0,
              title: "",
              comment: "",
            };
          }
        });

        setReviews(reviewsMap);
      } catch (err: any) {
        // Si no hay reseñas, inicializar con valores por defecto
        const reviewsMap: Record<string, {
          rating: number;
          title: string;
          comment: string;
        }> = {};
        orderData.items.forEach((item) => {
          reviewsMap[item.id] = {
            rating: 0,
            title: "",
            comment: "",
          };
        });
        setReviews(reviewsMap);
      }
    } catch (err: any) {
      console.error("Error loading order:", err);
      setError(err.message || "Error al cargar la orden");
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (itemId: string, rating: number) => {
    setReviews((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        rating,
      },
    }));
  };

  const handleInputChange = (itemId: string, field: "title" | "comment", value: string) => {
    setReviews((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (item: OrderItem) => {
    const review = reviews[item.id];
    if (!review || review.rating === 0) {
      setError("Por favor, selecciona una calificación (1-5 estrellas)");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Verificar si ya existe una reseña
      const existingReview = existingReviews.find((r) => r.order_item_id === item.id);
      if (existingReview) {
        setError("Ya existe una reseña para este producto. No se puede modificar.");
        return;
      }

      await createReview({
        order_id: orderId,
        order_item_id: item.id,
        product_id: item.product_id,
        product_variant_id: item.variant_id,
        rating: review.rating,
        title: review.title || undefined,
        comment: review.comment || undefined,
      });

      // Recargar reseñas
      const reviewsData = await getOrderReviews(orderId);
      setExistingReviews(reviewsData.reviews);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error creating review:", err);
      setError(err.message || "Error al crear la reseña");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <Loader fullScreen message="Cargando..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error && !order) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 pt-20 pb-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Error</h1>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => router.push("/usuario?section=pedidos")}
                className="inline-flex items-center gap-2 bg-[#00C1A7] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#00a892] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a mis pedidos
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!order) {
    return <Loader fullScreen message="Cargando orden..." />;
  }

  const itemsToReview = order.items.filter((item) => {
    const existingReview = existingReviews.find((r) => r.order_item_id === item.id);
    return !existingReview;
  });

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <button
              onClick={() => router.push("/usuario?section=pedidos")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a mis pedidos
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Dejar reseña - Pedido #{order.order_number}
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              Comparte tu experiencia con los productos que recibiste
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Reseña creada exitosamente
            </div>
          )}

          {itemsToReview.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Todas las reseñas completadas
              </h2>
              <p className="text-gray-600 mb-4">
                Ya has dejado reseñas para todos los productos de esta orden.
              </p>
              <button
                onClick={() => router.push("/usuario?section=pedidos")}
                className="inline-flex items-center gap-2 bg-[#00C1A7] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#00a892] transition-colors"
              >
                Volver a mis pedidos
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {order.items.map((item) => {
                const existingReview = existingReviews.find((r) => r.order_item_id === item.id);
                const review = reviews[item.id] || { rating: 0, title: "", comment: "" };

                if (existingReview) {
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                    >
                      <div className="flex gap-4 mb-4">
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-20 h-20 object-cover rounded-lg shrink-0"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {item.product_name}
                          </h3>
                          <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-700">Tu reseña:</span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-5 h-5 ${
                                  i < existingReview.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {existingReview.title && (
                          <p className="font-semibold text-gray-900 mb-1">{existingReview.title}</p>
                        )}
                        {existingReview.comment && (
                          <p className="text-sm text-gray-600">{existingReview.comment}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Reseña verificada - Compra verificada
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex gap-4 mb-4">
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-20 h-20 object-cover rounded-lg shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {item.product_name}
                        </h3>
                        <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Calificación *
                        </label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => handleRatingChange(item.id, rating)}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`w-8 h-8 ${
                                  review.rating >= rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                          {review.rating > 0 && (
                            <span className="text-sm text-gray-600 ml-2">
                              {review.rating} de 5 estrellas
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Título (opcional)
                        </label>
                        <input
                          type="text"
                          value={review.title}
                          onChange={(e) => handleInputChange(item.id, "title", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-transparent placeholder:text-gray-400"
                          placeholder="Ej: Excelente producto"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Comentario (opcional)
                        </label>
                        <textarea
                          value={review.comment}
                          onChange={(e) => handleInputChange(item.id, "comment", e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-transparent placeholder:text-gray-400"
                          placeholder="Comparte tu experiencia con este producto..."
                        />
                      </div>

                      <button
                        onClick={() => handleSubmit(item)}
                        disabled={saving || review.rating === 0}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#00C1A7] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#00a892] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? "Guardando..." : "Publicar reseña"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
