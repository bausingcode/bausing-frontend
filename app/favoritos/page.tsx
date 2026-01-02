"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Heart } from "lucide-react";

export default function FavoritosPage() {
  const { favorites } = useCart();
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Redirigir al login si no está autenticado
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 lg:px-8 py-8 lg:py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-gray-500">Cargando...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 lg:px-8 py-8 lg:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Mis favoritos
          </h1>
          <p className="text-gray-600">
            {favorites.length === 0
              ? "Aún no tienes productos favoritos"
              : `${favorites.length} ${favorites.length === 1 ? "producto guardado" : "productos guardados"}`}
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-[14px] p-12 text-center bg-gray-50">
            <div className="mx-auto w-16 h-16 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 mb-4">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tienes favoritos aún
            </h3>
            <p className="text-gray-600 mb-6">
              Agrega productos a tus favoritos para encontrarlos fácilmente más tarde.
            </p>
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 bg-[#00C1A7] text-white px-6 py-3 rounded-[10px] font-semibold hover:bg-[#00a892] transition-colors"
            >
              Explorar productos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((favorite) => (
              <ProductCard
                key={favorite.id}
                id={favorite.id}
                image={favorite.image}
                alt={favorite.name}
                name={favorite.name}
                currentPrice={favorite.price}
                originalPrice=""
                discount={undefined}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

