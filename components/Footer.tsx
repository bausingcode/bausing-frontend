"use client";

import { ArrowRight, Instagram, Facebook, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#FAFAFA] text-gray-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-4 gap-2 mb-12">
          {/* Categorías */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 capitalize">Categorías</h4>
            <ul className="space-y-1.5 text-sm text-gray-700">
              <li><a href="#" className="hover:text-gray-900 transition-colors">Colchones</a></li>
              <li><a href="#" className="hover:text-gray-900 transition-colors">Sommiers y Bases</a></li>
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
              <li><a href="#" className="hover:text-gray-900 transition-colors capitalize">Blog</a></li>
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

          {/* Newsletter y Redes Sociales */}
          <div className="-ml-2">
            <h4 className="font-semibold text-gray-900 mb-4 whitespace-nowrap">Suscribite a nuestro newsletter!</h4>
            <form className="mb-6">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Ingresá tu E-mail"
                  className="w-full px-6 py-3.5 pr-12 bg-white border border-gray-300 rounded-full text-sm font-normal text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00C1A7]"
                />
                <button
                  type="submit"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-900 hover:text-gray-700 transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
            
            {/* Social Media Icons */}
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-900 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-900 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-900 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section - Copyright */}
        <div className="border-t border-gray-300 pt-8">
          <div className="flex items-center justify-center">
            <div className="text-sm text-gray-700">
              <p>&copy; {new Date().getFullYear()} BAUSING. Todos los derechos reservados.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

