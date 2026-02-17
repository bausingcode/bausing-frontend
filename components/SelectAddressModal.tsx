"use client";

import { useState, useEffect } from "react";
import { X, MapPin } from "lucide-react";
import { Address } from "@/lib/api";

interface SelectAddressModalProps {
  isOpen: boolean;
  addresses: Address[];
  onSelect: (addressId: string) => void;
  onClose: () => void;
}

export default function SelectAddressModal({
  isOpen,
  addresses,
  onSelect,
  onClose,
}: SelectAddressModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleSelect = () => {
    if (selectedAddressId) {
      onSelect(selectedAddressId);
      handleClose();
    }
  };

  const formatAddress = (address: Address) => {
    const parts = [
      address.street,
      address.number,
      address.city,
      address.postal_code,
      address.province,
    ].filter(Boolean);
    return parts.join(", ");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop oscuro */}
      <div
        className={`fixed inset-0 bg-black/50 z-[199] transition-opacity duration-300 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-out ${
            isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
          } pointer-events-auto`}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: '#00C1A720' }}>
                  <MapPin className="w-5 h-5" style={{ color: '#00C1A7' }} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Selecciona una dirección
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Elige una dirección para calcular los precios
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Addresses List */}
            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {addresses.map((address) => {
                const isSelected = selectedAddressId === address.id;
                return (
                  <button
                    key={address.id}
                    onClick={() => setSelectedAddressId(address.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? ""
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    style={isSelected ? {
                      borderColor: '#00C1A7',
                      backgroundColor: '#00C1A720'
                    } : {}}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={isSelected ? {
                          borderColor: '#00C1A7',
                          backgroundColor: '#00C1A7'
                        } : {
                          borderColor: '#D1D5DB'
                        }}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 mb-1">
                          {address.full_name || address.contact_name || "Sin nombre"}
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          {formatAddress(address)}
                        </div>
                        {address.phone && (
                          <div className="text-xs text-gray-500">
                            {address.phone}
                          </div>
                        )}
                        {address.is_default && (
                          <span 
                            className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded"
                            style={{ backgroundColor: '#00C1A720', color: '#00C1A7' }}
                          >
                            Predeterminada
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSelect}
                disabled={!selectedAddressId}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  !selectedAddressId ? "bg-gray-300 text-gray-500 cursor-not-allowed" : ""
                }`}
                style={selectedAddressId ? {
                  backgroundColor: '#00C1A7',
                  color: 'white'
                } : {}}
                onMouseEnter={(e) => {
                  if (selectedAddressId) {
                    e.currentTarget.style.backgroundColor = '#00B39A';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedAddressId) {
                    e.currentTarget.style.backgroundColor = '#00C1A7';
                  }
                }}
              >
                Usar esta dirección
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
