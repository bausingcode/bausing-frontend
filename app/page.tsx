"use client";

import { 
  Bed,
  Sofa,
  Microwave,
  ArrowRight,
  Award,
  Factory,
  Truck,
  CreditCard
} from "lucide-react";
import ProductCard from "@/components/ProductCard";
import BannerCarousel from "@/components/BannerCarousel";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";

// Mock data for banner images
const bannerImages = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&h=600&fit=crop",
    alt: "Black Friday Banner 1"
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&h=600&fit=crop",
    alt: "Black Friday Banner 2"
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=1200&h=600&fit=crop",
    alt: "Black Friday Banner 3"
  }
];

// Mock data for products
const products = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop",
    alt: "Colchón Vitto",
    name: "Colchón Vitto 2 plazas (140×190cm) de resortes",
    currentPrice: "$750.000",
    originalPrice: "$1.500.000",
    discount: "%50 OFF"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop",
    alt: "Colchón Lumma",
    name: "Colchón Lumma 2 plazas (140×190cm) de resortes",
    currentPrice: "$400.000",
    originalPrice: "",
    discount: undefined
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop",
    alt: "Colchón Vitto",
    name: "Colchón Vitto 2 plazas (140×190cm) de resortes",
    currentPrice: "$650.000",
    originalPrice: "",
    discount: undefined
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop",
    alt: "Colchón Lumma",
    name: "Colchón Lumma 2 plazas (140×190cm) de resortes",
    currentPrice: "$900.000",
    originalPrice: "",
    discount: undefined
  }
];

// Mock data for pillows
const pillows = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop",
    alt: "Almohada",
    name: "Colchón Lumma 2 plazas (140×190cm) de resortes",
    currentPrice: "$400.000",
    originalPrice: "$800.000",
    discount: "%50 OFF"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop",
    alt: "Almohada",
    name: "Colchón Vitto 2 plazas (140×190cm) de resortes",
    currentPrice: "$400.000",
    originalPrice: "",
    discount: undefined
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop",
    alt: "Almohada",
    name: "Colchón Lumma 2 plazas (140×190cm) de resortes",
    currentPrice: "$650.000",
    originalPrice: "",
    discount: undefined
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop",
    alt: "Almohada",
    name: "Colchón Vitto 2 plazas (140×190cm) de resortes",
    currentPrice: "$750.000",
    originalPrice: "",
    discount: undefined
  }
];

// Mock data for sommiers
const sommiers = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop",
    alt: "Sommier",
    name: "Colchón Lumma 2 plazas (140×190cm) de resortes",
    currentPrice: "$400.000",
    originalPrice: "$800.000",
    discount: "%50 OFF"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop",
    alt: "Sommier",
    name: "Colchón Vitto 2 plazas (140×190cm) de resortes",
    currentPrice: "$400.000",
    originalPrice: "",
    discount: undefined
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop",
    alt: "Sommier",
    name: "Colchón Lumma 2 plazas (140×190cm) de resortes",
    currentPrice: "$400.000",
    originalPrice: "$800.000",
    discount: "%50 OFF"
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=400&fit=crop",
    alt: "Sommier",
    name: "Colchón Vitto 2 plazas (140×190cm) de resortes",
    currentPrice: "$750.000",
    originalPrice: "",
    discount: undefined
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section - Black Friday Banner Carousel */}
      <BannerCarousel images={bannerImages} autoPlayInterval={5000} />

      {/* Categories Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-5 gap-6">
            {/* Colchones */}
            <div className="bg-white border border-gray-200 rounded-lg p-10 flex flex-col items-center justify-center min-h-[220px] cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all group">
              <Bed className="w-20 h-20 text-[#00C1A7] mb-5 group-hover:text-[#00A892] transition-colors" strokeWidth={1.5} />
              <span className="text-black font-semibold text-center">Colchones</span>
            </div>

            {/* Sommiers y Bases */}
            <div className="bg-white border border-gray-200 rounded-lg p-10 flex flex-col items-center justify-center min-h-[220px] cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all group">
              <Sofa className="w-20 h-20 text-[#00C1A7] mb-5 group-hover:text-[#00A892] transition-colors" strokeWidth={1.5} />
              <span className="text-black font-semibold text-center">Sommiers y Bases</span>
            </div>

            {/* Accesorios */}
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

            {/* Electrodomésticos */}
            <div className="bg-white border border-gray-200 rounded-lg p-10 flex flex-col items-center justify-center min-h-[220px] cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all group">
              <Microwave className="w-20 h-20 text-[#00C1A7] mb-5 group-hover:text-[#00A892] transition-colors" strokeWidth={1.5} />
              <span className="text-black font-semibold text-center">Electrodomésticos</span>
            </div>

            {/* Muebles de cocina */}
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
      </section>

      {/* Black Friday Banner */}
      <section className="bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="relative rounded-[10px] overflow-hidden" style={{ width: '1650px', height: '350px' }}>
              <Image
                src="https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1660&h=490&fit=crop"
                alt="Black Friday"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Nuestros Colchones Section */}
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
            {products.map((product) => (
              <ProductCard
                key={product.id}
                image={product.image}
                alt={product.alt}
                name={product.name}
                currentPrice={product.currentPrice}
                originalPrice={product.originalPrice}
                discount={product.discount}
              />
            ))}
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
              <p className="text-sm text-[#4A5565]">En compras superiores a $50.000</p>
            </div>

            {/* Payment Options */}
            <div className="flex flex-col items-center text-center">
              <div className="w-18 h-18 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-3">
                <CreditCard className="w-9 h-9 text-[#00C1A7]" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1">Hasta 12 cuotas</p>
              <p className="text-sm text-[#4A5565]">Sin interés en tarjetas seleccionadas</p>
            </div>

            {/* Warranty */}
            <div className="flex flex-col items-center text-center">
              <div className="w-18 h-18 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-3">
                <Award className="w-9 h-9 text-[#00C1A7]" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1">5 años de garantía</p>
              <p className="text-sm text-[#4A5565]">En todos nuestros productos</p>
            </div>

            {/* Quality Assurance */}
            <div className="flex flex-col items-center text-center">
              <div className="w-18 h-18 rounded-full bg-[#E5F9F6] flex items-center justify-center mb-3">
                <Factory className="w-9 h-9 text-[#00C1A7]" strokeWidth={1.5} />
              </div>
              <p className="text-[#101828] mb-1">Fábrica propia</p>
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
            <h3 className="text-xl font-semibold text-gray-800">Nuestras Almohadas</h3>
            <a href="#" className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
              <span className="font-medium">Ver todos</span>
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-4 gap-6">
            {pillows.map((product) => (
              <ProductCard
                key={product.id}
                image={product.image}
                alt={product.alt}
                name={product.name}
                currentPrice={product.currentPrice}
                originalPrice={product.originalPrice}
                discount={product.discount}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Nuestros Sommiers Section */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-semibold text-gray-800">Nuestros Sommiers</h3>
            <a href="#" className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors">
              <span className="font-medium">Ver todos</span>
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-4 gap-6">
            {sommiers.map((product) => (
              <ProductCard
                key={product.id}
                image={product.image}
                alt={product.alt}
                name={product.name}
                currentPrice={product.currentPrice}
                originalPrice={product.originalPrice}
                discount={product.discount}
              />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
