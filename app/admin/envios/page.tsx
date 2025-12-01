import PageHeader from "@/components/PageHeader";

export default function EnviosLogistica() {
  const zonas = [
    {
      nombre: "Buenos Aires - CABA",
      totales: 45,
      enCamino: 12,
      pendientes: 8,
    },
    {
      nombre: "Buenos Aires - GBA Norte",
      totales: 34,
      enCamino: 9,
      pendientes: 5,
    },
    {
      nombre: "Buenos Aires - GBA Sur",
      totales: 28,
      enCamino: 7,
      pendientes: 4,
    },
    {
      nombre: "Córdoba Capital",
      totales: 18,
      enCamino: 4,
      pendientes: 3,
    },
    {
      nombre: "Rosario - Santa Fe",
      totales: 15,
      enCamino: 3,
      pendientes: 2,
    },
    {
      nombre: "Mendoza",
      totales: 12,
      enCamino: 2,
      pendientes: 1,
    },
  ];

  const envios = [
    {
      pedido: "#001234",
      cliente: "Juan Pérez",
      provincia: "Buenos Aires",
      localidad: "CABA",
      direccion: "Av. Corrientes 1234",
      estado: "En Camino",
      estadoColor: "purple",
      transporte: "Propio",
      fechaEst: "2025-11-29",
      conductor: "Roberto García",
    },
    {
      pedido: "#001235",
      cliente: "María González",
      provincia: "Córdoba",
      localidad: "Capital",
      direccion: "San Martín 567",
      estado: "Pendiente",
      estadoColor: "yellow",
      transporte: "Andreani",
      fechaEst: "2025-12-02",
      conductor: "-",
    },
    {
      pedido: "#001236",
      cliente: "Carlos Rodríguez",
      provincia: "Santa Fe",
      localidad: "Rosario",
      direccion: "Pellegrini 890",
      estado: "Entregado",
      estadoColor: "green",
      transporte: "OCA",
      fechaEst: "2025-11-27",
      conductor: "-",
    },
    {
      pedido: "#001237",
      cliente: "Ana Martínez",
      provincia: "Mendoza",
      localidad: "Capital",
      direccion: "Las Heras 345",
      estado: "Retrasado",
      estadoColor: "red",
      transporte: "Propio",
      fechaEst: "2025-11-26",
      conductor: "Luis Fernández",
    },
    {
      pedido: "#001238",
      cliente: "Luis Fernández",
      provincia: "Buenos Aires",
      localidad: "Zona Norte",
      direccion: "Libertador 2345",
      estado: "Preparando",
      estadoColor: "blue",
      transporte: "Propio",
      fechaEst: "2025-11-30",
      conductor: "Roberto García",
    },
  ];

  const alertas = [
    {
      tipo: "retraso",
      texto: "Pedido #001237 - Ana Martínez",
      detalle: "Fecha estimada: 2025-11-26 (2 días de retraso)",
      color: "red",
      boton: "Ver detalle",
    },
    {
      tipo: "sinConductor",
      texto: "3 envíos sin conductor asignado",
      detalle: "Zona: Buenos Aires - GBA Sur",
      color: "yellow",
      boton: "Asignar",
    },
  ];

  const estadoConfig = {
    purple: {
      bg: "bg-purple-100",
      text: "text-purple-700",
      icon: (
        <svg key="truck-icon" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path key="truck-path" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM3 12h.01M21 12h.01M9 12h6m-6-3h6m-3-3v6m-3-3v6" />
        </svg>
      ),
    },
    yellow: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      icon: (
        <svg key="clock-icon" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path key="clock-path" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    green: {
      bg: "bg-green-100",
      text: "text-green-700",
      icon: (
        <svg key="check-icon" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path key="check-path" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    red: {
      bg: "bg-red-100",
      text: "text-red-700",
      icon: (
        <svg key="warning-icon" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path key="warning-path" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    blue: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      icon: (
        <svg key="box-icon" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path key="box-path" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
  };

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <PageHeader 
        title="Envíos & Logística" 
        description="Gestiona las entregas y rutas de envío" 
      />

      {/* Envíos por Zona Section */}
      <div className="mb-8">
        <h2 className="text-lg font-normal mb-4" style={{ color: '#484848' }}>Envíos por Zona</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zonas.map((zona, index) => (
            <div key={index} className="bg-white rounded-[10px] border border-gray-200 p-4" style={{ borderRadius: '14px' }}>
              <div className="flex items-start gap-3 mb-3">
                <svg
                  className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 mb-1">{zona.nombre}</h3>
                  <p className="text-xs text-gray-600">{zona.totales} envíos totales</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">
                  {zona.enCamino} en camino
                </span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                  {zona.pendientes} pendientes
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-[10px] border border-gray-200 p-4 mb-6" style={{ borderRadius: '14px' }}>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre, dirección o número de pedido..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            />
          </div>
          <button className="px-4 py-2 text-white rounded-[10px] font-medium hover:opacity-90 transition-colors flex items-center gap-2" style={{ backgroundColor: '#155DFC' }}>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {/* Slider superior */}
              <line x1="4" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="8" r="3" fill="currentColor" />
              {/* Slider inferior */}
              <line x1="4" y1="16" x2="20" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="16" r="3" fill="currentColor" />
            </svg>
            Filtros
          </button>
        </div>
      </div>

      {/* Envíos Table */}
      <div className="bg-white rounded-[10px] border border-gray-200 overflow-hidden mb-8" style={{ borderRadius: '14px' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Pedido
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Zona
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Dirección
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Transporte
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Fecha Est.
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Conductor
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {envios.map((envio, index) => {
                const estado = estadoConfig[envio.estadoColor as keyof typeof estadoConfig];
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                      {envio.pedido}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">
                      {envio.cliente}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-700">
                      <div className="flex flex-col">
                        <span className="font-medium">{envio.provincia}</span>
                        <span className="text-gray-600">{envio.localidad}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">
                      {envio.direccion}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${estado.bg} ${estado.text}`}>
                        {estado.icon}
                        {envio.estado}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">
                      {envio.transporte}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">
                      {envio.fechaEst}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">
                      {envio.conductor}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alertas de Retrasos Section */}
      <div className="bg-white rounded-[10px] border border-gray-200 p-6" style={{ borderRadius: '14px' }}>
        <div className="flex items-center gap-2 mb-4">
          <svg
            className="w-5 h-5 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-lg font-normal" style={{ color: '#484848' }}>Alertas de Retrasos</h2>
        </div>
        <div className="space-y-3">
          {alertas.map((alerta, index) => (
            <div
              key={index}
              className={`border-l-4 rounded-[10px] p-3 flex items-center justify-between ${
                alerta.color === 'red'
                  ? 'bg-red-50 border-red-400'
                  : 'bg-yellow-50 border-yellow-400'
              }`}
            >
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  alerta.color === 'red' ? 'text-red-800' : 'text-yellow-800'
                }`}>
                  {alerta.texto}
                </p>
                <p className={`text-xs mt-1 ${
                  alerta.color === 'red' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {alerta.detalle}
                </p>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium ml-4">
                {alerta.boton}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

