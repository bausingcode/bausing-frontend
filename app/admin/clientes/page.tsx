export default function Clientes() {
  const clients = [
    {
      nombre: "Juan Pérez",
      telefono: "+54 9 11 1234-5678",
      email: "juan.perez@email.com",
      localidad: "Buenos Aires, Buenos Aires",
      compras: 5,
      ultimaCompra: "2025-11-28",
      saldoBilletera: "$12,500",
      estado: "Activo",
    },
    {
      nombre: "María González",
      telefono: "+54 9 11 2345-6789",
      email: "maria.gonzalez@email.com",
      localidad: "Córdoba, Córdoba",
      compras: 3,
      ultimaCompra: "2025-11-27",
      saldoBilletera: "$8,200",
      estado: "Activo",
    },
    {
      nombre: "Carlos Rodríguez",
      telefono: "+54 9 11 3456-7890",
      email: "carlos.rodriguez@email.com",
      localidad: "Rosario, Santa Fe",
      compras: 2,
      ultimaCompra: "2025-11-28",
      saldoBilletera: "$0",
      estado: "Activo",
    },
    {
      nombre: "Ana Martínez",
      telefono: "+54 9 11 4567-8901",
      email: "ana.martinez@email.com",
      localidad: "Mendoza, Mendoza",
      compras: 7,
      ultimaCompra: "2025-11-26",
      saldoBilletera: "$25,600",
      estado: "Activo",
    },
  ];

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Clientes</h1>
        <p className="text-gray-600">Gestiona la información de tus clientes</p>
      </div>

      {/* Search and Export Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6" style={{ borderRadius: '14px' }}>
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
              placeholder="Buscar por nombre, teléfono o email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
            />
          </div>
          <button className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Exportar
          </button>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" style={{ borderRadius: '14px' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Localidad
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Compras
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Última Compra
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Saldo Billetera
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs font-medium text-gray-900 max-w-[120px]">
                    <div className="break-words">{client.nombre}</div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">
                    {client.telefono}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">
                    {client.email}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-700 max-w-[150px]">
                    <div className="break-words">{client.localidad}</div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">
                    {client.compras}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">
                    {client.ultimaCompra}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs font-medium" style={{ color: '#155DFC' }}>
                    {client.saldoBilletera}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {client.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

