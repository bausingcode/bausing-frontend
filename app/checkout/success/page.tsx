"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle2, Package, Home, Loader2 } from "lucide-react";
import Link from "next/link";
import { getUserOrder } from "@/lib/api";

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const order = await getUserOrder(orderId);
        if (order && order.order_number) {
          setReceiptNumber(order.order_number);
        }
      } catch (error) {
        console.error("Error al obtener detalles de la orden:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center px-4 py-12 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00C1A7' + '20' }}>
              <CheckCircle2 className="w-12 h-12" style={{ color: '#00C1A7' }} />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            ¡Pedido realizado con éxito!
          </h1>
          
          <p className="text-gray-600 mb-8">
            Tu pedido ha sido procesado correctamente. Recibirás un correo de confirmación en breve.
          </p>

          {loading ? (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
              <p className="text-sm text-gray-600">Cargando número de pedido...</p>
            </div>
          ) : receiptNumber ? (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Número de pedido</p>
              <p className="text-lg font-semibold text-gray-900">{receiptNumber}</p>
            </div>
          ) : null}

          <div className="flex flex-col gap-3">
            <Link
              href={orderId ? `/tracking/${orderId}` : "/usuario"}
              className="flex items-center justify-center gap-2 px-6 py-3 text-white rounded-lg font-medium transition-colors"
              style={{ backgroundColor: '#00C1A7' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#00A892'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#00C1A7'}
            >
              <Package className="w-5 h-5" />
              Ver estado del pedido
            </Link>
            
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              <Home className="w-5 h-5" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
