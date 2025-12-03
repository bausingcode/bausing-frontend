import { ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-16">
        {/* Empty State */}
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-3">
              Bienvenido a Bausing
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Tu página todavía no está lista. Puedes ir entrando al Admin Dashboard para comenzar a configurarla.
            </p>
          </div>

          {/* Botón Admin Dashboard */}
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Ir al Admin Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
