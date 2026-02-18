"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, UserPlus, Gift } from "lucide-react";

const STORAGE_KEY = "bausing_first_visit_seen";

export default function FirstVisitModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setIsOpen(true);
    }
  }, [mounted]);

  const handleClose = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "1");
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[300] max-w-md w-[calc(100vw-2rem)]">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 border border-gray-200">
        {/* Decorative top bar */}
        <div className="h-1.5 w-full bg-[#00C1A7]" />

        <div className="p-6 md:p-8">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-4">
              <UserPlus className="w-8 h-8 text-[#00C1A7]" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              ¡Crea tu cuenta!
            </h2>
            <div className="flex items-center gap-2 text-[#00C1A7] mb-3">
              <Gift className="w-5 h-5" strokeWidth={1.5} />
              <span className="font-semibold text-sm uppercase tracking-wide">
                Oferta de bienvenida
              </span>
            </div>
            <p className="text-gray-600 text-sm md:text-base mb-6 leading-relaxed">
              Registrate y accedé a <strong>envío gratis</strong> en tu primera compra,
              ofertas exclusivas y la mejor financiación para colchones y sommiers.
            </p>

            <div className="flex flex-col gap-3 w-full">
              <Link
                href="/register"
                onClick={handleClose}
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-5 rounded-xl bg-[#00C1A7] text-white font-semibold hover:bg-[#00A892] transition-colors shadow-md hover:shadow-lg"
              >
                Crear cuenta
                <UserPlus className="w-4 h-4" strokeWidth={2} />
              </Link>
              <button
                onClick={handleClose}
                className="text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors py-2"
              >
                Ahora no, seguir navegando
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
