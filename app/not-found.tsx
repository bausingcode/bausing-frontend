"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Home, Sofa } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const QUICK_LINKS = [
  { name: "Colchones", href: "/catalogo/colchones" },
  { name: "Sommiers", href: "/catalogo/sommier-y-colchon" },
  { name: "Almohadas y accesorios", href: "/catalogo/almohadas-y-accesorios" },
  { name: "Electrodomésticos", href: "/catalogo/electrodomesticos" },
  { name: "Muebles", href: "/catalogo/muebles" },
  { name: "Preguntas frecuentes", href: "/preguntas-frecuentes" },
];

export default function NotFound() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/catalogo?search=${encodeURIComponent(q)}` : "/catalogo");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24">
        <div className="w-full max-w-lg flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-[#00C1A7]/10 mb-6">
            <Sofa className="w-10 h-10 text-[#00C1A7]" strokeWidth={1.5} />
          </div>

          <p className="text-sm font-semibold tracking-widest text-[#00A892] uppercase mb-2">
            Error 404
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Esta página no la encontramos
          </h1>
          <p className="text-sm md:text-base text-gray-600 mb-8 max-w-md">
            Puede que el link esté roto, el producto ya no exista o hayas
            escrito mal la dirección. Buscá lo que necesitás o volvé al inicio.
          </p>

          <form onSubmit={handleSearch} className="relative w-full mb-10">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar colchones, sommiers, almohadas..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#00C1A7]/25 focus:border-[#00C1A7]/45 text-sm text-gray-900 placeholder:text-gray-500"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Buscar"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#00C1A7] hover:bg-[#00A892] text-white text-sm font-medium rounded-full transition-colors mb-10"
          >
            <Home className="w-4 h-4" />
            Volver al inicio
          </Link>

          <div className="w-full border-t border-gray-100 pt-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Quizás te interesa
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-700 hover:border-[#00C1A7]/50 hover:text-[#00A892] hover:bg-[#00C1A7]/5 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
