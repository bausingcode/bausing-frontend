import { Suspense } from "react";
import { fetchCategories, type Category, type Product } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CatalogoContent from "./CatalogoContent";

interface Props {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ search?: string; filter?: string }>;
}

// Construye los mapas de ID de categoría (slug → id, nombre → id)
function buildCategoryIdMap(categories: Category[]): Record<string, string> {
  const nameToIdMap: Record<string, string> = {};
  const slugToIdMap: Record<string, string> = {};

  categories.forEach((cat) => {
    const normalizedName = cat.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    nameToIdMap[normalizedName] = cat.id;
    nameToIdMap[cat.name.toLowerCase()] = cat.id;

    const catSlug = cat.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    slugToIdMap[catSlug] = cat.id;
  });

  return { ...nameToIdMap, ...slugToIdMap };
}

export default async function CatalogoPage({ params, searchParams }: Props) {
  await params;
  await searchParams;

  // Categorías en el servidor para mapas slug/id; productos vía API en el cliente
  const categories = await fetchCategories(true).catch(() => [] as Category[]);
  const categoryIdMap = buildCategoryIdMap(categories);

  // Productos se cargan en el cliente: evita un round-trip al API antes de mostrar la ruta
  // (categorías sí vienen del servidor para resolver filtros del slug).
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
        initialCategories={categories}
        initialCategoryIdMap={categoryIdMap}
      />
    </Suspense>
  );
}
