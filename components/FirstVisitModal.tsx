"use client";

import { useState, useEffect, useCallback } from "react";
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

  const handleClose = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "1");
    }
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[300] w-[calc(100vw-2rem)] max-w-[380px]">
      <section
        role="dialog"
        aria-labelledby="first-visit-title"
        aria-describedby="first-visit-desc"
        className="animate-first-visit relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_20px_50px_-12px_rgba(16,24,40,0.28)]"
      >
        {/* Resplandor sutil de marca en la esquina */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#00C1A7]/15 blur-2xl"
        />

        <button
          type="button"
          onClick={handleClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C1A7]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E5F9F6] py-1.5 pl-2.5 pr-3 text-xs font-semibold text-[#007A6B]">
            <Gift className="h-3.5 w-3.5" strokeWidth={2} />
            Oferta de bienvenida
          </span>

          <h2
            id="first-visit-title"
            className="mt-4 text-2xl font-bold leading-tight tracking-tight text-[#101828]"
          >
            ¡Creá tu cuenta!
          </h2>
          <p
            id="first-visit-desc"
            className="mt-2 text-[15px] leading-relaxed text-gray-600"
          >
            Registrate y accedé a ofertas exclusivas y a la mejor financiación
            para colchones y sommiers.
          </p>

          <div className="mt-6 flex flex-col gap-1">
            <Link
              href="/register"
              onClick={handleClose}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00C1A7] px-5 py-3.5 text-[15px] font-semibold text-white shadow-md transition-colors hover:bg-[#00A892] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#101828] focus-visible:ring-offset-2"
            >
              <UserPlus className="h-4 w-4" strokeWidth={2.25} />
              Crear cuenta
            </Link>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl py-3 text-sm font-medium text-gray-500 transition-colors hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C1A7]"
            >
              Ahora no, seguir navegando
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
