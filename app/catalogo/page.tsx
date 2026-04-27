import { Suspense } from "react";
import type { Product } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CatalogoContent from "./CatalogoContent";

interface Props {
  searchParams: Promise<{ search?: string }>;
}

export default async function CatalogoPage({ searchParams }: Props) {
  await searchParams;
  // Carga de productos en el cliente: evita bloquear la respuesta RSC (navegación más rápida).
  // CatalogoContent hace el primer fetch al montar.
  const initialData = { products: [] as Product[], total: 0, total_pages: 1 };

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white">
          <Navbar />
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center py-20">
              <p className="text-gray-600">Cargando...</p>
            </div>
          </div>
          <Footer />
        </div>
      }
    >
      <CatalogoContent
        initialProducts={initialData.products ?? []}
        initialTotalPages={initialData.total_pages ?? 1}
        initialTotal={initialData.total ?? 0}
      />
    </Suspense>
  );
}
