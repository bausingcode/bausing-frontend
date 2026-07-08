"use client";

import { useEffect, useState } from "react";
import { Instagram, Facebook, X } from "lucide-react";
import { getFooterData, fetchCategories, type Category } from "@/lib/api";

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

const ARREPENTIMIENTO_PHONE = "+54 9 3512 44-9293";
const ARREPENTIMIENTO_WA = "5493512449293";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [showArrepentimiento, setShowArrepentimiento] = useState(false);
  const [mainCategories, setMainCategories] = useState<Category[]>([]);

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
        const [data, cats] = await Promise.all([getFooterData(), fetchCategories()]);
        const roots = cats
          .filter((c) => !c.parent_id)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
        setMainCategories(roots);
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
    <>
    <footer className="bg-[#FAFAFA] text-gray-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8 md:mb-12">
          {/* Productos */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 md:mb-4 text-sm md:text-base">Productos</h4>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-gray-700">
              {mainCategories.map((cat) => {
                const slug = cat.name
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .replace(/\s+/g, "-")
                  .replace(/[^a-z0-9-]/g, "");
                return (
                  <li key={cat.id}>
                    <a href={`/catalogo/${slug}`} className="hover:text-gray-900 transition-colors relative group inline-block">
                      {cat.name}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-700 group-hover:w-full transition-all duration-300 ease-in-out"></span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Sobre Bausing */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 md:mb-4 text-sm md:text-base">Sobre Bausing</h4>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-gray-700">
              <li><a href="/blog" className="hover:text-gray-900 transition-colors relative group inline-block">Blog<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-700 group-hover:w-full transition-all duration-300 ease-in-out"></span></a></li>
              <li><a href="/local" className="hover:text-gray-900 transition-colors relative group inline-block">Local<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-700 group-hover:w-full transition-all duration-300 ease-in-out"></span></a></li>
              <li><a href="/terminos-y-condiciones" className="hover:text-gray-900 transition-colors relative group inline-block">Términos y condiciones<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-700 group-hover:w-full transition-all duration-300 ease-in-out"></span></a></li>
              <li><a href="/politica-de-privacidad" className="hover:text-gray-900 transition-colors relative group inline-block">Política de privacidad<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-700 group-hover:w-full transition-all duration-300 ease-in-out"></span></a></li>
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 md:mb-4 text-sm md:text-base">Ayuda</h4>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-gray-700">
              <li><a href="/preguntas-frecuentes" className="hover:text-gray-900 transition-colors relative group inline-block">Preguntas frecuentes<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-700 group-hover:w-full transition-all duration-300 ease-in-out"></span></a></li>
              <li><a href={`https://wa.me/${(footerData.phone || "").replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors relative group inline-block">Asesoramiento<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-700 group-hover:w-full transition-all duration-300 ease-in-out"></span></a></li>
              {email && (
                <li>
                  <a href={`mailto:${email}`} className="hover:text-gray-900 transition-colors relative group inline-block break-all">
                    {email}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-700 group-hover:w-full transition-all duration-300 ease-in-out"></span>
                  </a>
                </li>
              )}
              <li>
                <button
                  onClick={() => setShowArrepentimiento(true)}
                  className="inline-flex items-center gap-1.5 text-[#00C1A7] hover:text-[#00A892] font-medium transition-colors relative group cursor-pointer"
                >
                  Botón de arrepentimiento
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#00C1A7] group-hover:w-full transition-all duration-300 ease-in-out"></span>
                </button>
              </li>
            </ul>
          </div>

          {/* Comunidad */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 md:mb-4 text-sm md:text-base">Comunidad</h4>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm text-gray-700">
              <li><a href="/club-beneficios" className="hover:text-gray-900 transition-colors relative group inline-block">Club de beneficios<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-700 group-hover:w-full transition-all duration-300 ease-in-out"></span></a></li>
              <li><a href="/programa-de-referidos" className="hover:text-gray-900 transition-colors relative group inline-block">Programa de referidos<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-700 group-hover:w-full transition-all duration-300 ease-in-out"></span></a></li>
              <li><a href="/programa-de-creadores" className="hover:text-gray-900 transition-colors relative group inline-block">Programa de creadores<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-700 group-hover:w-full transition-all duration-300 ease-in-out"></span></a></li>
            </ul>
          </div>

          {/* Seguinos */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 md:mb-4 text-sm md:text-base">Seguinos</h4>
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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 md:gap-x-6">
            <a
              href="https://qr.afip.gob.ar/?qr=9JoX-GlIZcP2Y65SmmINzQ,,"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 block h-[52px] w-[52px] border-0 bg-contain bg-center bg-no-repeat md:h-[60px] md:w-[60px]"
              style={{
                backgroundImage:
                  "url(https://www.afip.gob.ar/images/f960/DATAWEB.jpg)",
              }}
              aria-label="Comprobante fiscal electrónico AFIP"
            />
            <p className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-gray-700 md:text-sm">
              <span>&copy; {currentYear} BAUSING. Todos los derechos reservados.</span>
              <span className="text-gray-400 select-none" aria-hidden>
                &middot;
              </span>
              <span className="inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5">
                <span>
                  Desarrollado <span className="mr-1">por</span>
                </span>
                <a
                  href="https://nuba.studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex font-bold leading-none tracking-tight text-gray-900 transition-opacity hover:opacity-70"
                  style={{
                    fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
                  }}
                  aria-label="Nuba Studio"
                >
                  <span className="flex flex-col items-start">
                    <span>nuba</span>
                    <span>studio</span>
                  </span>
                </a>
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>

      {/* Modal de arrepentimiento */}

      {showArrepentimiento && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setShowArrepentimiento(false)}
        >
          <div
            className="bg-white rounded-[14px] border border-gray-200 shadow-xl w-full max-w-sm p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowArrepentimiento(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-semibold text-gray-900 mb-2">
              Botón de arrepentimiento
            </h2>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              Si te arrepentiste de una compra, podés contactarnos para solicitar la cancelación o devolución.
            </p>

            <a
              href={`https://wa.me/${ARREPENTIMIENTO_WA}?text=Hola%2C%20quiero%20ejercer%20el%20bot%C3%B3n%20de%20arrepentimiento%20por%20una%20compra.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#00C1A7] hover:bg-[#00A892] text-white text-sm font-medium py-2.5 rounded-lg transition-colors mb-3"
            >
              Contactar por WhatsApp
            </a>
            <a
              href={`tel:${ARREPENTIMIENTO_PHONE.replace(/\s/g, "")}`}
              className="flex items-center justify-center w-full border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {ARREPENTIMIENTO_PHONE}
            </a>
          </div>
        </div>
      )}
    </>
  );
}

