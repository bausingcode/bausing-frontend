import { Suspense } from "react";
import { fetchProducts, fetchCategories, Category } from "@/lib/api";
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

// Determina el categoryId y subcategoryId a partir del slug y las categorías
function resolveCategoryIds(
  slug: string[],
  categories: Category[],
  categoryIdMap: Record<string, string>
): { categoryId: string | null; subcategoryId: string | null } {
  if (!slug || slug.length === 0) {
    return { categoryId: null, subcategoryId: null };
  }

  const mainSlug = slug[0];
  let categoryId: string | null = categoryIdMap[mainSlug] || null;

  // Fallback: normalizar el slug como nombre
  if (!categoryId) {
    const fallbackName = mainSlug.replace(/-/g, " ");
    const normalized = fallbackName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    categoryId =
      categoryIdMap[normalized] || categoryIdMap[fallbackName.toLowerCase()] || null;
  }

  let subcategoryId: string | null = null;
  if (slug.length >= 2 && categoryId) {
    const subSlug = slug[1];
    const subcat = categories.find((c) => {
      const slugFromName = c.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      return c.parent_id === categoryId && (slugFromName === subSlug || c.id === subSlug);
    });
    if (subcat) subcategoryId = subcat.id;
  }

  return { categoryId, subcategoryId };
}

export default async function CatalogoPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { search } = await searchParams;

  // Fetchear categorías y productos en el servidor (en paralelo cuando es posible)
  const categories = await fetchCategories(true).catch(() => [] as Category[]);
  const categoryIdMap = buildCategoryIdMap(categories);
  const { categoryId, subcategoryId } = resolveCategoryIds(slug, categories, categoryIdMap);

  const fetchParams: Parameters<typeof fetchProducts>[0] = {
    is_active: true,
    sort: "created_at_desc",
    page: 1,
    per_page: 20,
    include_images: true,
    include_promos: true,
    ...(subcategoryId
      ? { category_id: subcategoryId }
      : categoryId
      ? { category_id: categoryId }
      : {}),
    ...(search ? { search } : {}),
  };

  // Productos pre-fetcheados en el servidor → llegan en el HTML inicial
  const initialData = await fetchProducts(fetchParams).catch(() => ({
    products: [],
    total: 0,
    total_pages: 1,
  }));

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
