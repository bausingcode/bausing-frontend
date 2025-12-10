"use client";

import { useState, useRef } from "react";
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
  LucideIcon,
  Microwave,
  Refrigerator,
  WashingMachine,
  AirVent,
  ChefHat,
  Tv,
  Coffee,
  UtensilsCrossed,
  Flame,
  Ruler,
  Layers,
  Combine,
  Sheet,
  Droplets,
  Sandwich
} from "lucide-react";
import Cart from "./Cart";
import Image from "next/image";

// Tipos para la estructura de datos
interface SubcategoryItem {
  name: string;
  href: string;
  icon?: LucideIcon;
}

interface CategoryItem {
  name: string;
  icon?: LucideIcon;
  iconSize?: { width: string; height: string };
  description?: string;
  href?: string;
  subcategories?: SubcategoryItem[];
}

interface CategoryData {
  name: string;
  icon?: LucideIcon;
  columns: {
    left: CategoryItem[];
    middle?: CategoryItem[];
  };
  imageUrl?: string;
  imageAlt?: string;
}

// Estructura de datos escalable - Aquí puedes modificar fácilmente las categorías y subcategorías
const categoriesData: Record<string, CategoryData> = {
  "Colchones": {
    name: "Colchones",
    columns: {
      left: [
        {
          name: "Una plaza",
          icon: Bed,
          iconSize: { width: '40px', height: '40px' },
          description: "80x190 cm",
          subcategories: [
            { name: "Espuma alta densidad", href: "/colchones/una-plaza/espuma-alta-densidad", icon: Bed },
            { name: "Resortes", href: "/colchones/una-plaza/resortes", icon: Bed }
          ]
        },
        {
          name: "Plaza y media",
          icon: Bed,
          iconSize: { width: '40px', height: '40px' },
          description: "90x190 / 100x200 cm",
          subcategories: [
            { name: "Espuma alta densidad", href: "/colchones/plaza-y-media/espuma-alta-densidad", icon: Bed },
            { name: "Resortes", href: "/colchones/plaza-y-media/resortes", icon: Bed }
          ]
        },
        {
          name: "Dos plazas",
          icon: Bed,
          iconSize: { width: '40px', height: '40px' },
          description: "140x190 cm",
          subcategories: [
            { name: "Espuma alta densidad", href: "/colchones/dos-plazas/espuma-alta-densidad", icon: Bed },
            { name: "Resortes", href: "/colchones/dos-plazas/resortes", icon: Bed }
          ]
        }
      ],
      middle: [
        {
          name: "Queen",
          icon: Bed,
          iconSize: { width: '40px', height: '40px' },
          description: "160x200 cm",
          subcategories: [
            { name: "Espuma alta densidad", href: "/colchones/queen/espuma-alta-densidad", icon: Bed },
            { name: "Resortes", href: "/colchones/queen/resortes", icon: Bed }
          ]
        },
        {
          name: "Extra-queen",
          icon: Bed,
          iconSize: { width: '40px', height: '40px' },
          description: "180x200 cm",
          subcategories: [
            { name: "Espuma alta densidad", href: "/colchones/extra-queen/espuma-alta-densidad", icon: Bed },
            { name: "Resortes", href: "/colchones/extra-queen/resortes", icon: Bed }
          ]
        },
        {
          name: "King",
          icon: Bed,
          iconSize: { width: '40px', height: '40px' },
          description: "200x200 cm",
          subcategories: [
            { name: "Espuma alta densidad", href: "/colchones/king/espuma-alta-densidad", icon: Bed },
            { name: "Resortes", href: "/colchones/king/resortes", icon: Bed }
          ]
        }
      ]
    },
    imageUrl: "/images/home/4.png",
    imageAlt: "Colchón"
  },
  "Sommiers y bases": {
    name: "Sommiers y bases",
    columns: {
      left: [
        {
          name: "Sommier (colchón + base)",
          icon: Sofa,
          iconSize: { width: '48px', height: '40px' },
          href: "/sommiers/sommier-completo"
        },
        {
          name: "Bases",
          icon: Sofa,
          iconSize: { width: '48px', height: '40px' },
          href: "/sommiers/bases"
        }
      ],
      middle: [
        {
          name: "Sommier + respaldo",
          icon: Sofa,
          iconSize: { width: '48px', height: '40px' },
          href: "/sommiers/sommier-respaldo"
        },
        {
          name: "Respaldos",
          icon: Sofa,
          iconSize: { width: '48px', height: '40px' },
          href: "/sommiers/respaldos"
        }
      ]
    },
    imageUrl: "/images/home/4.png",
    imageAlt: "Sommier"
  },
  "Accesorios": {
    name: "Accesorios de descanso",
    columns: {
      left: [
        {
          name: "Sábanas",
          icon: Bed,
          iconSize: { width: '40px', height: '40px' },
          href: "/accesorios/sabanas"
        },
        {
          name: "Cubre colchón",
          icon: Bed,
          iconSize: { width: '40px', height: '40px' },
          href: "/accesorios/cubre-colchon"
        }
      ],
      middle: [
        {
          name: "Almohadas",
          icon: Bed,
          iconSize: { width: '40px', height: '40px' },
          href: "/accesorios/almohadas"
        },
        {
          name: "Acolchados",
          icon: Bed,
          iconSize: { width: '40px', height: '40px' },
          href: "/accesorios/acolchados"
        }
      ]
    },
    imageUrl: "/images/home/4.png",
    imageAlt: "Accesorios"
  },
  "Electrodomésticos": {
    name: "Electrodomésticos",
    columns: {
      left: [
        {
          name: "Grandes electros",
          icon: Refrigerator,
          iconSize: { width: '40px', height: '40px' },
          subcategories: [
            { name: "Heladeras", href: "/electrodomesticos/grandes/heladeras", icon: Refrigerator },
            { name: "Lavarropas", href: "/electrodomesticos/grandes/lavarropas", icon: WashingMachine },
            { name: "Aires acondicionados", href: "/electrodomesticos/grandes/aires-acondicionados", icon: AirVent },
            { name: "Cocinas", href: "/electrodomesticos/grandes/cocinas", icon: ChefHat },
            { name: "Smart TV", href: "/electrodomesticos/grandes/smart-tv", icon: Tv }
          ]
        },
        {
          name: "Pequeños electros",
          icon: Microwave,
          iconSize: { width: '40px', height: '40px' },
          subcategories: [
            { name: "Pava electrica", href: "/electrodomesticos/pequenos/pava-electrica", icon: Coffee },
            { name: "Vaporera", href: "/electrodomesticos/pequenos/vaporera", icon: Droplets },
            { name: "Sandwuchera", href: "/electrodomesticos/pequenos/sandwuchera", icon: Sandwich },
            { name: "Anafe", href: "/electrodomesticos/pequenos/anafe", icon: Flame }
          ]
        }
      ]
    },
    imageUrl: "/images/home/4.png",
    imageAlt: "Electrodomésticos"
  },
  "Muebles de cocina": {
    name: "Muebles de cocina",
    columns: {
      left: [
        {
          name: "Bajo mesada 120 cm",
          icon: Sofa,
          iconSize: { width: '40px', height: '40px' },
          href: "/muebles-cocina/bajo-mesada-120"
        },
        {
          name: "Bajo mesada 140 cm",
          icon: Sofa,
          iconSize: { width: '40px', height: '40px' },
          href: "/muebles-cocina/bajo-mesada-140"
        }
      ]
    },
    imageUrl: "/images/home/4.png",
    imageAlt: "Muebles de cocina"
  }
};

// Lista de categorías principales para el menú
const mainCategories = Object.keys(categoriesData);

export default function Navbar() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredSubcategory, setHoveredSubcategory] = useState<string | null>(null);
  const [previousCategory, setPreviousCategory] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [closingCategory, setClosingCategory] = useState<string | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  return (
    <>
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        {/* Top Header - Light Green Bar */}
        <div className="bg-[#00C1A7] py-1.5">
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
          onMouseLeave={(e) => {
            // Verificar si el cursor va hacia un dropdown
            const relatedTarget = e.relatedTarget;
            const isGoingToDropdown = relatedTarget && 
              relatedTarget instanceof HTMLElement && 
              relatedTarget.closest('.absolute') !== null;
            
            // Solo cerrar si el cursor sale completamente (no hacia un dropdown)
            if (!isGoingToDropdown) {
              // Agregar un pequeño delay antes de cerrar para evitar cierres accidentales
              if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
              }
              closeTimeoutRef.current = setTimeout(() => {
                setHoveredCategory(null);
                setHoveredSubcategory(null);
                setPreviousCategory(null);
                setIsClosing(false);
                setClosingCategory(null);
              }, 200);
            }
          }}
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-8 py-3">
              {mainCategories.map((categoryName) => {
                const categoryData = categoriesData[categoryName];
                const CategoryIcon = categoryData?.icon;
                return (
                  <a 
                    key={categoryName}
                    href="#" 
                    className="flex items-center gap-2 text-black hover:text-gray-600 font-medium"
                    onMouseEnter={() => {
                      // Cancelar cualquier cierre pendiente cuando cambias de categoría
                      if (closeTimeoutRef.current) {
                        clearTimeout(closeTimeoutRef.current);
                        closeTimeoutRef.current = null;
                      }
                      
                      const wasOpen = hoveredCategory !== null;
                      const isDifferentCategory = hoveredCategory !== categoryName;
                      
                      // Si cambias a una categoría diferente, resetear el estado de cierre
                      if (isDifferentCategory) {
                        setIsClosing(false);
                        setClosingCategory(null);
                        setHoveredSubcategory(null);
                      }
                      
                      setPreviousCategory(hoveredCategory);
                      setHoveredCategory(categoryName);
                    }}
                  >
                    {CategoryIcon && (
                      <CategoryIcon className="w-5 h-5 text-[#00C1A7]" />
                    )}
                    <span>{categoryName}</span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Dropdown Menus - Generated from data */}
          {mainCategories.map((categoryName) => {
            const categoryData = categoriesData[categoryName];
            if (!categoryData) return null;
            
            const isActive = hoveredCategory === categoryName || closingCategory === categoryName;
            if (!isActive) return null;

            // Encontrar el item activo que tiene el submenu abierto
            const activeItem = categoryData.columns.left
              .concat(categoryData.columns.middle || [])
              .find(item => item.name === hoveredSubcategory);

            // El grid siempre tiene 3 columnas: izquierda, medio (puede estar vacía), y derecha (imagen)
            const gridCols = 'grid-cols-3';

            // Obtener nombres de items de la columna izquierda para mostrar subcategorías en la columna del medio
            const leftColumnItemNames = categoryData.columns.left
              .filter(item => item.subcategories && item.subcategories.length > 0)
              .map(item => item.name);

            // Obtener nombres de items de la columna del medio para mostrar subcategorías en la columna derecha
            const middleColumnItemNames = categoryData.columns.middle
              ?.filter(item => item.subcategories && item.subcategories.length > 0)
              .map(item => item.name) || [];

            return (
              <div 
                key={categoryName}
                className={`absolute top-full left-0 w-full bg-white shadow-lg border-t border-gray-200 z-50 ${previousCategory === null && !isClosing ? 'animate-slideInFromTop' : ''} ${isClosing && closingCategory === categoryName ? 'animate-slideOutToTop' : ''}`}
                style={{ marginTop: '-1px' }}
                onMouseEnter={() => {
                  // Cancelar cualquier cierre pendiente
                  if (closeTimeoutRef.current) {
                    clearTimeout(closeTimeoutRef.current);
                    closeTimeoutRef.current = null;
                  }
                  if (isClosing) {
                    setIsClosing(false);
                    setClosingCategory(null);
                  }
                }}
                onMouseLeave={(e) => {
                  // Verificar si el cursor va hacia el nav o hacia fuera
                  const relatedTarget = e.relatedTarget;
                  const isGoingToNav = relatedTarget && 
                    relatedTarget instanceof HTMLElement && 
                    relatedTarget.closest('nav') !== null;
                  
                  // Si va hacia el nav, no cerrar (el nav manejará el cierre)
                  if (isGoingToNav) {
                    return;
                  }
                  
                  // Si sale completamente, iniciar el cierre
                  if (closeTimeoutRef.current) {
                    clearTimeout(closeTimeoutRef.current);
                  }
                  setIsClosing(true);
                  setClosingCategory(categoryName);
                  closeTimeoutRef.current = setTimeout(() => {
                    setHoveredCategory(null);
                    setHoveredSubcategory(null);
                    setPreviousCategory(null);
                    setIsClosing(false);
                    setClosingCategory(null);
                  }, 200);
                }}
              >
                <div className="container mx-auto px-4 py-6">
                  <div className={`grid ${gridCols} gap-8`}>
                    {/* Columna izquierda */}
                    {categoryData.columns.left && categoryData.columns.left.length > 0 && (
                      <div className="space-y-4">
                        {categoryData.columns.left.map((item, idx) => {
                          const Icon = item.icon || Package;
                          const hasSubcategories = item.subcategories && item.subcategories.length > 0;
                          
                          const ItemWrapper = item.href ? 'a' : 'div';
                          const itemProps = item.href ? { href: item.href } : {};

                          return (
                            <ItemWrapper
                              key={idx}
                              {...itemProps}
                              className="flex items-center gap-4 cursor-pointer group hover:bg-gray-50 p-3 rounded-lg transition-all"
                              onMouseEnter={() => {
                                if (hasSubcategories) {
                                  setHoveredSubcategory(item.name);
                                } else {
                                  setHoveredSubcategory(null);
                                }
                              }}
                              onMouseLeave={() => {
                                if (hasSubcategories) {
                                  setHoveredSubcategory(null);
                                }
                              }}
                            >
                              {item.icon && (
                                <div className="flex-shrink-0" style={{ width: '80px' }}>
                                  <Icon 
                                    className="text-[#00C1A7]" 
                                    strokeWidth={1.5} 
                                    style={item.iconSize || { width: '40px', height: '40px' }} 
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-base text-gray-900 group-hover:text-[#00C1A7] transition-colors">
                                  {item.name}
                                </p>
                                {item.description && (
                                  <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
                                )}
                              </div>
                            </ItemWrapper>
                          );
                        })}
                      </div>
                    )}

                    {/* Columna del medio */}
                    {categoryData.columns.middle && categoryData.columns.middle.length > 0 ? (
                      <div className="space-y-4">
                        {hoveredSubcategory && leftColumnItemNames.includes(hoveredSubcategory) ? (
                          // Mostrar subcategorías cuando se hace hover sobre un item de la columna izquierda
                          activeItem && activeItem.subcategories ? (
                            <div 
                              className="animate-slideInFromTop"
                              onMouseEnter={() => setHoveredSubcategory(activeItem.name)}
                              onMouseLeave={() => setHoveredSubcategory(null)}
                            >
                              <h3 className="font-semibold text-lg text-gray-900 mb-4">{activeItem.name}</h3>
                              <div className="space-y-3">
                                {activeItem.subcategories.map((subcat, subIdx) => {
                                  const SubIcon = subcat.icon;
                                  return (
                                    <a 
                                      key={subIdx}
                                      href={subcat.href} 
                                      className="flex items-center gap-3 text-base text-gray-700 hover:text-[#00C1A7] transition-colors py-2 border-b border-gray-100"
                                    >
                                      {SubIcon && (
                                        <SubIcon className="w-5 h-5 text-[#00C1A7] flex-shrink-0" />
                                      )}
                                      <span>{subcat.name}</span>
                                    </a>
                                  );
                                })}
                                <button
                                  onClick={() => setHoveredSubcategory(null)}
                                  className="block text-base text-gray-500 hover:text-gray-700 transition-colors py-2 text-left w-full"
                                >
                                  ← Volver atrás
                                </button>
                              </div>
                            </div>
                          ) : null
                        ) : (
                          // Mostrar items normales de la columna del medio
                          categoryData.columns.middle.map((item, idx) => {
                            const Icon = item.icon || Package;
                            const hasSubcategories = item.subcategories && item.subcategories.length > 0;
                            
                            const ItemWrapper = item.href ? 'a' : 'div';
                            const itemProps = item.href ? { href: item.href } : {};

                            return (
                              <ItemWrapper
                                key={idx}
                                {...itemProps}
                                className="flex items-center gap-4 cursor-pointer group hover:bg-gray-50 p-3 rounded-lg transition-all"
                                onMouseEnter={() => {
                                  if (hasSubcategories) {
                                    setHoveredSubcategory(item.name);
                                  } else {
                                    setHoveredSubcategory(null);
                                  }
                                }}
                                onMouseLeave={() => {
                                  if (hasSubcategories) {
                                    setHoveredSubcategory(null);
                                  }
                                }}
                              >
                                {item.icon && (
                                  <div className="flex-shrink-0" style={{ width: '80px' }}>
                                    <Icon 
                                      className="text-[#00C1A7]" 
                                      strokeWidth={1.5} 
                                      style={item.iconSize || { width: '40px', height: '40px' }} 
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-base text-gray-900 group-hover:text-[#00C1A7] transition-colors">
                                    {item.name}
                                  </p>
                                  {item.description && (
                                    <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
                                  )}
                                </div>
                              </ItemWrapper>
                            );
                          })
                        )}
                      </div>
                    ) : (
                      // Mostrar subcategorías cuando no hay columna del medio pero hay items con subcategorías en la izquierda
                      hoveredSubcategory && leftColumnItemNames.includes(hoveredSubcategory) && activeItem && activeItem.subcategories ? (
                        <div className="space-y-4">
                          <div 
                            className="animate-slideInFromTop"
                            onMouseEnter={() => setHoveredSubcategory(activeItem.name)}
                            onMouseLeave={() => setHoveredSubcategory(null)}
                          >
                            <h3 className="font-semibold text-lg text-gray-900 mb-4">{activeItem.name}</h3>
                            <div className="space-y-3">
                              {activeItem.subcategories.map((subcat, subIdx) => {
                                const SubIcon = subcat.icon;
                                return (
                                  <a 
                                    key={subIdx}
                                    href={subcat.href} 
                                    className="flex items-center gap-3 text-base text-gray-700 hover:text-[#00C1A7] transition-colors py-2 border-b border-gray-100"
                                  >
                                    {SubIcon && (
                                      <SubIcon className="w-5 h-5 text-[#00C1A7] flex-shrink-0" />
                                    )}
                                    <span>{subcat.name}</span>
                                  </a>
                                );
                              })}
                              <button
                                onClick={() => setHoveredSubcategory(null)}
                                className="block text-base text-gray-500 hover:text-gray-700 transition-colors py-2 text-left w-full"
                              >
                                ← Volver atrás
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Columna vacía para mantener el grid cuando no hay columna del medio ni subcategorías
                        <div></div>
                      )
                    )}

                    {/* Columna derecha - Imagen o subcategorías */}
                    <div className="flex flex-col">
                      {hoveredSubcategory && middleColumnItemNames.includes(hoveredSubcategory) ? (
                        // Mostrar subcategorías cuando se hace hover sobre un item de la columna del medio
                        activeItem && activeItem.subcategories ? (
                          <div 
                            className="w-full h-80 animate-slideInFromTop flex flex-col justify-start"
                            onMouseEnter={() => setHoveredSubcategory(activeItem.name)}
                            onMouseLeave={() => setHoveredSubcategory(null)}
                          >
                            <h3 className="font-semibold text-lg text-gray-900 mb-4">{activeItem.name}</h3>
                            <div className="space-y-3">
                              {activeItem.subcategories.map((subcat, subIdx) => {
                                const SubIcon = subcat.icon;
                                return (
                                  <a 
                                    key={subIdx}
                                    href={subcat.href} 
                                    className="flex items-center gap-3 text-base text-gray-700 hover:text-[#00C1A7] transition-colors py-2 border-b border-gray-100"
                                  >
                                    {SubIcon && (
                                      <SubIcon className="w-5 h-5 text-[#00C1A7] flex-shrink-0" />
                                    )}
                                    <span>{subcat.name}</span>
                                  </a>
                                );
                              })}
                              <button
                                onClick={() => setHoveredSubcategory(null)}
                                className="block text-base text-gray-500 hover:text-gray-700 transition-colors py-2 text-left w-full"
                              >
                                ← Volver atrás
                              </button>
                            </div>
                          </div>
                        ) : null
                      ) : categoryData.imageUrl ? (
                        // Mostrar imagen
                        <div className="relative w-full h-80 rounded-lg overflow-hidden">
                          <img
                            src={categoryData.imageUrl}
                            alt={categoryData.imageAlt || categoryData.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Cart Overlay */}
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}

