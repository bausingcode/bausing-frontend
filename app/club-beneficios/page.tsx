import { Suspense } from "react";
import { fetchClubBeneficiosQuick } from "@/lib/api";
import ClubBeneficiosContent from "./ClubBeneficiosContent";

export const dynamic = "force-dynamic";

export default async function ClubBeneficiosPage() {
  const initialProducts = await fetchClubBeneficiosQuick().catch(() => []);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center py-20">
              <p className="text-gray-600">Cargando...</p>
            </div>
          </div>
        </div>
      }
    >
      <ClubBeneficiosContent initialProducts={initialProducts} />
    </Suspense>
  );
}
