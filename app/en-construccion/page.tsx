import { redirect } from "next/navigation";
import { Suspense } from "react";
import ConstructionGateClient from "./ConstructionGateClient";
import { isConstructionModeEnabled, getConstructionPasskey } from "@/lib/constructionUnlock";

export const metadata = {
  title: "Página en construcción | Bausing",
  robots: { index: false, follow: false },
};

export default function EnConstruccionPage() {
  if (!isConstructionModeEnabled() || !getConstructionPasskey()) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm flex flex-col items-center text-center">
          <div className="mb-8">
            <img
              src="/images/logo/logobausing1.svg"
              alt="Bausing"
              className="h-9 w-auto mx-auto"
            />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Página en construcción
          </h1>
          <p className="text-sm text-gray-600 mb-8">
            Estamos terminando de preparar el sitio. Ingresá con la clave de
            acceso para continuar.
          </p>
          <Suspense
            fallback={
              <div className="w-full h-24 flex items-center justify-center text-sm text-gray-500">
                Cargando…
              </div>
            }
          >
            <ConstructionGateClient />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
