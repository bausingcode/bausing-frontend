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
import Footer from "@/components/Footer";
import ReviewsSection from "@/components/ReviewsSection";
import wsrvLoader from "@/lib/wsrvLoader";
import { fetchHeroImages, HeroImage, fetchProducts, Product } from "@/lib/api";

// Helper function to repeat products if not enough
function repeatProducts<T>(products: T[], count: number): T[] {
  if (products.length === 0) return [];
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    result.push(products[i % products.length]);
  }
  return result;
}

// Helper function to format price
function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(price);
}

// Helper function to convert Product to ProductCard props
function productToCardProps(product: Product) {
  const image = product.main_image || (product.images && product.images[0]?.image_url) || "/images/placeholder.png";
  const price = product.min_price ? formatPrice(product.min_price) : "$0";
  const originalPrice = product.max_price && product.min_price !== product.max_price 
    ? formatPrice(product.max_price) 
    : "";
  
  // Calcular descuento si hay promociones
  let discount: string | undefined;
  if (product.promos && product.promos.length > 0) {
    const promo = product.promos[0];
    if (promo.discount_percentage) {
      discount = "OFERTA";
    }
  }
  
  return {
    id: product.id,
    image,
    alt: product.name,
    name: product.name,
    currentPrice: price,
    originalPrice,
    discount,
  };
}

export default async function Home() {
  // Fetch hero images (position 1), info banner (position 2), and descuentazos banner (position 3) from server
  let heroImages: HeroImage[] = [];
  let infoBanner: HeroImage | null = null;
  let descuentazosBanner: HeroImage | null = null;
  let allProducts: Product[] = [];

  try {
    // Fetch active hero images (position 1)
    heroImages = await fetchHeroImages(1, true);
    
    // Fetch active info banner (position 2)
    const infoBanners = await fetchHeroImages(2, true);
    infoBanner = infoBanners.length > 0 ? infoBanners[0] : null;
    
    // Fetch active descuentazos banner (position 3)
    const descuentazosBanners = await fetchHeroImages(3, true);
    descuentazosBanner = descuentazosBanners.length > 0 ? descuentazosBanners[0] : null;
    
    // Fetch all active products
    const productsResult = await fetchProducts({
      is_active: true,
      include_images: true,
      include_promos: true,
      per_page: 100, // Get a good amount of products
    });
    allProducts = productsResult.products;
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

  // Convert products to card props and repeat if needed
  const productCardProps = allProducts.map(productToCardProps);
  const products = repeatProducts(productCardProps, 4);
  const pillows = repeatProducts(productCardProps, 4);
  const sommiers = repeatProducts(productCardProps, 4);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

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
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-semibold text-gray-800">Productos Destacados</h3>
            <a href="#" className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
              <span className="font-medium">Ver todos</span>
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-4 gap-6">
            {products.length > 0 ? (
              products.map((product, index) => (
                <ProductCard
                  key={`${product.id}-${index}`}
                  id={product.id}
                  image={product.image}
                  alt={product.alt}
                  name={product.name}
                  currentPrice={product.currentPrice}
                  originalPrice={product.originalPrice}
                  discount={product.discount}
                />
              ))
            ) : (
              // Skeleton for products
              [...Array(4)].map((_, index) => (
                <div key={index} className="relative group block animate-pulse">
                  {/* Skeleton Image */}
                  <div className="relative w-full h-80 rounded-[10px] overflow-hidden bg-gray-200"></div>
                  {/* Skeleton Content */}
                  <div className="pt-3">
                    <div className="mb-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <div className="h-6 bg-gray-200 rounded w-24"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="mt-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Info Banner (position 2) */}
      {infoBanner && (
        <section className="bg-white">
          <div className="container mx-auto px-4">
            <div className="flex justify-center">
              <div className="relative rounded-[10px] overflow-hidden" style={{ width: '1650px', height: '350px' }}>
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
      <section className="bg-[#fafafa]  py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-4 gap-6">
            {/* Banner Descuentazos */}
            {descuentazosBanner ? (
              <div className="rounded-[10px] overflow-hidden" style={{ width: '300px', height: '430px' }}>
                <img
                  src={wsrvLoader({ src: descuentazosBanner.image_url, width: 300 })}
                  alt={descuentazosBanner.title || descuentazosBanner.subtitle || "Descuentazos"}
                  className="w-full h-full"
                  loading="eager"
                />
              </div>
            ) : (
              <div className="bg-black rounded-[10px] flex items-center justify-center" style={{ width: '300px', height: '400px' }}>
                <div className="text-white font-bold text-5xl leading-tight text-center" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  <div>DES</div>
                  <div>CUEN</div>
                  <div>TAZOS</div>
                </div>
              </div>
            )}

            {/* Productos */}
            {products.length > 0 ? (
              products.slice(0, 3).map((product, index) => (
                <div key={`${product.id}-${index}`} className="bg-white p-4 rounded-[20px] h-full cursor-pointer">
                  <div className="h-full flex flex-col">
                    <ProductCard
                      id={product.id}
                      image={product.image}
                      alt={product.alt}
                      name={product.name}
                      currentPrice={product.currentPrice}
                      originalPrice={product.originalPrice}
                      discount={product.discount}
                    />
                  </div>
                </div>
              ))
            ) : (
              // Skeleton for products
              [...Array(3)].map((_, index) => (
                <div key={index} className="bg-white p-4 rounded-[20px] h-full animate-pulse">
                  <div className="relative w-full h-80 rounded-[10px] overflow-hidden bg-gray-200"></div>
                  <div className="pt-3">
                    <div className="mb-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <div className="h-6 bg-gray-200 rounded w-24"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="mt-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Promotional Offers Section */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-4 gap-8">
            {/* Free Shipping */}
            <div className="flex flex-col items-center text-center">
              <div className="w-18 h-18 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-3">
                <Truck className="w-9 h-9 text-[#00C1A7]" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1">Envío gratis</p>
              <p className="text-sm text-[#4A5565]">Consultar localidades disponibles</p>
            </div>

            {/* Payment Options */}
            <div className="flex flex-col items-center text-center">
              <div className="w-18 h-18 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-3">
                <CreditCard className="w-9 h-9 text-[#00C1A7]" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1">La mejor financiación</p>
              <p className="text-sm text-[#4A5565]">Te ofrecemos la mejor opción para tu compra</p>
            </div>

            {/* Warranty */}
            <div className="flex flex-col items-center text-center">
              <div className="w-18 h-18 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-3">
                <Award className="w-9 h-9 text-[#00C1A7]" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1">5 años de garantía</p>
              <p className="text-sm text-[#4A5565]">En todos nuestros colchones</p>
            </div>

            {/* Quality Assurance */}
            <div className="flex flex-col items-center text-center">
              <div className="w-18 h-18 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-3">
                <Factory className="w-9 h-9 text-[#00C1A7]" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1">Distribuidor oficial</p>
              <p className="text-sm text-[#4A5565]">Calidad garantizada desde el origen</p>
            </div>
          </div>
        </div>
      </section>

      {/* Nuestras Almohadas Section */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-semibold text-gray-800">Nuestros Colchones</h3>
            <a href="#" className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
              <span className="font-medium">Ver todos</span>
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-4 gap-6">
            {pillows.length > 0 ? (
              pillows.map((product, index) => (
                <ProductCard
                  key={`${product.id}-pillows-${index}`}
                  id={product.id}
                  image={product.image}
                  alt={product.alt}
                  name={product.name}
                  currentPrice={product.currentPrice}
                  originalPrice={product.originalPrice}
                  discount={product.discount}
                />
              ))
            ) : (
              // Skeleton for products
              [...Array(4)].map((_, index) => (
                <div key={index} className="relative group block animate-pulse">
                  <div className="relative w-full h-80 rounded-[10px] overflow-hidden bg-gray-200"></div>
                  <div className="pt-3">
                    <div className="mb-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <div className="h-6 bg-gray-200 rounded w-24"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="mt-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Nuestros Sommiers Section */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-semibold text-gray-800">Completa tu compra</h3>
            <a href="#" className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
              <span className="font-medium">Ver todos</span>
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-4 gap-6">
            {sommiers.length > 0 ? (
              sommiers.map((product, index) => (
                <ProductCard
                  key={`${product.id}-sommiers-${index}`}
                  id={product.id}
                  image={product.image}
                  alt={product.alt}
                  name={product.name}
                  currentPrice={product.currentPrice}
                  originalPrice={product.originalPrice}
                  discount={product.discount}
                />
              ))
            ) : (
              // Skeleton for products
              [...Array(4)].map((_, index) => (
                <div key={index} className="relative group block animate-pulse">
                  <div className="relative w-full h-80 rounded-[10px] overflow-hidden bg-gray-200"></div>
                  <div className="pt-3">
                    <div className="mb-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <div className="h-6 bg-gray-200 rounded w-24"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="mt-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Information Section */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-4 gap-8">
            {/* Blog */}
            <a 
              href="/blog" 
              className="bg-white border border-gray-200 rounded-lg p-8 flex flex-col items-center text-center cursor-pointer hover:shadow-lg hover:border-[#00C1A7] transition-all duration-300 group"
            >
              <div className="w-18 h-18 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-3 group-hover:bg-[#00C1A7] transition-colors duration-300">
                <BookOpen className="w-9 h-9 text-[#00C1A7] group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1 font-semibold">Blog</p>
              <p className="text-sm text-[#4A5565]">Consejos y guías para un mejor descanso</p>
            </a>

            {/* Asesoramiento Personalizado */}
            <a 
              href="/asesoramiento" 
              className="bg-white border border-gray-200 rounded-lg p-8 flex flex-col items-center text-center cursor-pointer hover:shadow-lg hover:border-[#00C1A7] transition-all duration-300 group"
            >
              <div className="w-18 h-18 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-3 group-hover:bg-[#00C1A7] transition-colors duration-300">
                <MessageCircle className="w-9 h-9 text-[#00C1A7] group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1 font-semibold">Asesoramiento</p>
              <p className="text-sm text-[#4A5565]">Te ayudamos a encontrar el producto ideal</p>
            </a>

            {/* Preguntas Frecuentes */}
            <a 
              href="/preguntas-frecuentes" 
              className="bg-white border border-gray-200 rounded-lg p-8 flex flex-col items-center text-center cursor-pointer hover:shadow-lg hover:border-[#00C1A7] transition-all duration-300 group"
            >
              <div className="w-18 h-18 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-3 group-hover:bg-[#00C1A7] transition-colors duration-300">
                <HelpCircle className="w-9 h-9 text-[#00C1A7] group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1 font-semibold">Preguntas Frecuentes</p>
              <p className="text-sm text-[#4A5565]">Resolvemos todas tus dudas</p>
            </a>

            {/* Nuestro Local */}
            <a 
              href="/nuestro-local" 
              className="bg-white border border-gray-200 rounded-lg p-8 flex flex-col items-center text-center cursor-pointer hover:shadow-lg hover:border-[#00C1A7] transition-all duration-300 group"
            >
              <div className="w-18 h-18 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-3 group-hover:bg-[#00C1A7] transition-colors duration-300">
                <MapPin className="w-9 h-9 text-[#00C1A7] group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1 font-semibold">Nuestro Local</p>
              <p className="text-sm text-[#4A5565]">Visítanos y conoce nuestros productos</p>
            </a>
          </div>
        </div>
      </section>

      <ReviewsSection />

      {/* Newsletter Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-50 rounded-[20px] p-12 border border-gray-200">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-[#101828] mb-3">
                  ¡No te pierdas nuestras ofertas exclusivas!
                </h2>
                <p className="text-lg text-[#4A5565]">
                  Suscríbete a nuestro newsletter y recibe descuentos especiales, novedades y consejos para un mejor descanso
                </p>
              </div>
              <form className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                <input
                  type="email"
                  placeholder="Ingresa tu email"
                  className="flex-1 px-6 py-4 rounded-full bg-white border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-base"
                  required
                />
                <button
                  type="submit"
                  className="bg-gray-900 text-white font-bold px-8 py-4 rounded-full hover:bg-gray-800 transition-colors duration-300 text-base whitespace-nowrap shadow-md hover:shadow-lg"
                >
                  Suscribirme
                </button>
              </form>
              <p className="text-center text-sm text-[#4A5565] mt-4">
                Al suscribirte, aceptas recibir comunicaciones de marketing. Puedes darte de baja en cualquier momento.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
