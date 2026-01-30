"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";
import ConfirmModal from "./ConfirmModal";

interface Client {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  localidad: string;
  compras: number;
  ultimaCompra: string;
  saldoBilletera: string;
  estado: string;
  is_suspended?: boolean;
}

interface ClientDetailOverlayProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onSuspend?: (userId: string, currentStatus: boolean) => void;
}

export default function ClientDetailOverlay({
  client,
  isOpen,
  onClose,
  onSuspend,
}: ClientDetailOverlayProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Manejar el renderizado y la animación de apertura
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Pequeño delay para activar la animación
      setTimeout(() => setIsClosing(false), 10);
    } else {
      setIsClosing(true);
      // Esperar a que termine la animación antes de desmontar
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 300); // Duración de la animación
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleSuspendClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmSuspend = () => {
    if (onSuspend) {
      onSuspend(client.id, client.is_suspended || false);
      // Cerrar el overlay después de suspender/reactivar
      setTimeout(() => {
        handleClose();
      }, 500);
    }
    setShowConfirmModal(false);
  };

  if (!shouldRender) return null;

  return (
    <>
      {/* Backdrop oscuro */}
      <div
        className={`fixed inset-0 bg-black/50 z-[99] transition-opacity duration-300 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
      />
      
      {/* Overlay Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[100] transform transition-transform duration-300 ease-out ${
          isClosing ? "translate-x-full" : "translate-x-0"
        }`}
        style={{
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Detalles del Cliente
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Información Personal */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Información Personal
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre Completo
                    </label>
                    <p className="text-sm text-gray-900 mt-1">{client.nombre}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </label>
                    <p className="text-sm text-gray-900 mt-1">{client.telefono}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </label>
                    <p className="text-sm text-gray-900 mt-1">{client.email}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Localidad
                    </label>
                    <p className="text-sm text-gray-900 mt-1">{client.localidad}</p>
                  </div>
                </div>
              </div>

              {/* Información Comercial */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Información Comercial
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total de Compras
                    </label>
                    <p className="text-sm text-gray-900 mt-1">{client.compras}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Última Compra
                    </label>
                    <p className="text-sm text-gray-900 mt-1">{client.ultimaCompra}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saldo en Billetera
                    </label>
                    <p className="text-sm font-medium mt-1" style={{ color: '#155DFC' }}>
                      {client.saldoBilletera}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </label>
                    <div className="mt-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        client.is_suspended 
                          ? "bg-red-100 text-red-700" 
                          : client.estado === "Activo"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {client.estado}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 space-y-3">
            {onSuspend && (
              <button
                onClick={handleSuspendClick}
                className={`w-full px-4 py-2 rounded-[6px] font-medium transition-colors cursor-pointer ${
                  client.is_suspended
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {client.is_suspended ? "Reactivar Usuario" : "Suspender Usuario"}
              </button>
            )}
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-[6px] font-medium hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSuspend}
        title={client.is_suspended ? "Reactivar Usuario" : "Suspender Usuario"}
        message={
          client.is_suspended
            ? `¿Estás seguro de que deseas reactivar a ${client.nombre}? El usuario podrá iniciar sesión nuevamente.`
            : `¿Estás seguro de que deseas suspender a ${client.nombre}? El usuario no podrá iniciar sesión hasta que sea reactivado.`
        }
        confirmText={client.is_suspended ? "Reactivar" : "Suspender"}
        cancelText="Cancelar"
        variant={client.is_suspended ? "info" : "danger"}
      />
    </>
  );
}

