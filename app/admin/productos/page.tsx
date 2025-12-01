export default function ProductosPromos() {
  const products = [
    {
      producto: "Colchón Fénix",
      modelo: "Fénix",
      stock: 45,
      stockColor: "green",
      solo: "$38,000",
      masBase: "$52,000",
      completo: "$68,000",
      estados: ["Promo", "Billetera"],
    },
    {
      producto: "Colchón Perla",
      modelo: "Perla",
      stock: 18,
      stockColor: "orange",
      solo: "$32,000",
      masBase: "$45,000",
      completo: "$58,000",
      estados: [],
    },
    {
      producto: "Colchón Diamante",
      modelo: "Diamante",
      stock: 67,
      stockColor: "green",
      solo: "$45,000",
      masBase: "$62,000",
      completo: "$78,000",
      estados: ["Promo Billetera"],
    },
    {
      producto: "Base Premium",
      modelo: "Base",
      stock: 32,
      stockColor: "green",
      solo: "$18,000",
      masBase: "-",
      completo: "-",
      estados: ["Billetera"],
    },
  ];

  const promotions = [
    {
      titulo: "Black Friday 2025",
      estado: "activa",
      tipo: "20% OFF",
      vigencia: "2025-11-20 - 2025-11-30",
      productos: "Fénix, Diamante",
      billetera: true,
      billeteraTexto: "Compatible con Pesos Bausing",
    },
    {
      titulo: "Combo Verano",
      estado: "programada",
      tipo: "2x1 en bases",
      vigencia: "2025-12-01 - 2025-12-31",
      productos: "Base Premium, Base Estándar",
      billetera: false,
      billeteraTexto: "No aplica con billetera",
    },
    {
      titulo: "Descuento Perla",
      estado: "activa",
      tipo: "15% OFF",
      vigencia: "2025-11-15 - 2025-12-15",
      productos: "Perla",
      billetera: true,
      billeteraTexto: "Acumula con Pesos Bausing",
    },
  ];

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Productos & Promos</h1>
        <p className="text-gray-600">Gestiona tu catálogo y ofertas</p>
      </div>

      {/* Productos Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-normal" style={{ color: '#484848' }}>Productos</h2>
          <button className="px-3 py-1.5 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors flex items-center gap-1.5" style={{ backgroundColor: '#155DFC' }}>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nuevo Producto
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" style={{ borderRadius: '14px' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Modelo
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Solo
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    + Base
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Completo
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Estados
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-xs font-medium text-gray-900">
                      {product.producto}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">
                      {product.modelo}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs font-medium" style={{ color: product.stockColor === 'green' ? '#10B981' : '#F59E0B' }}>
                      {product.stock}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">
                      {product.solo}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">
                      {product.masBase}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-700">
                      {product.completo}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {product.estados.map((estado, idx) => {
                          if (estado === "Promo") {
                            return (
                              <span key={idx} className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                Promo
                              </span>
                            );
                          } else if (estado === "Billetera") {
                            return (
                              <span key={idx} className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                Billetera
                              </span>
                            );
                          } else if (estado === "Promo Billetera") {
                            return (
                              <>
                                <span key={`${idx}-promo`} className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                  Promo
                                </span>
                                <span key={`${idx}-billetera`} className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                  Billetera
                                </span>
                              </>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <button className="text-blue-600 hover:text-blue-800 transition-colors">
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button className="text-red-600 hover:text-red-800 transition-colors">
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Promociones Activas Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-normal" style={{ color: '#484848' }}>Promociones Activas</h2>
          <button className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-1.5">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nueva Promoción
          </button>
        </div>

        <div className="space-y-4">
          {promotions.map((promo, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 relative" style={{ borderRadius: '14px' }}>
              {/* Edit and Delete Icons */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button className="text-blue-600 hover:text-blue-800 transition-colors">
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button className="text-red-600 hover:text-red-800 transition-colors">
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>

              {/* Title and Status */}
              <div className="mb-4 pr-16">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base font-normal text-gray-900">{promo.titulo}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    promo.estado === 'activa' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {promo.estado}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Tipo:</span> <span style={{ color: '#F59E0B' }}>{promo.tipo}</span>
                </div>
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Vigencia:</span> {promo.vigencia}
                </div>
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Productos:</span> {promo.productos}
                </div>
              </div>

              {/* Billetera Info */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                <div className="relative">
                  <svg
                    className={`w-5 h-5 ${promo.billetera ? 'text-blue-600' : 'text-gray-400'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  {!promo.billetera && (
                    <svg
                      className="w-4 h-4 text-red-500 absolute top-0 left-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ transform: 'translate(2px, -2px)' }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </div>
                <span className={`text-xs ${promo.billetera ? 'text-blue-600' : 'text-gray-500'}`}>
                  {promo.billeteraTexto}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

