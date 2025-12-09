"use client";

import { useState } from "react";
import { 
  Truck, 
  CreditCard, 
  Search, 
  User, 
  Heart, 
  ShoppingCart,
  Tag,
  Package,
  ArrowRight,
  Bed,
  Sofa,
  Microwave,
  ChefHat
} from "lucide-react";
import Cart from "./Cart";
import Image from "next/image";

export default function Navbar() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredSubcategory, setHoveredSubcategory] = useState<string | null>(null);
  const [previousCategory, setPreviousCategory] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [closingCategory, setClosingCategory] = useState<string | null>(null);

  return (
    <>
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        {/* Top Header - Light Green Bar */}
        <div className="bg-[#88CAC2] py-1.5">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-6 text-sm text-white">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-white" />
                <span className="font-semibold">Envíos gratis</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-white" />
                <span className="font-semibold">Grandes descuentos</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-white" />
                <span className="font-semibold">Cuotas sin interés</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Header - White Bar */}
        <header className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-8">
              {/* Logo */}
              <a href="/" className="flex items-center flex-shrink-0 cursor-pointer">
                <img
                  src="/images/logo/logo.svg"
                  alt="BAUSING Logo"
                  className="h-10 w-auto"
                />
              </a>

              {/* Search Bar - Centered */}
              <div className="flex-1 flex justify-center px-8">
                <div className="relative w-full max-w-4xl">
                  <input
                    type="text"
                    placeholder="Buscar colchones, sommiers, almohadas..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 placeholder:text-gray-600"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-black" />
                </div>
              </div>

              {/* User and Cart Icons */}
              <div className="flex items-center justify-end gap-6 flex-shrink-0">
                <div className="flex items-center gap-2 cursor-pointer group">
                  <User className="w-7 h-7 text-gray-700 group-hover:text-gray-900" strokeWidth={1.5} />
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-700 font-normal">Tu cuenta</span>
                    <span className="text-xs text-[#000000] font-semibold">Ingresa a tu cuenta</span>
                  </div>
                </div>
                <Heart className="w-6 h-6 text-gray-700 cursor-pointer hover:text-gray-900" />
                <div 
                  className="cursor-pointer group"
                  onClick={() => setIsCartOpen(true)}
                >
                  <ShoppingCart 
                    className="w-6 h-6 text-gray-700 fill-transparent group-hover:text-black group-hover:fill-black transition-[color,fill] duration-300 ease-in-out" 
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Bar */}
        <nav 
          className="bg-white border-b border-gray-200 relative"
          onMouseLeave={() => setHoveredCategory(null)}
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-8 py-3">
              <a 
                href="#" 
                className="text-black hover:text-gray-600 font-medium"
                onMouseEnter={() => {
                  const wasOpen = hoveredCategory !== null;
                  setPreviousCategory(hoveredCategory);
                  setHoveredCategory("Colchones");
                  if (wasOpen) {
                    setHoveredSubcategory(null);
                  }
                }}
              >
                Colchones
              </a>
              <a 
                href="#" 
                className="text-black hover:text-gray-600 font-medium"
                onMouseEnter={() => {
                  const wasOpen = hoveredCategory !== null;
                  setPreviousCategory(hoveredCategory);
                  setHoveredCategory("Sommiers y bases");
                  if (wasOpen) {
                    setHoveredSubcategory(null);
                  }
                }}
              >
                Sommiers y bases
              </a>
              <a 
                href="#" 
                className="text-black hover:text-gray-600 font-medium"
                onMouseEnter={() => {
                  const wasOpen = hoveredCategory !== null;
                  setPreviousCategory(hoveredCategory);
                  setHoveredCategory("Accesorios");
                  if (wasOpen) {
                    setHoveredSubcategory(null);
                  }
                }}
              >
                Accesorios
              </a>
              <a 
                href="#" 
                className="text-black hover:text-gray-600 font-medium"
                onMouseEnter={() => {
                  const wasOpen = hoveredCategory !== null;
                  setPreviousCategory(hoveredCategory);
                  setHoveredCategory("Electrodomésticos");
                  if (wasOpen) {
                    setHoveredSubcategory(null);
                  }
                }}
              >
                Electrodomésticos
              </a>
              <a 
                href="#" 
                className="text-black hover:text-gray-600 font-medium"
                onMouseEnter={() => {
                  const wasOpen = hoveredCategory !== null;
                  setPreviousCategory(hoveredCategory);
                  setHoveredCategory("Muebles de cocina");
                  if (wasOpen) {
                    setHoveredSubcategory(null);
                  }
                }}
              >
                Muebles de cocina
              </a>
            </div>
          </div>

          {/* Dropdown Menu - Full Width */}
          {(hoveredCategory === "Colchones" || closingCategory === "Colchones") && (
            <div 
              className={`absolute top-full left-0 w-full bg-white shadow-lg border-t border-gray-200 z-50 ${previousCategory === null && !isClosing ? 'animate-slideInFromTop' : ''} ${isClosing && closingCategory === "Colchones" ? 'animate-slideOutToTop' : ''}`}
              onMouseEnter={() => {
                if (isClosing) {
                  setIsClosing(false);
                  setClosingCategory(null);
                }
              }}
              onMouseLeave={() => {
                setIsClosing(true);
                setClosingCategory("Colchones");
                setTimeout(() => {
                  setHoveredCategory(null);
                  setHoveredSubcategory(null);
                  setPreviousCategory(null);
                  setIsClosing(false);
                  setClosingCategory(null);
                }, 200);
              }}
            >
              <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-3 gap-8">
                  {/* Left Column - Sizes */}
                  <div className="space-y-4">
                    <div 
                      className="flex items-center gap-4 cursor-pointer group hover:bg-gray-50 p-3 rounded-lg transition-all"
                      onMouseEnter={() => setHoveredSubcategory("1 Plaza")}
                    >
                      <div className="flex-shrink-0" style={{ width: '80px' }}>
                        <CreditCard className="text-[#00C1A7]" strokeWidth={1.5} style={{ width: '32px', height: '40px' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-gray-900 group-hover:text-[#00C1A7] transition-colors">1 Plaza</p>
                        <p className="text-sm text-gray-600 mt-0.5">80x190 cm</p>
                      </div>
                    </div>
                    <div 
                      className="flex items-center gap-4 cursor-pointer group hover:bg-gray-50 p-3 rounded-lg transition-all"
                      onMouseEnter={() => setHoveredSubcategory("1 1/2 Plaza")}
                    >
                      <div className="flex-shrink-0" style={{ width: '80px' }}>
                        <CreditCard className="text-[#00C1A7]" strokeWidth={1.5} style={{ width: '40px', height: '40px' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-gray-900 group-hover:text-[#00C1A7] transition-colors">1 1/2 Plaza</p>
                        <p className="text-sm text-gray-600 mt-0.5">90x190 / 100x200 cm</p>
                      </div>
                    </div>
                    <div 
                      className="flex items-center gap-4 cursor-pointer group hover:bg-gray-50 p-3 rounded-lg transition-all"
                      onMouseEnter={() => setHoveredSubcategory("2 Plazas")}
                    >
                      <div className="flex-shrink-0" style={{ width: '80px' }}>
                        <CreditCard className="text-[#00C1A7]" strokeWidth={1.5} style={{ width: '56px', height: '40px' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-gray-900 group-hover:text-[#00C1A7] transition-colors">2 Plazas</p>
                        <p className="text-sm text-gray-600 mt-0.5">140x190 cm</p>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column - Sizes or Subcategories */}
                  <div 
                    className="space-y-4"
                    onMouseEnter={() => {
                      // Keep subcategories open when entering this column
                    }}
                    onMouseLeave={() => {
                      // Only close if we're leaving to go outside the dropdown area
                      // Don't close if moving to another column
                    }}
                  >
                    {hoveredSubcategory && ["1 Plaza", "1 1/2 Plaza", "2 Plazas"].includes(hoveredSubcategory) ? (
                      // Show subcategories when hovering first column
                      <div className="animate-slideInFromTop">
                        <h3 className="font-semibold text-lg text-gray-900 mb-4">{hoveredSubcategory}</h3>
                        <div className="space-y-3">
                          <a href="#" className="block text-base text-gray-700 hover:text-[#00C1A7] transition-colors py-2 border-b border-gray-100">Espuma alta densidad</a>
                          <a href="#" className="block text-base text-gray-700 hover:text-[#00C1A7] transition-colors py-2 border-b border-gray-100">Resortes</a>
                          <button
                            onClick={() => setHoveredSubcategory(null)}
                            className="block text-base text-gray-500 hover:text-gray-700 transition-colors py-2 text-left w-full"
                          >
                            ← Volver atrás
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Show second column sizes
                      <div
                        onMouseEnter={() => {
                          // Keep subcategories open when entering this column
                        }}
                        onMouseLeave={() => {
                          // Only close if we're leaving to go outside the dropdown area
                          // Don't close if moving to another column
                        }}
                      >
                        <div 
                          className="flex items-center gap-4 cursor-pointer group hover:bg-gray-50 p-3 rounded-lg transition-all"
                          onMouseEnter={() => setHoveredSubcategory("Queen")}
                        >
                          <div className="flex-shrink-0" style={{ width: '80px' }}>
                            <CreditCard className="text-[#00C1A7]" strokeWidth={1.5} style={{ width: '64px', height: '40px' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-base text-gray-900 group-hover:text-[#00C1A7] transition-colors">Queen</p>
                            <p className="text-sm text-gray-600 mt-0.5">160x200 cm</p>
                          </div>
                        </div>
                        <div 
                          className="flex items-center gap-4 cursor-pointer group hover:bg-gray-50 p-3 rounded-lg transition-all"
                          onMouseEnter={() => setHoveredSubcategory("Extra-Queen")}
                        >
                          <div className="flex-shrink-0" style={{ width: '80px' }}>
                            <CreditCard className="text-[#00C1A7]" strokeWidth={1.5} style={{ width: '72px', height: '40px' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-base text-gray-900 group-hover:text-[#00C1A7] transition-colors">Extra-Queen</p>
                            <p className="text-sm text-gray-600 mt-0.5">180x200 cm</p>
                          </div>
                        </div>
                        <div 
                          className="flex items-center gap-4 cursor-pointer group hover:bg-gray-50 p-3 rounded-lg transition-all"
                          onMouseEnter={() => setHoveredSubcategory("King")}
                        >
                          <div className="flex-shrink-0" style={{ width: '80px' }}>
                            <CreditCard className="text-[#00C1A7]" strokeWidth={1.5} style={{ width: '80px', height: '40px' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-base text-gray-900 group-hover:text-[#00C1A7] transition-colors">King</p>
                            <p className="text-sm text-gray-600 mt-0.5">200x200 cm</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Side - Image or Subcategories */}
                  <div className="flex flex-col items-end">
                    {hoveredSubcategory && ["Queen", "Extra-Queen", "King"].includes(hoveredSubcategory) ? (
                      // Show subcategories when hovering second column
                      <div className="w-full h-80 animate-slideInFromTop flex flex-col justify-start">
                        <h3 className="font-semibold text-lg text-gray-900 mb-4">{hoveredSubcategory}</h3>
                        <div className="space-y-3">
                          <a href="#" className="block text-base text-gray-700 hover:text-[#00C1A7] transition-colors py-2 border-b border-gray-100">Espuma alta densidad</a>
                          <a href="#" className="block text-base text-gray-700 hover:text-[#00C1A7] transition-colors py-2 border-b border-gray-100">Resortes</a>
                          <button
                            onClick={() => setHoveredSubcategory(null)}
                            className="block text-base text-gray-500 hover:text-gray-700 transition-colors py-2 text-left w-full"
                          >
                            ← Volver atrás
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Show image
                      <div className="relative w-full h-80 rounded-lg overflow-hidden">
                        <img
                          src="/Frame 6.png"
                          alt="Colchón"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dropdown Menu for Sommiers y bases */}
          {(hoveredCategory === "Sommiers y bases" || closingCategory === "Sommiers y bases") && (
            <div 
              className={`absolute top-full left-0 w-full bg-white shadow-lg border-t border-gray-200 z-50 ${previousCategory === null && !isClosing ? 'animate-slideInFromTop' : ''} ${isClosing && closingCategory === "Sommiers y bases" ? 'animate-slideOutToTop' : ''}`}
              onMouseEnter={() => {
                if (isClosing) {
                  setIsClosing(false);
                  setClosingCategory(null);
                }
              }}
              onMouseLeave={() => {
                setIsClosing(true);
                setClosingCategory("Sommiers y bases");
                setTimeout(() => {
                  setHoveredCategory(null);
                  setHoveredSubcategory(null);
                  setPreviousCategory(null);
                  setIsClosing(false);
                  setClosingCategory(null);
                }, 200);
              }}
            >
              <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-3 gap-8">
                  {/* Left Column - Categories */}
                  <div className="space-y-4">
                    <a href="#" className="flex items-center gap-4 cursor-pointer group hover:bg-gray-50 p-3 rounded-lg transition-all">
                      <div className="flex-shrink-0" style={{ width: '80px' }}>
                        <Sofa className="text-[#00C1A7]" strokeWidth={1.5} style={{ width: '48px', height: '40px' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-gray-900 group-hover:text-[#00C1A7] transition-colors">Sommier (colchón + base)</p>
                      </div>
                    </a>
                    <a href="#" className="flex items-center gap-4 cursor-pointer group hover:bg-gray-50 p-3 rounded-lg transition-all">
                      <div className="flex-shrink-0" style={{ width: '80px' }}>
                        <Sofa className="text-[#00C1A7]" strokeWidth={1.5} style={{ width: '48px', height: '40px' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-gray-900 group-hover:text-[#00C1A7] transition-colors">Bases</p>
                      </div>
                    </a>
                  </div>

                  {/* Middle Column - Categories */}
                  <div className="space-y-4">
                    <a href="#" className="flex items-center gap-4 cursor-pointer group hover:bg-gray-50 p-3 rounded-lg transition-all">
                      <div className="flex-shrink-0" style={{ width: '80px' }}>
                        <Sofa className="text-[#00C1A7]" strokeWidth={1.5} style={{ width: '48px', height: '40px' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-gray-900 group-hover:text-[#00C1A7] transition-colors">Sommier + respaldo</p>
                      </div>
                    </a>
                    <a href="#" className="flex items-center gap-4 cursor-pointer group hover:bg-gray-50 p-3 rounded-lg transition-all">
                      <div className="flex-shrink-0" style={{ width: '80px' }}>
                        <Sofa className="text-[#00C1A7]" strokeWidth={1.5} style={{ width: '48px', height: '40px' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-gray-900 group-hover:text-[#00C1A7] transition-colors">Respaldos</p>
                      </div>
                    </a>
                  </div>

                  {/* Right Side - Image */}
                  <div className="flex flex-col items-end">
                    <div className="relative w-full h-80 rounded-lg overflow-hidden">
                      <img
                        src="/Frame 6.png"
                        alt="Sommier"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dropdown Menu for Accesorios */}
          {(hoveredCategory === "Accesorios" || closingCategory === "Accesorios") && (
            <div 
              className={`absolute top-full left-0 w-full bg-white shadow-lg border-t border-gray-200 z-50 ${previousCategory === null && !isClosing ? 'animate-slideInFromTop' : ''} ${isClosing && closingCategory === "Accesorios" ? 'animate-slideOutToTop' : ''}`}
              onMouseEnter={() => {
                if (isClosing) {
                  setIsClosing(false);
                  setClosingCategory(null);
                }
              }}
              onMouseLeave={() => {
                setIsClosing(true);
                setClosingCategory("Accesorios");
                setTimeout(() => {
                  setHoveredCategory(null);
                  setHoveredSubcategory(null);
                  setPreviousCategory(null);
                  setIsClosing(false);
                  setClosingCategory(null);
                }, 200);
              }}
            >
              <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-3 gap-8">
                  {/* Left Column - Categories */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 cursor-pointer group hover:bg-gray-50 p-3 rounded-lg transition-all">
                      <div className="flex-shrink-0" style={{ width: '80px' }}>
                        <Package className="text-[#00C1A7]" strokeWidth={1.5} style={{ width: '40px', height: '40px' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-gray-900 group-hover:text-[#00C1A7] transition-colors">Sábanas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 cursor-pointer group hover:bg-gray-50 p-3 rounded-lg transition-all">
                      <div className="flex-shrink-0" style={{ width: '80px' }}>
                        <Package className="text-[#00C1A7]" strokeWidth={1.5} style={{ width: '40px', height: '40px' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-gray-900 group-hover:text-[#00C1A7] transition-colors">Cubre colchón</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Categories */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 cursor-pointer group hover:bg-gray-50 p-3 rounded-lg transition-all">
                      <div className="flex-shrink-0" style={{ width: '80px' }}>
                        <Package className="text-[#00C1A7]" strokeWidth={1.5} style={{ width: '40px', height: '40px' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-gray-900 group-hover:text-[#00C1A7] transition-colors">Almohadas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 cursor-pointer group hover:bg-gray-50 p-3 rounded-lg transition-all">
                      <div className="flex-shrink-0" style={{ width: '80px' }}>
                        <Package className="text-[#00C1A7]" strokeWidth={1.5} style={{ width: '40px', height: '40px' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-gray-900 group-hover:text-[#00C1A7] transition-colors">Acolchados</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Image */}
                  <div className="flex flex-col items-end">
                    <div className="relative w-full h-80 rounded-lg overflow-hidden">
                      <img
                        src="/Frame 6.png"
                        alt="Accesorios"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dropdown Menu for Electrodomésticos */}
          {(hoveredCategory === "Electrodomésticos" || closingCategory === "Electrodomésticos") && (
            <div 
              className={`absolute top-full left-0 w-full bg-white shadow-lg border-t border-gray-200 z-50 ${previousCategory === null && !isClosing ? 'animate-slideInFromTop' : ''} ${isClosing && closingCategory === "Electrodomésticos" ? 'animate-slideOutToTop' : ''}`}
              onMouseEnter={() => {
                if (isClosing) {
                  setIsClosing(false);
                  setClosingCategory(null);
                }
              }}
              onMouseLeave={() => {
                setHoveredSubcategory(null);
                setIsClosing(true);
                setClosingCategory("Electrodomésticos");
                setTimeout(() => {
                  setHoveredCategory(null);
                  setHoveredSubcategory(null);
                  setPreviousCategory(null);
                  setIsClosing(false);
                  setClosingCategory(null);
                }, 200);
              }}
            >
              <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-3 gap-8">
                  {/* Left Column - Categories */}
                  <div className="space-y-4">
                    <div 
                      className="flex items-center gap-4 cursor-pointer group hover:bg-gray-50 p-3 rounded-lg transition-all"
                      onMouseEnter={() => setHoveredSubcategory("Grandes electros")}
                    >
                      <div className="flex-shrink-0" style={{ width: '80px' }}>
                        <Microwave className="text-[#00C1A7]" strokeWidth={1.5} style={{ width: '40px', height: '40px' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-gray-900 group-hover:text-[#00C1A7] transition-colors">Grandes electros</p>
                      </div>
                    </div>
                    <div 
                      className="flex items-center gap-4 cursor-pointer group hover:bg-gray-50 p-3 rounded-lg transition-all"
                      onMouseEnter={() => setHoveredSubcategory("Pequeños electros")}
                    >
                      <div className="flex-shrink-0" style={{ width: '80px' }}>
                        <Microwave className="text-[#00C1A7]" strokeWidth={1.5} style={{ width: '40px', height: '40px' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-gray-900 group-hover:text-[#00C1A7] transition-colors">Pequeños electros</p>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column - Subcategories */}
                  <div 
                    className="space-y-4"
                    onMouseEnter={() => {
                      // Keep subcategories open when entering this column
                    }}
                    onMouseLeave={() => {
                      // Only close if we're leaving to go outside the dropdown area
                      // Don't close if moving to another column
                    }}
                  >
                    {hoveredSubcategory === "Grandes electros" ? (
                      // Show subcategories when hovering Grandes electros
                      <div className="animate-slideInFromTop">
                        <h3 className="font-semibold text-lg text-gray-900 mb-4">Grandes electros</h3>
                        <div className="space-y-3">
                          <a href="#" className="block text-base text-gray-700 hover:text-[#00C1A7] transition-colors py-2 border-b border-gray-100">Heladeras</a>
                          <a href="#" className="block text-base text-gray-700 hover:text-[#00C1A7] transition-colors py-2 border-b border-gray-100">Lavarropas</a>
                          <a href="#" className="block text-base text-gray-700 hover:text-[#00C1A7] transition-colors py-2 border-b border-gray-100">Aires acondicionados</a>
                          <a href="#" className="block text-base text-gray-700 hover:text-[#00C1A7] transition-colors py-2 border-b border-gray-100">Cocinas</a>
                          <a href="#" className="block text-base text-gray-700 hover:text-[#00C1A7] transition-colors py-2 border-b border-gray-100">Smart TV</a>
                        </div>
                      </div>
                    ) : hoveredSubcategory === "Pequeños electros" ? (
                      // Show subcategories when hovering Pequeños electros
                      <div className="animate-slideInFromTop">
                        <h3 className="font-semibold text-lg text-gray-900 mb-4">Pequeños electros</h3>
                        <div className="space-y-3">
                          <a href="#" className="block text-base text-gray-700 hover:text-[#00C1A7] transition-colors py-2 border-b border-gray-100">Pava electrica</a>
                          <a href="#" className="block text-base text-gray-700 hover:text-[#00C1A7] transition-colors py-2 border-b border-gray-100">Vaporera</a>
                          <a href="#" className="block text-base text-gray-700 hover:text-[#00C1A7] transition-colors py-2 border-b border-gray-100">Sandwuchera</a>
                          <a href="#" className="block text-base text-gray-700 hover:text-[#00C1A7] transition-colors py-2 border-b border-gray-100">Anafe</a>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Right Side - Image */}
                  <div className="flex flex-col items-end">
                    <div className="relative w-full h-80 rounded-lg overflow-hidden">
                      <img
                        src="/Frame 6.png"
                        alt="Electrodomésticos"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dropdown Menu for Muebles de cocina */}
          {(hoveredCategory === "Muebles de cocina" || closingCategory === "Muebles de cocina") && (
            <div 
              className={`absolute top-full left-0 w-full bg-white shadow-lg border-t border-gray-200 z-50 ${previousCategory === null && !isClosing ? 'animate-slideInFromTop' : ''} ${isClosing && closingCategory === "Muebles de cocina" ? 'animate-slideOutToTop' : ''}`}
              onMouseEnter={() => {
                if (isClosing) {
                  setIsClosing(false);
                  setClosingCategory(null);
                }
              }}
              onMouseLeave={() => {
                setIsClosing(true);
                setClosingCategory("Muebles de cocina");
                setTimeout(() => {
                  setHoveredCategory(null);
                  setHoveredSubcategory(null);
                  setPreviousCategory(null);
                  setIsClosing(false);
                  setClosingCategory(null);
                }, 200);
              }}
            >
              <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-3 gap-8">
                  {/* Left Column - Categories */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 cursor-pointer group hover:bg-gray-50 p-3 rounded-lg transition-all">
                      <div className="flex-shrink-0 flex items-center justify-center" style={{ width: '80px' }}>
                        <svg 
                          className="text-[#00C1A7] group-hover:text-[#00A892] transition-colors" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="1.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          style={{ width: '40px', height: '40px' }}
                        >
                          <rect x="3" y="5" width="18" height="14" rx="1" />
                          <path d="M3 9H21" />
                          <path d="M8 5V9" />
                          <path d="M16 5V9" />
                          <circle cx="9" cy="13" r="1" />
                          <circle cx="15" cy="13" r="1" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-gray-900 group-hover:text-[#00C1A7] transition-colors">Bajo mesada 120 cm</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 cursor-pointer group hover:bg-gray-50 p-3 rounded-lg transition-all">
                      <div className="flex-shrink-0 flex items-center justify-center" style={{ width: '80px' }}>
                        <svg 
                          className="text-[#00C1A7] group-hover:text-[#00A892] transition-colors" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="1.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          style={{ width: '40px', height: '40px' }}
                        >
                          <rect x="3" y="5" width="18" height="14" rx="1" />
                          <path d="M3 9H21" />
                          <path d="M8 5V9" />
                          <path d="M16 5V9" />
                          <circle cx="9" cy="13" r="1" />
                          <circle cx="15" cy="13" r="1" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-gray-900 group-hover:text-[#00C1A7] transition-colors">Bajo mesada 140 cm</p>
                      </div>
                    </div>
                  </div>

                  {/* Empty column for spacing */}
                  <div></div>

                  {/* Right Side - Image */}
                  <div className="flex flex-col items-end">
                    <div className="relative w-full h-80 rounded-lg overflow-hidden">
                      <img
                        src="/Frame 6.png"
                        alt="Muebles de cocina"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Cart Overlay */}
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}

