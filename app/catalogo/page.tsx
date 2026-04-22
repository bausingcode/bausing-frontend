import { Suspense } from "react";
import { fetchProducts } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CatalogoContent from "./CatalogoContent";

interface Props {
  searchParams: Promise<{ search?: string }>;
}

export default async function CatalogoPage({ searchParams }: Props) {
  const params = await searchParams;
  const search = params?.search || "";

  // Pre-fetchear productos en el servidor → los productos llegan en el HTML inicial
  const initialData = await fetchProducts({
    is_active: true,
    sort: "created_at_desc",
    page: 1,
    per_page: 20,
    include_images: true,
    include_promos: true,
    require_crm_product_id: true,
    ...(search && { search }),
  }).catch(() => ({ products: [], total: 0, total_pages: 1 }));

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
