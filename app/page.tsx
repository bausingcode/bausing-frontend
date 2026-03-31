import type { Metadata } from "next";
import {
  Bed,
  Sofa,
  Microwave,
  ArrowRight,
  Award,
  Factory,
  Truck,
  CreditCard,
  BookOpen,
  MessageCircle,
  HelpCircle,
  MapPin,
} from "lucide-react";
import ProductCard from "@/components/ProductCard";
import BannerCarousel from "@/components/BannerCarousel";
import Navbar from "@/components/Navbar";
import dynamic from "next/dynamic";
import wsrvLoader from "@/lib/wsrvLoader";
import { fetchHeroImages, HeroImage, fetchActiveEvent } from "@/lib/api";
import HomeProducts from "@/components/HomeProducts";
import ReviewsSectionLazy from "@/components/ReviewsSectionLazy";
import InfoCarousel from "@/components/InfoCarousel";
import FirstVisitModal from "@/components/FirstVisitModal";
import WhatsAppLink from "@/components/WhatsAppLink";
import InfoBannerCarousel from "@/components/InfoBannerCarousel";
import ProductCarousel from "@/components/ProductCarousel";
import VideoSection from "@/components/VideoSection";
import {
  getSiteUrl,
  SITE_TAGLINE,
  titleWithBrand,
} from "@/lib/seo/site";

const Footer = dynamic(() => import("@/components/Footer"), {
  loading: () => null,
  ssr: true,
});

export const metadata: Metadata = {
  title: "Inicio",
  description: SITE_TAGLINE,
  alternates: { canonical: `${getSiteUrl()}/` },
  openGraph: {
    title: titleWithBrand("Inicio"),
    description: SITE_TAGLINE,
    url: getSiteUrl(),
  },
  twitter: {
    title: titleWithBrand("Inicio"),
    description: SITE_TAGLINE,
  },
};

export default async function Home() {
  let heroImages: HeroImage[] = [];
  let infoBanners: HeroImage[] = [];
  let descuentazosBanner: HeroImage | null = null;
  let videoData: HeroImage | null = null;
  let activeEvent = null;

  try {
    const [allHeroImages, fetchedEvent] = await Promise.all([
      fetchHeroImages(undefined, true).catch(() => [] as HeroImage[]),
      fetchActiveEvent().catch(() => null),
    ]);

    heroImages = allHeroImages.filter((img) => img.position === 1);
    infoBanners = allHeroImages.filter((img) => img.position === 2);
    const descuentazosBanners = allHeroImages.filter((img) => img.position === 3);
    const fetchedVideos = allHeroImages.filter((img) => img.position === 6);
    descuentazosBanner = descuentazosBanners.length > 0 ? descuentazosBanners[0] : null;
    videoData = fetchedVideos.length > 0 ? fetchedVideos[0] : null;
    activeEvent = fetchedEvent;
  } catch (error) {
    console.error("Error fetching data:", error);
  }

  const heroSlides = heroImages.map((img, index) => ({
    id: parseInt(img.id.replace(/-/g, "").slice(0, 8), 16) || index + 1,
    heroId: img.id,
    url: img.image_url,
    alt: img.title || img.subtitle || "Banner",
    title: img.title,
    subtitle: img.subtitle,
    cta_text: img.cta_text,
    cta_link: img.cta_link,
  }));

  const infoBannerImages = infoBanners.map((img, index) => ({
    id: parseInt(img.id.slice(0, 8), 16) || img.id.charCodeAt(0) + index,
    url: img.image_url,
    alt: img.title || img.subtitle || "Banner informativo"
  }));

  const infoCards = [
    {
      title: "Elegí el colchón para vos",
      description:
        "Encontrá el modelo que va con cómo dormís y lo que buscás en tu descanso.",
    },
    {
      title: "Pagá cuando lo recibís",
      description:
        "Abonás cuando tenés el producto en casa, con la tranquilidad de verlo antes.",
    },
    {
      title: "5 años de garantía",
      description:
        "Garantía de 5 años pensada para todos nuestros colchones.",
    },
  ];


  return (
    <div className="min-h-screen bg-white">
      {/* Modal de primera visita: solo en home, se muestra si no lo vieron antes (localStorage) */}
      <FirstVisitModal />
      <Navbar event={activeEvent} />

      {heroSlides.length > 0 && (
        <BannerCarousel slides={heroSlides} autoPlayInterval={5000} />
      )}

      {/* Tres columnas informativas — debajo del hero; borde solo abajo, ancho pantalla */}
      <section className="bg-white">
        <div className="container mx-auto px-4 py-6 md:py-8 lg:py-6">
          {/* Mobile: carrusel horizontal */}
          <div className="mt-4 md:hidden max-w-5xl lg:max-w-6xl mx-auto">
            <div
              className="overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
              role="region"
              aria-label="Beneficios"
            >
              <div className="flex gap-6 px-1" style={{ width: "max-content" }}>
                {infoCards.map((item) => (
                  <div
                    key={item.title}
                    className="flex flex-col items-center text-center px-2 min-w-[calc(100vw-2rem)] flex-shrink-0 snap-start"
                  >
                    <h4 className="text-[#101828] font-bold text-sm md:text-base mb-2">
                      {item.title}
                    </h4>
                    <p className="text-[#64748B] text-xs md:text-sm leading-relaxed mb-4 flex-1 max-w-xs">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tablet y desktop: grid 3 columnas */}
          <div className="hidden md:grid grid-cols-3 gap-6 md:gap-8 lg:gap-8 max-w-5xl lg:max-w-6xl mx-auto">
            {infoCards.map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center px-2 md:px-3">
                <h4 className="text-[#101828] font-bold text-base md:text-[15px] lg:text-base mb-2">
                  {item.title}
                </h4>
                <p className="text-[#64748B] text-sm md:text-[13px] lg:text-sm leading-relaxed mb-4 flex-1 max-w-[14rem] md:max-w-none lg:max-w-xs">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div
          className="w-screen max-w-[100vw] relative left-1/2 -translate-x-1/2 border-b border-gray-200/90"
          aria-hidden
        />
      </section>

      {/* <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-5 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-10 flex flex-col items-center justify-center min-h-[220px] cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all group">
              <Bed className="w-20 h-20 text-[#00C1A7] mb-5 group-hover:text-[#00A892] transition-colors" strokeWidth={1.5} />
              <span className="text-black font-semibold text-center">Colchones</span>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-10 flex flex-col items-center justify-center min-h-[220px] cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all group">
              <Sofa className="w-20 h-20 text-[#00C1A7] mb-5 group-hover:text-[#00A892] transition-colors" strokeWidth={1.5} />
              <span className="text-black font-semibold text-center">Sommiers</span>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-10 flex flex-col items-center justify-center min-h-[220px] cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all group">
              <svg 
                className="w-20 h-20 text-[#00C1A7] mb-5 group-hover:text-[#00A892] transition-colors" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M3 10C3 8.89543 3.89543 8 5 8H19C20.1046 8 21 8.89543 21 10V14C21 15.1046 20.1046 16 19 16H5C3.89543 16 3 15.1046 3 14V10Z" />
                <path d="M6 10.5C6 10.2239 6.22386 10 6.5 10H17.5C17.7761 10 18 10.2239 18 10.5V13.5C18 13.7761 17.7761 14 17.5 14H6.5C6.22386 14 6 13.7761 6 13.5V10.5Z" />
              </svg>
              <span className="text-black font-semibold text-center">Accesorios</span>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-10 flex flex-col items-center justify-center min-h-[220px] cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all group">
              <Microwave className="w-20 h-20 text-[#00C1A7] mb-5 group-hover:text-[#00A892] transition-colors" strokeWidth={1.5} />
              <span className="text-black font-semibold text-center">Electrodomésticos</span>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-10 flex flex-col items-center justify-center min-h-[220px] cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all group">
              <svg 
                className="w-20 h-20 text-[#00C1A7] mb-5 group-hover:text-[#00A892] transition-colors" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <rect x="3" y="5" width="18" height="14" rx="1" />
                <path d="M3 9H21" />
                <path d="M8 5V9" />
                <path d="M16 5V9" />
                <circle cx="9" cy="13" r="1" />
                <circle cx="15" cy="13" r="1" />
              </svg>
              <span className="text-black font-semibold text-center">Muebles de cocina</span>
            </div>
          </div>
        </div>
      </section> */}


      {/* Hero Text Section */}
      <section className="bg-white py-8 md:py-10 lg:py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between mb-4 md:mb-6 lg:mb-8 gap-3">
            <h2 className="text-sm md:text-xl lg:text-2xl font-semibold text-gray-800 leading-snug">
              Encontrá el colchón ideal para vos
            </h2>
            <a href="/catalogo/colchones" className="flex items-center gap-1 md:gap-2 text-gray-700 hover:text-gray-900 transition-colors shrink-0">
              <span className="font-medium text-xs md:text-sm lg:text-base">Ver todos</span>
              <ArrowRight className="w-3 h-3 md:w-4 lg:w-5 md:h-4 lg:h-5" />
            </a>
          </div>

          {/* Carrusel hasta 1290px inclusive */}
          <ProductCarousel>
            <HomeProducts section="featured" count={4} />
          </ProductCarousel>

          {/* Grid desde 1291px; 4 columnas solo en pantallas más anchas */}
          <div className="hidden min-[1291px]:grid min-[1291px]:grid-cols-3 min-[1440px]:grid-cols-4 gap-5 min-[1440px]:gap-6">
            <HomeProducts section="featured" count={4} />
          </div>
        </div>
      </section>

      {/* Info Banner (position 2) — solo desktop; oculto mobile y tablet */}
      {infoBannerImages.length > 0 && (
        <InfoBannerCarousel images={infoBannerImages} autoPlayInterval={5000} />
      )}

      <section className="bg-[#fafafa] mt-0 md:mt-10 lg:mt-20 py-8 md:py-10 lg:py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between mb-4 md:mb-6 gap-3">
            <h3 className="text-sm md:text-xl lg:text-2xl font-semibold text-gray-800 leading-snug">
              Mirá los más vendidos
            </h3>
            <a href="/catalogo" className="flex items-center gap-1 md:gap-2 text-gray-700 hover:text-gray-900 transition-colors shrink-0">
              <span className="font-medium text-xs md:text-sm lg:text-base">Ver todos</span>
              <ArrowRight className="w-3 h-3 md:w-4 lg:w-5 md:h-4 lg:h-5" />
            </a>
          </div>
          
          {/* Mobile: grid 2 columnas */}
          <div className="grid grid-cols-2 md:hidden gap-5">
            <HomeProducts section="discounts" count={3} />
          </div>

          {/* Tablet y “desktop angosto” hasta 1290px: banner arriba + grilla */}
          <div className="hidden md:max-[1290px]:flex md:flex-col md:gap-6">
            <div className="w-full flex justify-center">
              <div className="w-full max-w-[360px] aspect-[300/400] shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                {descuentazosBanner ? (
                  <img
                    src={wsrvLoader({ src: descuentazosBanner.image_url, width: 600 })}
                    alt={descuentazosBanner.title || descuentazosBanner.subtitle || "Foto"}
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                ) : (
                  <div className="bg-black w-full h-full flex items-center justify-center min-h-[200px]">
                    <div className="text-white font-bold text-3xl md:text-4xl leading-tight text-center" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                      <div>DES</div>
                      <div>CUEN</div>
                      <div>TAZOS</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <HomeProducts section="discounts" count={3} />
            </div>
          </div>

          {/* Desktop ancho (1291px+): columna 300px + tres productos */}
          <div className="hidden min-[1291px]:grid min-[1291px]:grid-cols-[300px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 xl:gap-6 items-start">
            <div className="w-[300px] h-[400px] shrink-0 overflow-hidden rounded-xl bg-neutral-100">
              {descuentazosBanner ? (
                <img
                  src={wsrvLoader({ src: descuentazosBanner.image_url, width: 600 })}
                  alt={descuentazosBanner.title || descuentazosBanner.subtitle || "Foto"}
                  className="h-full w-full max-xl:object-contain xl:object-cover"
                  loading="eager"
                />
              ) : (
                <div className="bg-black w-full h-full flex items-center justify-center">
                  <div className="text-white font-bold text-4xl md:text-5xl leading-tight text-center" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    <div>DES</div>
                    <div>CUEN</div>
                    <div>TAZOS</div>
                  </div>
                </div>
              )}
            </div>

            <HomeProducts section="discounts" count={3} />
          </div>
        </div>
      </section>

      {/* Promotional Offers Section */}
      <section className="bg-white py-8 md:py-10 lg:py-12">
        <div className="container mx-auto px-4 md:px-6">
          {/* Mobile Carousel */}
          <InfoCarousel />
          
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            <div className="flex flex-col items-center text-center p-2 md:p-4">
              <div className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-2 md:mb-3 aspect-square">
                <Truck className="w-7 h-7 md:w-8 lg:w-9 text-[#00C1A7]" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1 text-sm md:text-base font-medium">Envío gratis</p>
              <p className="text-xs md:text-sm text-[#4A5565]">Consultar localidades</p>
            </div>

            <div className="flex flex-col items-center text-center p-2 md:p-4">
              <div className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-2 md:mb-3 aspect-square">
                <CreditCard className="w-7 h-7 md:w-8 lg:w-9 text-[#00C1A7]" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1 text-sm md:text-base font-medium">La mejor financiación</p>
              <p className="text-xs md:text-sm text-[#4A5565]">La mejor opción para tu compra</p>
            </div>

            <div className="flex flex-col items-center text-center p-2 md:p-4">
              <div className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-2 md:mb-3 aspect-square">
                <Award className="w-7 h-7 md:w-8 lg:w-9 text-[#00C1A7]" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1 text-sm md:text-base font-medium">5 años de garantía</p>
              <p className="text-xs md:text-sm text-[#4A5565]">En todos nuestros colchones</p>
            </div>

            <div className="flex flex-col items-center text-center p-2 md:p-4">
              <div className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-2 md:mb-3 aspect-square">
                <Factory className="w-7 h-7 md:w-8 lg:w-9 text-[#00C1A7]" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1 text-sm md:text-base font-medium">Directo de fábrica</p>
              <p className="text-xs md:text-sm text-[#4A5565]">Distribuidor oficial</p>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <VideoSection videoData={videoData} />
{/* 
      <section className="bg-white py-8 md:py-10 lg:py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4 md:mb-6 lg:mb-8">
            <h3 className="text-sm md:text-xl lg:text-2xl font-semibold text-gray-800">Nuestros Colchones</h3>
            <a href="/catalogo/colchones" className="flex items-center gap-1 md:gap-2 text-gray-700 hover:text-gray-900 transition-colors">
              <span className="font-medium text-xs md:text-base">Ver todos</span>
              <ArrowRight className="w-3 h-3 md:w-5 md:h-5" />
            </a>
          </div>

          <ProductCarousel>
            <HomeProducts section="mattresses" count={4} />
          </ProductCarousel>

          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            <HomeProducts section="mattresses" count={4} />
          </div>
        </div>
      </section> */}

      {/* Nuestros Sommiers Section */}
      <section className="bg-white py-8 md:py-10 lg:py-12">
        <div className="container mx-auto px-4 md:px-6">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-4 md:mb-6 lg:mb-8 gap-3">
            <h3 className="text-sm md:text-xl lg:text-2xl font-semibold text-gray-800 leading-snug">
              <span className="md:hidden">Completa tu descanso</span>
              <span className="hidden md:inline">Accesorios que completan tu descanso</span>
            </h3>
            <a href="/catalogo/accesorios" className="flex items-center gap-1 md:gap-2 text-gray-700 hover:text-gray-900 transition-colors shrink-0">
              <span className="font-medium text-xs md:text-sm lg:text-base">Ver todos</span>
              <ArrowRight className="w-3 h-3 md:w-4 lg:w-5 md:h-4 lg:h-5" />
            </a>
          </div>

          <ProductCarousel>
            <HomeProducts section="complete_purchase" count={4} />
          </ProductCarousel>

          <div className="hidden min-[1291px]:grid min-[1291px]:grid-cols-3 min-[1440px]:grid-cols-4 gap-4 min-[1440px]:gap-6">
            <HomeProducts section="complete_purchase" count={4} />
          </div>
        </div>
      </section>

      {/* Information Section */}
      <section className="bg-white py-8 md:py-10 lg:py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 lg:gap-8">
            {/* Blog */}
            <a 
              href="/blog" 
              className="bg-white border border-gray-200 rounded-lg md:rounded-xl p-4 md:p-6 lg:p-8 flex flex-col items-center text-center cursor-pointer hover:border-[#00C1A7] transition-all duration-300 group"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-2 md:mb-3 group-hover:bg-[#00C1A7] transition-colors duration-300 aspect-square">
                <BookOpen className="w-6 h-6 md:w-8 lg:w-9 text-[#00C1A7] group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1 font-semibold text-sm md:text-base">Nuestro Blog</p>
              <p className="text-xs md:text-sm text-[#4A5565] hidden md:block">¡Conocé todo para tu bienestar y más!</p>
            </a>

            {/* Asesoramiento Personalizado */}
            <WhatsAppLink 
              message="Hola, me gustaría recibir asesoramiento personalizado para encontrar el producto ideal."
              className="bg-white border border-gray-200 rounded-lg md:rounded-xl p-4 md:p-6 lg:p-8 flex flex-col items-center text-center cursor-pointer hover:border-[#00C1A7] transition-all duration-300 group"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-2 md:mb-3 group-hover:bg-[#00C1A7] transition-colors duration-300 aspect-square">
                <MessageCircle className="w-6 h-6 md:w-8 lg:w-9 text-[#00C1A7] group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1 font-semibold text-sm md:text-base">Asesoramiento</p>
              <p className="text-xs md:text-sm text-[#4A5565] hidden md:block">Te ayudamos a encontrar el producto ideal</p>
            </WhatsAppLink>

            {/* Preguntas Frecuentes */}
            <WhatsAppLink 
              message="Hola, tengo algunas preguntas frecuentes que me gustaría consultar."
              className="bg-white border border-gray-200 rounded-lg md:rounded-xl p-4 md:p-6 lg:p-8 flex flex-col items-center text-center cursor-pointer hover:border-[#00C1A7] transition-all duration-300 group"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-2 md:mb-3 group-hover:bg-[#00C1A7] transition-colors duration-300 aspect-square">
                <HelpCircle className="w-6 h-6 md:w-8 lg:w-9 text-[#00C1A7] group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1 font-semibold text-sm md:text-base">Preguntas Frecuentes</p>
              <p className="text-xs md:text-sm text-[#4A5565] hidden md:block">Resolvemos todas tus dudas</p>
            </WhatsAppLink>

            {/* Nuestro Local */}
            <a 
              href="/local" 
              className="bg-white border border-gray-200 rounded-lg md:rounded-xl p-4 md:p-6 lg:p-8 flex flex-col items-center text-center cursor-pointer hover:border-[#00C1A7] transition-all duration-300 group"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-2 md:mb-3 group-hover:bg-[#00C1A7] transition-colors duration-300 aspect-square">
                <MapPin className="w-6 h-6 md:w-8 lg:w-9 text-[#00C1A7] group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1 font-semibold text-sm md:text-base">Showroom</p>
              <p className="text-xs md:text-sm text-[#4A5565] hidden md:block">Vení a visitarnos</p>
            </a>
          </div>
        </div>
      </section>

      <ReviewsSectionLazy />

      {/* Newsletter Section */}
      <section className="bg-white py-10 md:py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-50 rounded-[15px] md:rounded-xl lg:rounded-[20px] p-6 md:p-8 lg:p-12 border border-gray-200">
              <div className="text-center mb-5 md:mb-6 lg:mb-8">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#101828] mb-2 md:mb-3">
                  ¡No te pierdas nuestras ofertas!
                </h2>
                <p className="text-sm md:text-base lg:text-lg text-[#4A5565]">
                  Suscríbete y recibe descuentos especiales
                </p>
              </div>
              <form className="flex flex-col sm:flex-row gap-3 md:gap-4 max-w-2xl mx-auto">
                <input
                  type="email"
                  placeholder="Ingresa tu email"
                  className="flex-1 px-4 md:px-5 lg:px-6 py-3 md:py-4 rounded-full bg-white border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-sm md:text-base"
                  required
                />
                <button
                  type="submit"
                  className="bg-gray-900 text-white font-bold px-6 md:px-8 py-3 md:py-4 rounded-full hover:bg-gray-800 transition-colors duration-300 text-sm md:text-base whitespace-nowrap shadow-md hover:shadow-lg"
                >
                  Suscribirme
                </button>
              </form>
              <p className="text-center text-xs md:text-sm text-[#4A5565] mt-3 md:mt-4">
                Al suscribirte, aceptas recibir comunicaciones de marketing.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
