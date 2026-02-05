"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { getUserOrder, type Order } from "@/lib/api";

const statusConfig = {
  purple: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-300",
    iconBg: "bg-purple-500",
  },
  green: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300",
    iconBg: "bg-green-500",
  },
  yellow: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-300",
    iconBg: "bg-yellow-500",
  },
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-300",
    iconBg: "bg-blue-500",
  },
};

// Función helper para normalizar el estado de la orden
// 'pending' se trata igual que 'pendiente de entrega'
const normalizeOrderStatus = (status: string): string => {
  if (status === "pending" || status === "pendiente de entrega") {
    return "pendiente de entrega";
  }
  return status;
};

// Mapeo de estados de orden a información de tracking
const getStatusInfo = (status: string) => {
  const normalizedStatus = normalizeOrderStatus(status);
  const statusLower = normalizedStatus.toLowerCase();
  
  if (statusLower.includes("pendiente de entrega") || statusLower === "pendiente de entrega") {
    return {
      display: "Pendiente de Entrega",
      color: "yellow" as const,
      progress: 0,
    };
  }
  if (statusLower.includes("en reparto") || statusLower === "en reparto") {
    return {
      display: "En Reparto",
      color: "purple" as const,
      progress: 75,
    };
  }
  if (statusLower.includes("en cobranza") || statusLower === "en cobranza") {
    return {
      display: "En Cobranza",
      color: "blue" as const,
      progress: 90,
    };
  }
  if (statusLower.includes("finalizado") || statusLower === "finalizado") {
    return {
      display: "Finalizado",
      color: "green" as const,
      progress: 100,
    };
  }
  
  // Por defecto (fallback)
  return {
    display: status,
    color: "blue" as const,
    progress: 50,
  };
};

// Generar timeline basado en el estado de la orden
const generateTimeline = (order: Order) => {
  const statusLower = order.status.toLowerCase();
  const createdDate = order.created_at ? new Date(order.created_at) : new Date();
  const updatedDate = order.updated_at ? new Date(order.updated_at) : createdDate;
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  const timeline = [];
  
  // Pendiente de entrega
  const normalizedStatus = normalizeOrderStatus(order.status);
  const normalizedStatusLower = normalizedStatus.toLowerCase();
  const isPendingDelivery = normalizedStatusLower === "pendiente de entrega";
  const isInDelivery = normalizedStatusLower === "en reparto";
  const isFinished = normalizedStatusLower === "finalizado";
  
  timeline.push({
    id: 1,
    title: "Pendiente de entrega",
    description: "Tu pedido está siendo preparado y pronto será enviado",
    date: formatDate(createdDate),
    time: formatTime(createdDate),
    status: isPendingDelivery ? ("current" as const) : ("completed" as const),
    icon: Package,
  });
  
  // En Reparto
  timeline.push({
    id: 2,
    title: "En reparto",
    description: "El pedido está siendo entregado en tu zona",
    date: formatDate(updatedDate),
    time: formatTime(updatedDate),
    status: isInDelivery ? ("current" as const) : isFinished ? ("completed" as const) : ("pending" as const),
    icon: Truck,
  });
  
  // Finalizado
  timeline.push({
    id: 3,
    title: "Finalizado",
    description: "El pedido ha sido entregado y finalizado",
    date: isFinished ? formatDate(updatedDate) : "",
    time: isFinished ? formatTime(updatedDate) : "Estimado",
    status: isFinished ? ("completed" as const) : ("pending" as const),
    icon: CheckCircle2,
  });
  
  return timeline;
};

export default function TrackingPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError("ID de pedido no proporcionado");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const orderData = await getUserOrder(orderId);
        
        if (!orderData) {
          setError("Pedido no encontrado");
          return;
        }
        
        setOrder(orderData);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Error al cargar el pedido");
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [orderId]);
  
  // Skeleton Component
  const Skeleton = () => (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 max-w-4xl">
        {/* Skeleton para botón de volver */}
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
          <div className="w-16 h-5 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Skeleton para número de pedido y estado */}
        <div className="bg-white rounded-[12px] md:rounded-[14px] border border-gray-200 p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="w-40 md:w-48 h-6 md:h-8 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="w-28 md:w-32 h-5 md:h-6 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="w-28 md:w-32 h-9 md:h-10 bg-gray-200 rounded-lg animate-pulse shrink-0" />
          </div>
        </div>

        {/* Skeleton para timeline */}
        <div className="bg-white rounded-[12px] md:rounded-[14px] border border-gray-200 p-4 md:p-6 mb-4 md:mb-6">
          <div className="w-36 md:w-40 h-5 md:h-6 bg-gray-200 rounded animate-pulse mb-4 md:mb-6" />
          <div className="relative">
            <div className="absolute left-5 md:left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-4 md:space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="relative flex items-start gap-3 md:gap-4">
                  <div className="relative z-10 w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-full animate-pulse shrink-0" />
                  <div className="flex-1 pt-1 min-w-0">
                    <div className="w-32 md:w-40 h-5 md:h-6 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="w-full h-4 bg-gray-200 rounded animate-pulse mb-3" />
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="w-28 md:w-32 h-4 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Skeleton para dirección de entrega */}
        <div className="bg-white rounded-[12px] md:rounded-[14px] border border-gray-200 p-4 md:p-6">
          <div className="w-36 md:w-40 h-5 md:h-6 bg-gray-200 rounded animate-pulse mb-3 md:mb-4" />
          <div className="space-y-2">
            <div className="w-28 md:w-32 h-5 bg-gray-200 rounded animate-pulse" />
            <div className="w-full h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-40 md:w-48 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-28 md:w-32 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-36 md:w-40 h-4 bg-gray-200 rounded animate-pulse mt-2 md:mt-3" />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );

  if (loading) {
    return <Skeleton />;
  }
  
  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 max-w-4xl">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 md:mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Volver</span>
          </button>
          <div className="text-center py-12 md:py-20">
            <p className="text-red-600 text-sm md:text-base">{error || "Pedido no encontrado"}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  const statusInfo = getStatusInfo(order.status);
  const statusStyle = statusConfig[statusInfo.color];
  const timeline = generateTimeline(order);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 max-w-4xl">
        {/* Header con botón de volver */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 md:mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">Volver</span>
        </button>

        {/* Número de Pedido y Estado */}
        <div className="bg-white rounded-[12px] md:rounded-[14px] border border-gray-200 p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-0">
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-1 md:mb-2">
                Seguimiento de Envío
              </h1>
              <p className="text-base md:text-lg font-medium text-gray-600">
                Pedido {order.order_number}
              </p>
            </div>
            <div className={`px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 w-fit shrink-0 ${statusStyle.bg} ${statusStyle.text}`}>
              <Truck className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
              <span className="font-medium text-sm md:text-base">{statusInfo.display}</span>
            </div>
          </div>
        </div>

        {/* Información de Transporte - COMENTADA */}
        {/* 
        <div className="bg-white rounded-[14px] border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-gray-600" />
              Información de Transporte
            </h2>
            <button
              onClick={handleTransportClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              Rastrear en {trackingData.transport.name}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Empresa de Transporte</p>
              <p className="text-base font-medium text-gray-900">{trackingData.transport.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Número de Seguimiento</p>
              <p className="text-base font-medium text-gray-900">{trackingData.transport.trackingNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Teléfono</p>
              <p className="text-base font-medium text-gray-900">{trackingData.transport.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Fecha Estimada de Entrega</p>
              <p className="text-base font-medium text-gray-900">{trackingData.estimatedDelivery}</p>
            </div>
          </div>
        </div>
        */}

        {/* Timeline de Eventos */}
        <div className="bg-white rounded-[12px] md:rounded-[14px] border border-gray-200 p-4 md:p-6 mb-4 md:mb-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">Historial de Eventos</h2>
          <div className="relative">
            {/* Línea vertical del timeline */}
            <div className="absolute left-5 md:left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
            
            <div className="space-y-4 md:space-y-6">
              {timeline.map((event) => {
                const Icon = event.icon;
                const isCompleted = event.status === "completed";
                const isCurrent = event.status === "current";
                const isPending = event.status === "pending";

                return (
                  <div key={event.id} className="relative flex items-start gap-3 md:gap-4">
                    {/* Icono del evento */}
                    <div
                      className={`relative z-10 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border-2 shrink-0 ${
                        isCompleted
                          ? "bg-green-500 border-green-500 text-white"
                          : isCurrent
                          ? "bg-purple-500 border-purple-500 text-white"
                          : "bg-gray-100 border-gray-300 text-gray-400"
                      }`}
                    >
                      <Icon className="w-5 h-5 md:w-6 md:h-6" />
                    </div>

                    {/* Contenido del evento */}
                    <div className="flex-1 min-w-0 pt-0.5 md:pt-1">
                      <div className="flex items-start justify-between mb-1">
                        <div className="min-w-0">
                          <h3
                            className={`text-sm md:text-base font-semibold ${
                              isCompleted || isCurrent
                                ? "text-gray-900"
                                : "text-gray-500"
                            }`}
                          >
                            {event.title}
                          </h3>
                          <p
                            className={`text-xs md:text-sm mt-1 ${
                              isCompleted || isCurrent
                                ? "text-gray-600"
                                : "text-gray-400"
                            }`}
                          >
                            {event.description}
                          </p>
                        </div>
                      </div>
                      {event.date && (
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-xs text-gray-500">
                            {event.date} {event.time && `a las ${event.time}`}
                          </span>
                        </div>
                      )}
                      {!event.date && event.time && (
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-xs text-gray-500">{event.time}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dirección de Entrega */}
        {order.shipping_address && (
          <div className="bg-white rounded-[12px] md:rounded-[14px] border border-gray-200 p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-600 shrink-0" />
              Dirección de Entrega
            </h2>
            <div className="space-y-1 md:space-y-2 text-sm md:text-base">
              <p className="font-medium text-gray-900">
                {order.shipping_address.full_name}
              </p>
              <p className="text-gray-600">
                {order.shipping_address.street} {order.shipping_address.number}
                {order.shipping_address.additional_info && ` - ${order.shipping_address.additional_info}`}
              </p>
              <p className="text-gray-600">
                {order.shipping_address.city}, {order.shipping_address.province}
              </p>
              <p className="text-gray-600">
                CP: {order.shipping_address.postal_code}
              </p>
              <p className="text-gray-600 mt-2 md:mt-3">
                Teléfono: {order.shipping_address.phone}
              </p>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
