"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import NavLink from "./NavLink";
import { LogOut, Home, ShoppingCart, Users, CreditCard, Package, Truck, BarChart3, UserCog, Settings, Tag, User, ChevronDown, Image } from "lucide-react";
import { getCurrentAdminUser, AdminUser } from "@/lib/api";

export default function Sidebar() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await getCurrentAdminUser();
        setAdminUser(user);
        console.log(user);
      } catch (error) {
        console.error("Error fetching admin user:", error);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const checkScrollable = () => {
      if (navRef.current) {
        const element = navRef.current;
        // Usar requestAnimationFrame para asegurar que las dimensiones estén actualizadas
        requestAnimationFrame(() => {
          if (element) {
            // Mostrar flecha si hay más contenido que el área visible
            const hasScroll = element.scrollHeight > element.clientHeight + 2; // +2 para evitar problemas de redondeo
            const isScrolledToBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 15;
            const shouldShow = hasScroll && !isScrolledToBottom;
            setShowScrollIndicator(shouldShow);
          }
        });
      }
    };

    // Ejecutar después de que el DOM se renderice completamente
    const timeoutId = setTimeout(() => {
      checkScrollable();
    }, 100);
    
    // También usar requestAnimationFrame múltiples veces para asegurar
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        checkScrollable();
      });
    });
    
    window.addEventListener('resize', checkScrollable);
    
    const navElement = navRef.current;
    if (navElement) {
      navElement.addEventListener('scroll', checkScrollable);
      
      // Usar ResizeObserver para detectar cambios en el tamaño
      const resizeObserver = new ResizeObserver(() => {
        setTimeout(checkScrollable, 50);
      });
      resizeObserver.observe(navElement);

      // También observar el contenedor padre
      const parentElement = navElement.parentElement;
      if (parentElement) {
        resizeObserver.observe(parentElement);
      }

      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', checkScrollable);
        navElement.removeEventListener('scroll', checkScrollable);
        resizeObserver.disconnect();
      };
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkScrollable);
    };
  }, [isLoadingUser]);

  const handleLogout = () => {
    // Eliminar cookie
    document.cookie = "admin_token=; path=/; max-age=0";
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <aside className="w-72 flex flex-col gap-3">
      {/* Logo */}
      <div className="bg-white rounded-[14px] px-4 py-2 flex items-center justify-center">
        <svg 
          id="Capa_2" 
          data-name="Capa 2" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 489.2 350"
          className="h-16 w-auto"
          style={{ fontFamily: 'var(--font-michroma), Michroma, sans-serif' }}
        >
          <defs>
            <style>
              {`.cls-1 {
                letter-spacing: -.01em;
              }
              .cls-2 {
                font-family: var(--font-michroma), 'Michroma', sans-serif;
                font-size: 73.2px;
              }
              .cls-3 {
                font-size: 38.33px;
              }
              .cls-4 {
                stroke: #edbb6b;
              }
              .cls-4, .cls-5 {
                fill: #edbb6b;
              }
              .cls-4, .cls-6 {
                stroke-miterlimit: 10;
              }
              .cls-7 {
                letter-spacing: 0em;
              }
              .cls-6 {
                fill: #88cac2;
                stroke: #88cac2;
              }
              .cls-8 {
                letter-spacing: -.01em;
              }`}
            </style>
          </defs>
          <path className="cls-6" d="M43.1,207.89c17.77-9.29,40.19-13.08,40.19-13.08,47.85-15.6,132.81-2.57,137.86-2.14s107.81,18.33,107.81,18.33c0,0,36.08,6.06,70.14-1.01,34.06-7.07,53.89-41.3,55.06-44.72,1.17-3.42-1.34-1.92-1.34-1.92-4.76,4.92-28.63,19.03-38.97,23.2s-10.18.58-10.27.25,2.22-16.96,2.22-16.96c4.66-27.76-5.5-52.09-5.5-52.09,0,0,4.52-6.14,2.57-12.84-1.95-6.71-9.28-5.57-11.23-5.47s-12.03,5.04-13.37,4.99-5.18-1.11-5.18-1.11c-27.15-7.73-85.09-2.39-85.09-2.39,0,0-21.73,7.37-30.49,1.83s-15.87-.07-15.87-.07c0,0-3.31,5.63-2.47,8.6s2.21,8.03,2.28,10.2-3.09,10.16-3.09,10.16c-4.42,20.27-1.44,40.79-1.04,42.53s-.31,3.95-.31,3.95l-2.27.09c-12.39.41-10.76-2.93-10.76-2.93.27-38.05-2.77-52.2-4.09-53.89s-.63-2.54,1.11-11.16-6.93-11.21-6.93-11.21c0,0-4.28-.74-11,2.64s-10.37,2.06-10.37,2.06c-8.57-3.65-24.85-4.65-24.85-4.65,0,0-53.69-2.1-65.67,2.1s-22.54,3.42-22.54,3.42l-1.37-.8c-3.38-2.41-8.65-3.43-8.65-3.43,0,0-2.71-.64-6.96.35s-5.42,6.19-5.42,6.19c0,0-.77,4,1.03,7.32s.48,7.19.29,7.87-2.75,10.85-2.75,10.85c-3.08,12.76-.82,46.02-.82,46.02,0,0,1.7,10.76,3.47,14.06s-1.05,4.79-1.05,4.79c-6.28,2.59-16.49,9.81-16.49,9.81,0,0-.15,1.16,2.14.25Z"/>
          <path className="cls-4" d="M3.65,236.77s45.34-32.31,102.65-37.74,99.32.25,153.18,11.12c53.86,10.87,91.91,22.24,134.4,16.55,42.49-5.68,73.87-26.44,87.95-51.64,0,0,3.95-7.12,4.07-7.66s2.54-2.18,2.79.79c.24,2.97-6.54,34.78-26.24,54.31-19.7,19.54-47.79,33.74-100.43,30.03,0,0-52.31-5.49-106.56-19.86,0,0-48.44-11.95-68.3-14.37s-56.43-8.56-99.78-3.07S3.65,236.77,3.65,236.77Z"/>
          <path className="cls-5" d="M382.34,31.08s5.65-8,5.87-8.06,1.19-.94.91,1c-.28,1.94-2.87,14.27-2.87,14.27,0,0-.94,2.59,1.53,3.84s10.87,8.34,10.87,8.34c0,0,.91,1.53-1.5,1.25s-13.52-3.25-13.52-3.25c0,0-.81-.66-2.34,1.59-1.53,2.25-9.78,12.99-9.78,12.99,0,0-.97,0-.62-1.44s2.78-13.65,2.78-13.65c0,0,.91-3.15-.69-4.03s-12.93-9.59-12.93-9.59c0,0-.72-1.28.78-1.03s13.21,3.19,13.21,3.19c0,0,3.53,1.03,4.69-.44,1.16-1.47,3.62-5,3.62-5Z"/>
          <path className="cls-5" d="M390.67,2.84s1.93-2.73,2-2.75.4-.32.31.34-.98,4.87-.98,4.87c0,0-.32.88.52,1.31s3.71,2.84,3.71,2.84c0,0,.31.52-.51.43s-4.61-1.11-4.61-1.11c0,0-.28-.22-.8.54s-3.33,4.43-3.33,4.43c0,0-.33,0-.21-.49s.95-4.66.95-4.66c0,0,.31-1.08-.23-1.37s-4.41-3.27-4.41-3.27c0,0-.25-.44.27-.35s4.51,1.09,4.51,1.09c0,0,1.2.35,1.6-.15s1.24-1.7,1.24-1.7Z"/>
          <path className="cls-5" d="M412.8,23.46s2.97-4.2,3.09-4.24.62-.49.48.53-1.51,7.5-1.51,7.5c0,0-.49,1.36.8,2.02s5.71,4.38,5.71,4.38c0,0,.48.8-.79.66s-7.11-1.71-7.11-1.71c0,0-.43-.34-1.23.84-.8,1.18-5.14,6.83-5.14,6.83,0,0-.51,0-.33-.76s1.46-7.17,1.46-7.17c0,0,.48-1.66-.36-2.12s-6.8-5.04-6.8-5.04c0,0-.38-.67.41-.54s6.94,1.67,6.94,1.67c0,0,1.86.54,2.46-.23s1.9-2.63,1.9-2.63Z"/>
          <text className="cls-2" transform="translate(3.65 327.53)"><tspan x="0" y="0">BAUSING</tspan></text>
        </svg>
      </div>

      {/* Tarjeta del menú de navegación con datos de usuario */}
      <div className="bg-white rounded-[14px] px-5 py-6 text-[14.5px] flex flex-col max-h-[calc(100vh-139px)]">
        {/* Datos del usuario */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-6 h-6 text-gray-500" />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-normal text-sm text-gray-900 truncate">
                Administrador
              </p>
              <p className="text-xs text-gray-500 truncate">
                {isLoadingUser ? "Cargando..." : (adminUser?.email || "Usuario")}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="text-gray-400 cursor-pointer hover:text-red-500 ml-2 flex-shrink-0"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Menú de navegación con scroll */}
        <div className="relative flex-1 pb-2 overflow-hidden min-h-0">
          <nav 
            ref={navRef} 
            className="h-full overflow-y-auto pr-2 scrollbar-hide"
            style={{ maxHeight: '100%' }}
          >
            <ul className="space-y-2.5 pb-2">
              <li key="inicio">
                <NavLink
                  href="/admin"
                  icon={<Home className="w-5 h-5" />}
                >
                  Inicio
                </NavLink>
              </li>
              <li key="ventas">
                <NavLink
                  href="/admin/ventas"
                  icon={<ShoppingCart className="w-5 h-5" />}
                >
                  Ventas (X)
                </NavLink>
              </li>
              <li key="clientes">
                <NavLink
                  href="/admin/clientes"
                  icon={<Users className="w-5 h-5" />}
                >
                  Clientes (X)
                </NavLink>
              </li>
              <li key="billetera">
                <NavLink
                  href="/admin/billetera"
                  icon={<CreditCard className="w-5 h-5" />}
                >
                  Billetera Bausing (X)
                </NavLink>
              </li>
              <li key="productos">
                <NavLink
                  href="/admin/productos"
                  icon={<Package className="w-5 h-5" />}
                >
                  Productos (X)
                </NavLink>
              </li>
              <li key="imagenes">
                <NavLink
                  href="/admin/imagenes"
                  icon={<Image className="w-5 h-5" />}
                >
                  Imágenes
                </NavLink>
              </li>
              <li key="promos">
                <NavLink
                  href="/admin/promos"
                  icon={<Tag className="w-5 h-5" />}
                >
                  Promos (X)
                </NavLink>
              </li>
              <li key="envios">
                <NavLink
                  href="/admin/envios"
                  icon={<Truck className="w-5 h-5" />}
                >
                  Logística (X)
                </NavLink>
              </li>
              <li key="reportes">
                <NavLink
                  href="/admin/reportes"
                  icon={<BarChart3 className="w-5 h-5" />}
                >
                  Reportes (X)
                </NavLink>
              </li>
              <li key="usuarios">
                <NavLink
                  href="/admin/usuarios"
                  icon={<UserCog className="w-5 h-5" />}
                >
                  Usuarios 
                </NavLink>
              </li>
              <li key="configuracion">
                <NavLink
                  href="/admin/configuracion"
                  icon={<Settings className="w-5 h-5" />}
                >
                  Configuración
                </NavLink>
              </li>
            </ul>
          </nav>
          {/* Flecha indicadora de scroll */}
          {showScrollIndicator && (
            <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-white via-white/85 to-transparent pointer-events-none flex items-end justify-center pb-3 z-10">
              <div className="flex flex-col items-center gap-1.5 animate-gentleBounce">
                <div className="w-7 h-7 rounded-full bg-white shadow-md border border-gray-200/50 flex items-center justify-center backdrop-blur-sm hover:shadow-lg transition-shadow">
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

