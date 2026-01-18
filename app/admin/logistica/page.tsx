import { cookies } from "next/headers";
import { Suspense } from "react";
import LogisticaClient from "./LogisticaClient";
import { getLogisticaPedidos, getAppSettings, LogisticaPedido } from "@/lib/api";

function LogisticaSkeleton() {
  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Envíos & Logística</h1>
        <p className="text-sm text-gray-600">Gestiona los envíos y pedidos por zona</p>
      </div>

      <div className="bg-white rounded-[14px] border border-gray-200 p-4 mb-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>

      <div className="bg-white rounded-[14px] border border-gray-200 p-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  );
}

async function LogisticaContent() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  let initialVentas: LogisticaPedido[] = [];
  let diasEstimados = 3;

  try {
    // Cargar configuración
    const settings = await getAppSettings();
    diasEstimados = settings.general?.diasEstimadosEnvio || 3;

    // Cargar pedidos iniciales
    const result = await getLogisticaPedidos({
      solo_retrasos: false,
      dias_estimados: diasEstimados,
    }, cookieHeader);
    
    initialVentas = result.ventas;
  } catch (error) {
    console.error("Error loading logistica data:", error);
  }

  return <LogisticaClient initialVentas={initialVentas} diasEstimados={diasEstimados} />;
}

export default function LogisticaPage() {
  return (
    <Suspense fallback={<LogisticaSkeleton />}>
      <LogisticaContent />
    </Suspense>
  );
}
