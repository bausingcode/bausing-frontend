import ScrollableContainer from "@/components/ScrollableContainer";
import Sidebar from "@/components/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex items-stretch py-6 px-6 overflow-hidden" style={{ backgroundColor: '#f3f3f3', fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
      {/* Contenedor principal alineado a la izquierda sobre el fondo gris */}
      <div className="flex w-full gap-6">
        <Sidebar />

        {/* Contenido principal como tarjeta blanca grande */}
        <main className="flex-1 bg-white rounded-[14px] overflow-hidden flex flex-col">
          <ScrollableContainer>
            <div className="p-8">{children}</div>
          </ScrollableContainer>
        </main>
      </div>
    </div>
  );
}

