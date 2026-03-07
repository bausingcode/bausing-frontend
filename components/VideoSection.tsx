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
              <div className="absolute inset-0 z-10 flex items-center pointer-events-none">
                <div className="ml-4 md:ml-8 lg:ml-12 max-w-[40%] md:max-w-[45%] lg:max-w-[50%] pointer-events-auto">
                  {/* Título */}
                  {videoData.title && (
                    <h2 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-2 md:mb-3 lg:mb-4 drop-shadow-lg">
                      {videoData.title}
                    </h2>
                  )}
                  
                  {/* Descripción */}
                  {videoData.subtitle && (
                    <p className="text-xs md:text-sm lg:text-base xl:text-lg text-white mb-3 md:mb-4 lg:mb-6 drop-shadow-md">
                      {videoData.subtitle}
                    </p>
                  )}
                  
                  {/* Botón */}
                  {videoData.cta_text && videoData.cta_link && (
                    <a
                      href={videoData.cta_link}
                      className="inline-block bg-[#00C1A7] hover:bg-[#00A892] text-white font-semibold px-4 md:px-6 lg:px-8 py-2 md:py-3 rounded-full transition-colors duration-300 shadow-lg hover:shadow-xl text-xs md:text-sm lg:text-base"
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
