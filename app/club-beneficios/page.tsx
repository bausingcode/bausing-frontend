import { Suspense } from "react";
import type { Metadata } from "next";
import { fetchClubBeneficiosQuick } from "@/lib/api";
import ClubBeneficiosContent from "./ClubBeneficiosContent";
import { buildPageOpenGraph, buildPageTwitter } from "@/lib/seo/openGraph";
import { getSiteUrl, titleWithBrand } from "@/lib/seo/site";
import { resolvePageMetadata } from "@/lib/seo/pageMetadataOverrides";

export const dynamic = "force-dynamic";

const url = `${getSiteUrl()}/club-beneficios`;

export async function generateMetadata(): Promise<Metadata> {
  const { title, description, titleIsOverride } = await resolvePageMetadata("/club-beneficios", {
    title: "Club de Beneficios",
    description:
      "Sumate al Club de Beneficios de Bausing y accedé a descuentos y promociones exclusivas.",
  });
  const ogTitle = titleIsOverride ? title : titleWithBrand(title);
  return {
    title: titleIsOverride ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: buildPageOpenGraph({ title: ogTitle, description, url }),
    twitter: buildPageTwitter({ title: ogTitle, description }),
  };
}

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
