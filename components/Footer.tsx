"use client";

import { useEffect, useState } from "react";
import { Instagram, Facebook } from "lucide-react";
import { getFooterData } from "@/lib/api";

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
  const currentYear = new Date().getFullYear();
  
  const [footerData, setFooterData] = useState<{
    phone: string | null;
    email: string | null;
    address: string | null;
    instagram_url: string | null;
    facebook_url: string | null;
    tiktok_url: string | null;
  }>({
    phone: "+54 9 11 4049-0344",
    email: "hola@bausing.com",
    address: "Av. Corrientes 1234, Córdoba, Argentina",
    instagram_url: "#",
    facebook_url: "#",
    tiktok_url: "#",
  });

  useEffect(() => {
    const loadFooterData = async () => {
      try {
        const data = await getFooterData();
        setFooterData({
          phone: data.phone || "+54 9 11 4049-0344",
          email: data.email || "hola@bausing.com",
          address: data.address || "Av. Corrientes 1234, Córdoba, Argentina",
          instagram_url: data.instagram_url || "#",
          facebook_url: data.facebook_url || "#",
          tiktok_url: data.tiktok_url || "#",
        });
      } catch (error) {
        console.error("Error loading footer data:", error);
        // Usar valores por defecto ya establecidos
      }
    };
    loadFooterData();
  }, []);

  const phone = footerData.phone || "+54 9 11 4049-0344";
  const email = footerData.email || "hola@bausing.com";
  const address = footerData.address || "Av. Corrientes 1234, Córdoba, Argentina";
  const instagramUrl = footerData.instagram_url || "#";
  const facebookUrl = footerData.facebook_url || "#";
  const tiktokUrl = footerData.tiktok_url || "#";

  return (
    <footer className="bg-[#FAFAFA] text-gray-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 md:mb-12">
          {/* Categorías */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 md:mb-4 capitalize text-sm md:text-base">Categorías</h4>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-gray-700">
              <li><a href="/catalogo/colchones" className="hover:text-gray-900 transition-colors relative group inline-block">Colchones<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-700 group-hover:w-full transition-all duration-300 ease-in-out"></span></a></li>
              <li><a href="/catalogo/sommiers" className="hover:text-gray-900 transition-colors relative group inline-block">Sommier y colchón<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-700 group-hover:w-full transition-all duration-300 ease-in-out"></span></a></li>
              <li><a href="/catalogo/accesorios" className="hover:text-gray-900 transition-colors capitalize relative group inline-block">Almohadas<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-700 group-hover:w-full transition-all duration-300 ease-in-out"></span></a></li>
              <li><a href="/catalogo/electrodomesticos" className="hover:text-gray-900 transition-colors capitalize relative group inline-block">Electrodomésticos<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-700 group-hover:w-full transition-all duration-300 ease-in-out"></span></a></li>
              <li><a href="/catalogo/otros" className="hover:text-gray-900 transition-colors relative group inline-block">Otros<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-700 group-hover:w-full transition-all duration-300 ease-in-out"></span></a></li>
            </ul>
          </div>

          {/* Nosotros */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 md:mb-4 capitalize text-sm md:text-base">Nosotros</h4>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-gray-700">
              <li><a href="/blog" className="hover:text-gray-900 transition-colors capitalize relative group inline-block">Blog<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-700 group-hover:w-full transition-all duration-300 ease-in-out"></span></a></li>
              <li><a href="/local" className="hover:text-gray-900 transition-colors capitalize relative group inline-block">Local<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-700 group-hover:w-full transition-all duration-300 ease-in-out"></span></a></li>
              <li><a href="/terminos-y-condiciones" className="hover:text-gray-900 transition-colors relative group inline-block">Términos<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-700 group-hover:w-full transition-all duration-300 ease-in-out"></span></a></li>
              <li><a href="/politica-de-privacidad" className="hover:text-gray-900 transition-colors relative group inline-block">Privacidad<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-700 group-hover:w-full transition-all duration-300 ease-in-out"></span></a></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 md:mb-4 capitalize text-sm md:text-base">Contacto</h4>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-gray-700">
              {phone && <li>{phone}</li>}
              {email && (
                <li>
                  <a href={`mailto:${email}`} className="hover:text-gray-900 transition-colors relative group inline-block break-all">
                    {email}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-700 group-hover:w-full transition-all duration-300 ease-in-out"></span>
                  </a>
                </li>
              )}
              {address && <li className="hidden md:block">{address}</li>}
            </ul>
          </div>

          {/* Redes Sociales */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 md:mb-4 whitespace-nowrap text-sm md:text-base">Seguinos</h4>
            
            {/* Social Media Icons */}
            <div className="flex gap-2 md:gap-3">
              {instagramUrl && (
                <a 
                  href={instagramUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-900 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4 md:w-5 md:h-5" />
                </a>
              )}
              {facebookUrl && (
                <a 
                  href={facebookUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-900 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4 md:w-5 md:h-5" />
                </a>
              )}
              {tiktokUrl && (
                <a 
                  href={tiktokUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-900 transition-colors"
                  aria-label="TikTok"
                >
                  <TikTok className="w-4 h-4 md:w-5 md:h-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section - Copyright */}
        <div className="border-t border-gray-300 pt-6 md:pt-8">
          <div className="flex items-center justify-center">
            <div className="text-xs md:text-sm text-gray-700 text-center">
              <p>&copy; {currentYear} BAUSING. Todos los derechos reservados.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

