"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import NavLink from "./NavLink";
import { LogOut, Home, ShoppingCart, Users, CreditCard, Package, Truck, BarChart3, UserCog, Settings, Tag, User, ChevronDown, Image, FileText, Calendar, Mail, Star } from "lucide-react";
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
    router.push("/login-admin");
    router.refresh();
  };

  return (
    <aside className="w-72 flex flex-col gap-3">
      {/* Logo */}
      <div className="bg-white rounded-[14px] px-4 py-6 flex items-center justify-center">
        <img 
          src="/images/logo/logo-admin.svg" 
          alt="BAUSING Logo" 
          className="h-5 w-auto"
        />
      </div>

      {/* Tarjeta del menú de navegación con datos de usuario */}
      <div className="bg-white rounded-[14px] px-5 py-6 text-[14.5px] flex flex-col max-h-[calc(100vh-127px)]">
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
            className="text-gray-400 cursor-pointer hover:text-red-500 ml-2 flex-shrink-0 p-1 rounded-lg hover:bg-red-50 transition-colors duration-200 ease-out"
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
                  Ventas
                </NavLink>
              </li>
              <li key="clientes">
                <NavLink
                  href="/admin/clientes"
                  icon={<Users className="w-5 h-5" />}
                >
                  Clientes
                </NavLink>
              </li>
              <li key="metricas">
                <NavLink
                  href="/admin/metricas"
                  icon={<BarChart3 className="w-5 h-5" />}
                >
                  Métricas
                </NavLink>
              </li>
              <li key="billetera">
                <NavLink
                  href="/admin/billetera"
                  icon={<CreditCard className="w-5 h-5" />}
                >
                  Billetera Bausing
                </NavLink>
              </li>
              <li key="productos">
                <NavLink
                  href="/admin/productos"
                  icon={<Package className="w-5 h-5" />}
                >
                  Productos
                </NavLink>
              </li>
              <li key="distribucion-inicio">
                <NavLink
                  href="/admin/distribucion-inicio"
                  icon={<Package className="w-5 h-5" />}
                >
                  Distribución Inicio
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
              <li key="blog">
                <NavLink
                  href="/admin/blog"
                  icon={<FileText className="w-5 h-5" />}
                >
                  Blog
                </NavLink>
              </li>
              <li key="promos">
                <NavLink
                  href="/admin/promos"
                  icon={<Tag className="w-5 h-5" />}
                >
                  Promos
                </NavLink>
              </li>
              <li key="eventos">
                <NavLink
                  href="/admin/eventos"
                  icon={<Calendar className="w-5 h-5" />}
                >
                  Eventos
                </NavLink>
              </li>
              <li key="mensajes">
                <NavLink
                  href="/admin/mensajes"
                  icon={<Mail className="w-5 h-5" />}
                >
                  Mensajes
                </NavLink>
              </li>
              <li key="resenas">
                <NavLink
                  href="/admin/resenas"
                  icon={<Star className="w-5 h-5" />}
                >
                  Reseñas
                </NavLink>
              </li>
              <li key="logistica">
                <NavLink
                  href="/admin/logistica"
                  icon={<Truck className="w-5 h-5" />}
                >
                  Logística
                </NavLink>
              </li>
              {/* <li key="reportes">
                <NavLink
                  href="/admin/reportes"
                  icon={<BarChart3 className="w-5 h-5" />}
                >
                  Reportes (X)
                </NavLink>
              </li> */}
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

