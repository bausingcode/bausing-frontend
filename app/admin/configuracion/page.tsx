"use client";

import PageHeader from "@/components/PageHeader";
import { Wallet, Bell, Mail, Shield, Save } from "lucide-react";
import { useState } from "react";

export default function Configuracion() {
  const [walletConfig, setWalletConfig] = useState({
    porcentajeEstandar: "10",
    montoMinimo: "10000",
    porcentajeMaximo: "50",
    vencimiento: "365",
    permitirAcumulacion: true,
  });

  const [notificaciones, setNotificaciones] = useState({
    nuevosPedidos: true,
    erroresPagos: true,
    stockBajo: true,
    movimientosInusuales: true,
    reclamosClientes: true,
  });

  const [mensajes, setMensajes] = useState({
    acreditacion: "",
    confirmacion: "",
    enCamino: "",
  });

  const [seguridad, setSeguridad] = useState({
    montoMaximoCarga: "50000",
    registrarCambios: true,
    comentarioObligatorio: true,
  });

  const handleSave = () => {
    // Aquí iría la lógica para guardar la configuración
    console.log("Guardando configuración...");
  };

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900 mb-1">Configuración</h1>
        <p className="text-sm text-gray-600">Ajusta las preferencias de tu panel</p>
      </div>

      <div className="space-y-6">
        {/* Configuración de Billetera */}
        <div className="bg-white rounded-[14px] border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
              <Wallet className="w-5 h-5 text-gray-700" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Configuración de Billetera</h2>
          </div>

          <div className="space-y-6">
            {/* Porcentaje estándar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Porcentaje estándar de Pesos Bausing por compra
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={walletConfig.porcentajeEstandar}
                  onChange={(e) => setWalletConfig({ ...walletConfig, porcentajeEstandar: e.target.value })}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
                <span className="text-gray-600">%</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Los clientes recibirán este % del valor de su compra en Pesos Bausing
              </p>
            </div>

            {/* Monto mínimo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto mínimo de compra para acreditar Pesos Bausing
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">$</span>
                <input
                  type="number"
                  value={walletConfig.montoMinimo}
                  onChange={(e) => setWalletConfig({ ...walletConfig, montoMinimo: e.target.value })}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Solo se acreditan Pesos Bausing en compras superiores a este monto
              </p>
            </div>

            {/* Porcentaje máximo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Porcentaje máximo de uso de billetera por compra
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={walletConfig.porcentajeMaximo}
                  onChange={(e) => setWalletConfig({ ...walletConfig, porcentajeMaximo: e.target.value })}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
                <span className="text-gray-600">%</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Límite de Pesos Bausing que el cliente puede usar en una compra
              </p>
            </div>

            {/* Vencimiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vencimiento de Pesos Bausing
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={walletConfig.vencimiento}
                  onChange={(e) => setWalletConfig({ ...walletConfig, vencimiento: e.target.value })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
                <span className="text-gray-600">días</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Los Pesos Bausing vencen después de este período sin uso
              </p>
            </div>

            {/* Permitir acumulación */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permitir acumulación de Pesos Bausing con promociones
                </label>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={walletConfig.permitirAcumulacion}
                  onChange={(e) => setWalletConfig({ ...walletConfig, permitirAcumulacion: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="bg-white rounded-[14px] border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
              <Bell className="w-5 h-5 text-gray-700" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Notificaciones</h2>
          </div>

          <div className="space-y-4">
            {[
              { key: 'nuevosPedidos', label: 'Nuevos pedidos', description: 'Recibe notificación cuando hay un nuevo pedido' },
              { key: 'erroresPagos', label: 'Errores en pagos', description: 'Alerta cuando hay problemas con pagos' },
              { key: 'stockBajo', label: 'Stock bajo', description: 'Aviso cuando un producto tiene poco stock' },
              { key: 'movimientosInusuales', label: 'Movimientos inusuales en billetera', description: 'Detectar actividad sospechosa en Pesos Bausing' },
              { key: 'reclamosClientes', label: 'Reclamos de clientes', description: 'Notificar cuando un cliente abre un reclamo' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {item.label}
                  </label>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={notificaciones[item.key as keyof typeof notificaciones]}
                    onChange={(e) => setNotificaciones({ ...notificaciones, [item.key]: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Mensajes Automáticos */}
        <div className="bg-white rounded-[14px] border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
              <Mail className="w-5 h-5 text-gray-700" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Mensajes Automáticos</h2>
          </div>

          <div className="space-y-6">
            {/* Mensaje de acreditación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje de acreditación de Pesos Bausing
              </label>
              <textarea
                value={mensajes.acreditacion}
                onChange={(e) => setMensajes({ ...mensajes, acreditacion: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800"
                placeholder="Escribe tu mensaje aquí..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Variables disponibles: (nombre), (monto), (pedido)
              </p>
            </div>

            {/* Confirmación de pedido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmación de pedido
              </label>
              <textarea
                value={mensajes.confirmacion}
                onChange={(e) => setMensajes({ ...mensajes, confirmacion: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800"
                placeholder="Escribe tu mensaje aquí..."
              />
            </div>

            {/* Pedido en camino */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pedido en camino
              </label>
              <textarea
                value={mensajes.enCamino}
                onChange={(e) => setMensajes({ ...mensajes, enCamino: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800"
                placeholder="Escribe tu mensaje aquí..."
              />
            </div>
          </div>
        </div>

        {/* Seguridad */}
        <div className="bg-white rounded-[14px] border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
              <Shield className="w-5 h-5 text-gray-700" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Seguridad</h2>
          </div>

          <div className="space-y-6">
            {/* Monto máximo de carga */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto máximo de carga manual de billetera sin aprobación
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">$</span>
                <input
                  type="number"
                  value={seguridad.montoMaximoCarga}
                  onChange={(e) => setSeguridad({ ...seguridad, montoMaximoCarga: e.target.value })}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Cargas superiores requieren aprobación de un supervisor
              </p>
            </div>

            {/* Registrar cambios */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registrar todos los cambios en la base de datos
                </label>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={seguridad.registrarCambios}
                  onChange={(e) => setSeguridad({ ...seguridad, registrarCambios: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Comentario obligatorio */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requerir comentario obligatorio en ajustes manuales
                </label>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={seguridad.comentarioObligatorio}
                  onChange={(e) => setSeguridad({ ...seguridad, comentarioObligatorio: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Botón Guardar */}
      <div className="flex justify-end mt-8 mb-4">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Guardar Configuración
        </button>
      </div>
    </div>
  );
}

