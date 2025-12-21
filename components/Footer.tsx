"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Instagram, Facebook } from "lucide-react";

// Icono de TikTok
const TikTok = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

export default function Footer() {
  const [currentYear, setCurrentYear] = useState<number>(2024);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="bg-[#FAFAFA] text-gray-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between mb-12">
          {/* Categorías */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 capitalize">Categorías</h4>
            <ul className="space-y-1.5 text-sm text-gray-700">
              <li><a href="#" className="hover:text-gray-900 transition-colors">Colchones</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">Sommiers</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors capitalize">Accesorios de descanso</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors capitalize">Electrodomésticos</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">Muebles de Cocina</a></li>
            </ul>
          </div>

          {/* Nosotros */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 capitalize">Nosotros</h4>
            <ul className="space-y-1.5 text-sm text-gray-700">
              <li><a href="#" className="hover:text-gray-900 transition-colors capitalize">¿Qué Es Bausing?</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors capitalize">Preguntas Frecuentes</a></li>
              <li><a href="/blog" className="hover:text-gray-900 transition-colors capitalize">Blog</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors capitalize">Donde Encontrarnos</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">Términos y Condiciones</a></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 capitalize">Contacto</h4>
            <ul className="space-y-1.5 text-sm text-gray-700">
              <li>+54 9 11 4049-0344</li>
              <li><a href="mailto:hola@bausing.com" className="hover:text-gray-900 transition-colors">hola@bausing.com</a></li>
              <li>Av. Corrientes 1234, Córdoba, Argentina</li>
            </ul>
          </div>

          {/* Redes Sociales */}
          <div className="-ml-2">
            <h4 className="font-semibold text-gray-900 mb-4 whitespace-nowrap">Seguinos</h4>
            
            {/* Social Media Icons */}
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-900 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-900 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-900 transition-colors">
                <TikTok className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section - Copyright */}
        <div className="border-t border-gray-300 pt-8">
          <div className="flex items-center justify-center">
            <div className="text-sm text-gray-700">
              <p>&copy; {currentYear} BAUSING. Todos los derechos reservados.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

