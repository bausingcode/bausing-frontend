"use client";

import { HeroImage } from "@/lib/api";

interface VideoSectionProps {
  videoData: HeroImage | null;
}

export default function VideoSection({ videoData }: VideoSectionProps) {
  // Si no hay datos, no renderizar nada
  if (!videoData || !videoData.image_url) {
    return null;
  }


  return (
    <section className="bg-white py-4 md:py-6 lg:py-0">
      <div className="container mx-auto px-4">
        <div className="relative w-full">
          <div 
            className="relative rounded-[10px] md:rounded-xl overflow-hidden w-full aspect-[16/9] md:aspect-[21/9] lg:aspect-[24/9]"
            style={{ minHeight: '200px' }}
          >
            {/* Video */}
            <div className="absolute inset-0 w-full h-full">
              <video
                src={videoData.image_url}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                controls={false}
                style={{ pointerEvents: 'none' }}
              />
            </div>

            {/* Overlay con título, descripción y botón a la izquierda */}
            {(videoData.title || videoData.subtitle || videoData.cta_text) && (
              <div className="absolute inset-0 z-10 flex items-center justify-start pointer-events-none pt-16 md:pt-24 lg:pt-32">
                <div className="ml-6 md:ml-12 lg:ml-16 xl:ml-20 max-w-[42%] md:max-w-[48%] lg:max-w-[52%] pointer-events-auto">
                  {/* Título */}
                  {videoData.title && (
                    <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-2 md:mb-3.5 lg:mb-5 drop-shadow-lg leading-tight">
                      {videoData.title}
                    </h2>
                  )}
                  
                  {/* Descripción */}
                  {videoData.subtitle && (
                    <p className="text-sm md:text-base lg:text-lg xl:text-xl text-white mb-3 md:mb-5 lg:mb-7 drop-shadow-md leading-relaxed">
                      {videoData.subtitle}
                    </p>
                  )}
                  
                  {/* Botón */}
                  {videoData.cta_text && videoData.cta_link && (
                    <a
                      href={videoData.cta_link}
                      className="inline-block bg-[#00C1A7] hover:bg-[#00A892] text-white font-semibold px-5 md:px-7 lg:px-9 py-2.5 md:py-3.5 rounded-full transition-colors duration-300 shadow-lg hover:shadow-xl text-sm md:text-base lg:text-lg"
                    >
                      {videoData.cta_text}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
