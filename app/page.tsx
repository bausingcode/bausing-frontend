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
  MapPin
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

const Footer = dynamic(() => import("@/components/Footer"), {
  loading: () => null,
  ssr: true,
});

export default async function Home() {
  // Fetch hero images (position 1), info banner (position 2), and descuentazos banner (position 3) from server
  let heroImages: HeroImage[] = [];
  let infoBanner: HeroImage | null = null;
  let descuentazosBanner: HeroImage | null = null;
  let activeEvent = null;
  // Los productos ahora se cargan en el cliente con HomeProducts component

  try {
    // Fetch active hero images (position 1)
    heroImages = await fetchHeroImages(1, true);
    
    // Fetch active info banner (position 2)
    const infoBanners = await fetchHeroImages(2, true);
    infoBanner = infoBanners.length > 0 ? infoBanners[0] : null;
    
    // Fetch active descuentazos banner (position 3)
    const descuentazosBanners = await fetchHeroImages(3, true);
    descuentazosBanner = descuentazosBanners.length > 0 ? descuentazosBanners[0] : null;
    
    // Fetch active event from server
    activeEvent = await fetchActiveEvent();
    
    // Los productos ahora se cargan en el cliente con HomeProducts component
    // para que puedan usar la localidad del contexto
  } catch (error) {
    console.error("Error fetching data:", error);
    // Continue with empty arrays if fetch fails
  }

  // Transform hero images for BannerCarousel
  const bannerImages = heroImages.map((img) => ({
    id: parseInt(img.id.slice(0, 8), 16) || img.id.charCodeAt(0),
    url: img.image_url,
    alt: img.title || img.subtitle || "Banner"
  }));

  // Los productos se cargan dinámicamente en el cliente con HomeProducts

  return (
    <div className="min-h-screen bg-white">
      <Navbar event={activeEvent} />

      {/* Hero Section - Banner Carousel */}
      {bannerImages.length > 0 && (
        <BannerCarousel images={bannerImages} autoPlayInterval={5000} />
      )}

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


      {/* Nuestros Colchones Section */}
      <section className="bg-white py-8 md:py-10 lg:py-12">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-5 md:mb-6 lg:mb-8">
            <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-800">Productos Destacados</h3>
            <a href="#" className="flex items-center gap-1 md:gap-2 text-gray-700 hover:text-gray-900 transition-colors">
              <span className="font-medium text-sm md:text-base">Ver todos</span>
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </a>
          </div>

          {/* Product Grid: 2 móvil, 3 tablet, 4 desktop */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            <HomeProducts section="featured" count={4} />
          </div>
        </div>
      </section>

      {/* Info Banner (position 2) - Hidden on mobile */}
      {infoBanner && (
        <section className="hidden md:block bg-white py-4 md:py-6 lg:py-0">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex justify-center">
              <div className="relative rounded-[10px] md:rounded-xl overflow-hidden w-full max-w-[1650px] aspect-[1650/350]">
                <img
                  src={wsrvLoader({ src: infoBanner.image_url, width: 1650 })}
                  alt={infoBanner.title || infoBanner.subtitle || "Banner informativo"}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Descuentazos Section */}
      <section className="bg-[#fafafa] py-8 md:py-10 lg:py-12">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          {/* Título: visible en móvil; en tablet/desktop dentro del grid */}
          <div className="mb-5 md:mb-6">
            <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-800">Descuentazos</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 items-start">
            {/* Banner Descuentazos - Hidden on mobile, 1 col en tablet/desktop */}
            <div className="hidden md:block md:row-span-1 rounded-[10px] md:rounded-xl overflow-hidden w-full max-w-full md:max-w-[280px] lg:max-w-[300px] h-[320px] md:h-[380px] lg:h-[430px]">
              {descuentazosBanner ? (
                <img
                  src={wsrvLoader({ src: descuentazosBanner.image_url, width: 400 })}
                  alt={descuentazosBanner.title || descuentazosBanner.subtitle || "Descuentazos"}
                  className="w-full h-full object-cover"
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

            {/* Productos */}
            <HomeProducts section="discounts" count={3} />
          </div>
        </div>
      </section>

      {/* Promotional Offers Section */}
      <section className="bg-white py-8 md:py-10 lg:py-12">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          {/* Mobile Carousel */}
          <InfoCarousel />
          
          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {/* Free Shipping */}
            <div className="flex flex-col items-center text-center p-2 md:p-4">
              <div className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-2 md:mb-3 aspect-square">
                <Truck className="w-7 h-7 md:w-8 lg:w-9 text-[#00C1A7]" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1 text-sm md:text-base font-medium">Envío gratis</p>
              <p className="text-xs md:text-sm text-[#4A5565]">Consultar localidades</p>
            </div>

            {/* Payment Options */}
            <div className="flex flex-col items-center text-center p-2 md:p-4">
              <div className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-2 md:mb-3 aspect-square">
                <CreditCard className="w-7 h-7 md:w-8 lg:w-9 text-[#00C1A7]" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1 text-sm md:text-base font-medium">La mejor financiación</p>
              <p className="text-xs md:text-sm text-[#4A5565]">La mejor opción para tu compra</p>
            </div>

            {/* Warranty */}
            <div className="flex flex-col items-center text-center p-2 md:p-4">
              <div className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-2 md:mb-3 aspect-square">
                <Award className="w-7 h-7 md:w-8 lg:w-9 text-[#00C1A7]" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1 text-sm md:text-base font-medium">5 años de garantía</p>
              <p className="text-xs md:text-sm text-[#4A5565]">En todos nuestros colchones</p>
            </div>

            {/* Quality Assurance */}
            <div className="flex flex-col items-center text-center p-2 md:p-4">
              <div className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-2 md:mb-3 aspect-square">
                <Factory className="w-7 h-7 md:w-8 lg:w-9 text-[#00C1A7]" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1 text-sm md:text-base font-medium">Distribuidor oficial</p>
              <p className="text-xs md:text-sm text-[#4A5565]">Calidad garantizada</p>
            </div>
          </div>
        </div>
      </section>

      {/* Nuestras Almohadas Section */}
      <section className="bg-white py-8 md:py-10 lg:py-12">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-5 md:mb-6 lg:mb-8">
            <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-800">Nuestros Colchones</h3>
            <a href="#" className="flex items-center gap-1 md:gap-2 text-gray-700 hover:text-gray-900 transition-colors">
              <span className="font-medium text-sm md:text-base">Ver todos</span>
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </a>
          </div>

          {/* Product Grid: 2 móvil, 3 tablet, 4 desktop */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            <HomeProducts section="mattresses" count={4} />
          </div>
        </div>
      </section>

      {/* Nuestros Sommiers Section */}
      <section className="bg-white py-8 md:py-10 lg:py-12">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-5 md:mb-6 lg:mb-8">
            <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-800">Completa tu compra</h3>
            <a href="#" className="flex items-center gap-1 md:gap-2 text-gray-700 hover:text-gray-900 transition-colors">
              <span className="font-medium text-sm md:text-base">Ver todos</span>
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </a>
          </div>

          {/* Product Grid: 2 móvil, 3 tablet, 4 desktop */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            <HomeProducts section="complete_purchase" count={4} />
          </div>
        </div>
      </section>

      {/* Information Section */}
      <section className="bg-white py-8 md:py-10 lg:py-12">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-8">
            {/* Blog */}
            <a 
              href="/blog" 
              className="bg-white border border-gray-200 rounded-lg md:rounded-xl p-4 md:p-6 lg:p-8 flex flex-col items-center text-center cursor-pointer hover:shadow-lg hover:border-[#00C1A7] transition-all duration-300 group"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-2 md:mb-3 group-hover:bg-[#00C1A7] transition-colors duration-300 aspect-square">
                <BookOpen className="w-6 h-6 md:w-8 lg:w-9 text-[#00C1A7] group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1 font-semibold text-sm md:text-base">Blog</p>
              <p className="text-xs md:text-sm text-[#4A5565] hidden md:block">Consejos y guías para un mejor descanso</p>
            </a>

            {/* Asesoramiento Personalizado */}
            <a 
              href="/asesoramiento" 
              className="bg-white border border-gray-200 rounded-lg md:rounded-xl p-4 md:p-6 lg:p-8 flex flex-col items-center text-center cursor-pointer hover:shadow-lg hover:border-[#00C1A7] transition-all duration-300 group"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-2 md:mb-3 group-hover:bg-[#00C1A7] transition-colors duration-300 aspect-square">
                <MessageCircle className="w-6 h-6 md:w-8 lg:w-9 text-[#00C1A7] group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1 font-semibold text-sm md:text-base">Asesoramiento</p>
              <p className="text-xs md:text-sm text-[#4A5565] hidden md:block">Te ayudamos a encontrar el producto ideal</p>
            </a>

            {/* Preguntas Frecuentes */}
            <a 
              href="/preguntas-frecuentes" 
              className="bg-white border border-gray-200 rounded-lg md:rounded-xl p-4 md:p-6 lg:p-8 flex flex-col items-center text-center cursor-pointer hover:shadow-lg hover:border-[#00C1A7] transition-all duration-300 group"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-2 md:mb-3 group-hover:bg-[#00C1A7] transition-colors duration-300 aspect-square">
                <HelpCircle className="w-6 h-6 md:w-8 lg:w-9 text-[#00C1A7] group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1 font-semibold text-sm md:text-base">Preguntas</p>
              <p className="text-xs md:text-sm text-[#4A5565] hidden md:block">Resolvemos todas tus dudas</p>
            </a>

            {/* Nuestro Local */}
            <a 
              href="/nuestro-local" 
              className="bg-white border border-gray-200 rounded-lg md:rounded-xl p-4 md:p-6 lg:p-8 flex flex-col items-center text-center cursor-pointer hover:shadow-lg hover:border-[#00C1A7] transition-all duration-300 group"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-2 md:mb-3 group-hover:bg-[#00C1A7] transition-colors duration-300 aspect-square">
                <MapPin className="w-6 h-6 md:w-8 lg:w-9 text-[#00C1A7] group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1 font-semibold text-sm md:text-base">Local</p>
              <p className="text-xs md:text-sm text-[#4A5565] hidden md:block">Visítanos y conoce nuestros productos</p>
            </a>
          </div>
        </div>
      </section>

      <ReviewsSectionLazy />

      {/* Newsletter Section */}
      <section className="bg-white py-10 md:py-12 lg:py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
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
