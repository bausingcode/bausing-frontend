"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Instagram, Facebook, MapPin } from "lucide-react";
import { getFooterData, getLocalPageImage } from "@/lib/api";
import wsrvLoader from "@/lib/wsrvLoader";

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

export default function LocalPage() {
  const [footerData, setFooterData] = useState<{
    instagram_url: string | null;
    facebook_url: string | null;
    tiktok_url: string | null;
  }>({
    instagram_url: "#",
    facebook_url: "#",
    tiktok_url: "#",
  });
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadFooterData = async () => {
      try {
        const data = await getFooterData();
        setFooterData({
          instagram_url: data.instagram_url || "#",
          facebook_url: data.facebook_url || "#",
          tiktok_url: data.tiktok_url || "#",
        });
      } catch (error) {
        console.error("Error loading footer data:", error);
      }
    };
    loadFooterData();
  }, []);

  useEffect(() => {
    const loadLocalImage = async () => {
      try {
        const imageUrl = await getLocalPageImage();
        if (imageUrl) {
          setLocalImageUrl(imageUrl);
        } else {
          // Fallback a imagen por defecto si no hay imagen configurada
          setLocalImageUrl("https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop");
        }
      } catch (error) {
        console.error("Error loading local image:", error);
        // Fallback a imagen por defecto si falla
        setLocalImageUrl("https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop");
      }
    };
    loadLocalImage();
  }, []);

  const address = "Cnel. Juan P. Pringles 839, X5004 Córdoba";
  // Usando el formato de embed estándar de Google Maps con la dirección
  // Este formato funciona sin API key
  const mapsEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <main className="flex-1 py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header Section */}
          <div className="text-center mb-10 md:mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-[#00C1A7]/15 text-[#00C1A7] mb-3">
              Visitanos
            </span>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 leading-tight">
              Vení a conocer nuestro local
            </h1>
            <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Te esperamos en Córdoba para que conozcas nuestros productos en persona.
            </p>
          </div>

          {/* Mobile Layout */}
          <div className="lg:hidden space-y-6">
            {/* Local Image Section */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {localImageUrl ? (
                <img
                  src={localImageUrl}
                  alt="Nuestro local"
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    // Fallback a wsrvLoader si la imagen directa falla
                    const target = e.target as HTMLImageElement;
                    if (target.src !== wsrvLoader({ src: localImageUrl, width: 1200 })) {
                      target.src = wsrvLoader({ src: localImageUrl, width: 1200 });
                    } else {
                      // Si wsrvLoader también falla, usar imagen por defecto
                      target.src = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop";
                    }
                  }}
                />
              ) : (
                <img
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop"
                  alt="Nuestro local"
                  className="w-full h-auto object-cover"
                />
              )}
            </div>

            {/* Address Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-[#00C1A7] flex-shrink-0 mt-1" strokeWidth={1.5} />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Dirección
                  </h2>
                  <p className="text-base text-gray-700 mb-4 leading-relaxed">
                    {address}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[#00C1A7] hover:text-[#00A892] font-medium transition-colors group"
                  >
                    <span>Abrir en Google Maps</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Map Section */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <iframe
                src={mapsEmbedUrl}
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full"
              />
            </div>

            {/* Social Media Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-3 text-center text-sm md:text-base">Seguinos</h4>
              <div className="flex justify-center gap-2 md:gap-3">
                {footerData.instagram_url && (
                  <a 
                    href={footerData.instagram_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-900 transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-4 h-4 md:w-5 md:h-5" />
                  </a>
                )}
                {footerData.facebook_url && (
                  <a 
                    href={footerData.facebook_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-900 transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-4 h-4 md:w-5 md:h-5" />
                  </a>
                )}
                {footerData.tiktok_url && (
                  <a 
                    href={footerData.tiktok_url} 
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

          {/* Desktop Layout: 3 columnas izquierda, mapa derecha */}
          <div className="hidden lg:grid grid-cols-3 gap-8">
            {/* Left Column: Image, Address and Social Media */}
            <div className="space-y-6">
              {/* Local Image Section */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {localImageUrl ? (
                  <img
                    src={localImageUrl}
                    alt="Nuestro local"
                    className="w-full h-auto object-cover"
                    onError={(e) => {
                      // Fallback a wsrvLoader si la imagen directa falla
                      const target = e.target as HTMLImageElement;
                      if (target.src !== wsrvLoader({ src: localImageUrl, width: 1200 })) {
                        target.src = wsrvLoader({ src: localImageUrl, width: 1200 });
                      } else {
                        // Si wsrvLoader también falla, usar imagen por defecto
                        target.src = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop";
                      }
                    }}
                  />
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop"
                    alt="Nuestro local"
                    className="w-full h-auto object-cover"
                  />
                )}
              </div>

              {/* Address Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-[#00C1A7] flex-shrink-0 mt-1" strokeWidth={1.5} />
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                      Dirección
                    </h2>
                    <p className="text-base text-gray-700 mb-4 leading-relaxed">
                      {address}
                    </p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[#00C1A7] hover:text-[#00A892] font-medium transition-colors group"
                    >
                      <span>Abrir en Google Maps</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Social Media Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm md:text-base">Seguinos</h4>
                <div className="flex gap-2 md:gap-3">
                  {footerData.instagram_url && (
                    <a 
                      href={footerData.instagram_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-900 transition-colors"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-4 h-4 md:w-5 md:h-5" />
                    </a>
                  )}
                  {footerData.facebook_url && (
                    <a 
                      href={footerData.facebook_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-900 transition-colors"
                      aria-label="Facebook"
                    >
                      <Facebook className="w-4 h-4 md:w-5 md:h-5" />
                    </a>
                  )}
                  {footerData.tiktok_url && (
                    <a 
                      href={footerData.tiktok_url} 
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

            {/* Right Column: Map */}
            <div className="col-span-2">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <iframe
                  src={mapsEmbedUrl}
                  width="100%"
                  height="600"
                  style={{ border: 0, display: 'block' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
