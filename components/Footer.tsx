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
              {phone && <li>{phone}</li>}
              {email && (
                <li>
                  <a href={`mailto:${email}`} className="hover:text-gray-900 transition-colors">
                    {email}
                  </a>
                </li>
              )}
              {address && <li>{address}</li>}
            </ul>
          </div>

          {/* Redes Sociales */}
          <div className="-ml-2">
            <h4 className="font-semibold text-gray-900 mb-4 whitespace-nowrap">Seguinos</h4>
            
            {/* Social Media Icons */}
            <div className="flex gap-3">
              {instagramUrl && (
                <a 
                  href={instagramUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-900 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {facebookUrl && (
                <a 
                  href={facebookUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-900 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {tiktokUrl && (
                <a 
                  href={tiktokUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-900 transition-colors"
                  aria-label="TikTok"
                >
                  <TikTok className="w-5 h-5" />
                </a>
              )}
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

