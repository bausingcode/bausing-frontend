"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  ArrowLeft,
  Circle,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

// Datos mock del tracking
const mockTrackingData = {
  orderNumber: "#001234",
  status: "En Reparto",
  statusColor: "purple",
  progress: 75, // Porcentaje de progreso
  estimatedDelivery: "2025-11-29",
  transport: {
    name: "OCA",
    trackingNumber: "OCA123456789",
    phone: "+54 11 4000-0000",
    website: "https://www.oca.com.ar",
  },
  timeline: [
    {
      id: 1,
      title: "Pedido Confirmado",
      description: "Tu pedido ha sido confirmado y está siendo preparado",
      date: "2025-11-25",
      time: "10:30",
      status: "completed",
      icon: CheckCircle,
    },
    {
      id: 2,
      title: "En Preparación",
      description: "El pedido está siendo empaquetado en nuestro almacén",
      date: "2025-11-25",
      time: "14:15",
      status: "completed",
      icon: Package,
    },
    {
      id: 3,
      title: "Despachado",
      description: "El pedido ha sido enviado a la empresa de transporte",
      date: "2025-11-26",
      time: "09:00",
      status: "completed",
      icon: Truck,
    },
    {
      id: 4,
      title: "En Tránsito",
      description: "El pedido está en camino a tu ciudad",
      date: "2025-11-27",
      time: "16:45",
      status: "completed",
      icon: Truck,
    },
    {
      id: 5,
      title: "En Reparto",
      description: "El pedido está siendo entregado en tu zona",
      date: "2025-11-28",
      time: "11:20",
      status: "current",
      icon: Truck,
    },
    {
      id: 6,
      title: "Entregado",
      description: "El pedido será entregado en tu domicilio",
      date: "2025-11-29",
      time: "Estimado",
      status: "pending",
      icon: CheckCircle2,
    },
  ],
  address: {
    street: "Av. Corrientes 1234",
    city: "Buenos Aires",
    province: "CABA",
    postalCode: "C1043AAX",
    recipient: "Juan Pérez",
    phone: "+54 11 1234-5678",
  },
};

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

export default function TrackingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id") || mockTrackingData.orderNumber;
  
  const [trackingData] = useState(mockTrackingData);
  const statusStyle = statusConfig[trackingData.statusColor as keyof typeof statusConfig];

  const handleTransportClick = () => {
    if (trackingData.transport.website) {
      window.open(trackingData.transport.website, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header con botón de volver */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Volver</span>
        </button>

        {/* Número de Pedido y Estado */}
        <div className="bg-white rounded-[14px] border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Seguimiento de Envío
              </h1>
              <p className="text-lg font-medium text-gray-600">
                Pedido {trackingData.orderNumber}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${statusStyle.bg} ${statusStyle.text}`}>
              <Truck className="w-5 h-5" />
              <span className="font-medium">{trackingData.status}</span>
            </div>
          </div>

          {/* Barra de Progreso */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progreso del envío</span>
              <span className="text-sm font-medium text-gray-600">{trackingData.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full ${statusStyle.iconBg} transition-all duration-500 ease-out`}
                style={{ width: `${trackingData.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Información de Transporte */}
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

        {/* Timeline de Eventos */}
        <div className="bg-white rounded-[14px] border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Historial de Eventos</h2>
          <div className="relative">
            {/* Línea vertical del timeline */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
            
            <div className="space-y-6">
              {trackingData.timeline.map((event, index) => {
                const Icon = event.icon;
                const isCompleted = event.status === "completed";
                const isCurrent = event.status === "current";
                const isPending = event.status === "pending";

                return (
                  <div key={event.id} className="relative flex items-start gap-4">
                    {/* Icono del evento */}
                    <div
                      className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                        isCompleted
                          ? "bg-green-500 border-green-500 text-white"
                          : isCurrent
                          ? "bg-purple-500 border-purple-500 text-white"
                          : "bg-gray-100 border-gray-300 text-gray-400"
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    {/* Contenido del evento */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h3
                            className={`text-base font-semibold ${
                              isCompleted || isCurrent
                                ? "text-gray-900"
                                : "text-gray-500"
                            }`}
                          >
                            {event.title}
                          </h3>
                          <p
                            className={`text-sm mt-1 ${
                              isCompleted || isCurrent
                                ? "text-gray-600"
                                : "text-gray-400"
                            }`}
                          >
                            {event.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {event.date} a las {event.time}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dirección de Entrega */}
        <div className="bg-white rounded-[14px] border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-600" />
            Dirección de Entrega
          </h2>
          <div className="space-y-2">
            <p className="text-base font-medium text-gray-900">
              {trackingData.address.recipient}
            </p>
            <p className="text-sm text-gray-600">
              {trackingData.address.street}
            </p>
            <p className="text-sm text-gray-600">
              {trackingData.address.city}, {trackingData.address.province}
            </p>
            <p className="text-sm text-gray-600">
              CP: {trackingData.address.postalCode}
            </p>
            <p className="text-sm text-gray-600 mt-3">
              Teléfono: {trackingData.address.phone}
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
