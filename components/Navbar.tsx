"use client";

import { useState } from "react";
import { 
  Truck, 
  CreditCard, 
  Search, 
  User, 
  Heart, 
  ShoppingCart,
  Tag
} from "lucide-react";
import Cart from "./Cart";

export default function Navbar() {
  const [isCartOpen, setIsCartOpen] = useState(false);

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
              <div className="flex items-center flex-shrink-0">
                <img
                  src="/images/logo/logo.svg"
                  alt="BAUSING Logo"
                  className="h-10 w-auto"
                />
              </div>

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
        <nav className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-8 py-3">
              <a href="#" className="text-black hover:text-gray-600 font-medium">Colchones</a>
              <a href="#" className="text-black hover:text-gray-600 font-medium">Sommiers y bases</a>
              <a href="#" className="text-black hover:text-gray-600 font-medium">Accesorios</a>
              <a href="#" className="text-black hover:text-gray-600 font-medium">Electrodomésticos</a>
              <a href="#" className="text-black hover:text-gray-600 font-medium">Muebles de cocina</a>
            </div>
          </div>
        </nav>
      </div>

      {/* Cart Overlay */}
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}

