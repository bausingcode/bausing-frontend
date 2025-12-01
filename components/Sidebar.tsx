"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import NavLink from "./NavLink";
import { LogOut, Home, ShoppingCart, Users, CreditCard, Package, Truck, BarChart3, UserCog, Settings, Tag } from "lucide-react";

export default function Sidebar() {
  const router = useRouter();

  const handleLogout = () => {
    // Eliminar cookie
    document.cookie = "admin_token=; path=/; max-age=0";
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <aside className="w-72 flex flex-col gap-4">
      {/* Tarjeta de usuario */}
      <div className="bg-white rounded-[14px] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Image
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                alt="Jorge Lopez"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-normal text-sm text-gray-900 truncate">
                Alejo Vaquero
              </p>
              <p className="text-xs text-gray-500 truncate">
                alejo@gmail.com
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="text-gray-400 cursor-pointer hover:text-gray-600 ml-2 flex-shrink-0"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tarjeta del menú de navegación */}
      <div className="bg-white rounded-[14px] p-4 text-[14.5px] flex-1">
        <nav>
          <ul className="space-y-3 pt-4">
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
            <li key="promos">
              <NavLink
                href="/admin/promos"
                icon={<Tag className="w-5 h-5" />}
              >
                Promos
              </NavLink>
            </li>
            <li key="envios">
              <NavLink
                href="/admin/envios"
                icon={<Truck className="w-5 h-5" />}
              >
                Envíos & Logística
              </NavLink>
            </li>
            <li key="reportes">
              <NavLink
                href="/admin/reportes"
                icon={<BarChart3 className="w-5 h-5" />}
              >
                Reportes
              </NavLink>
            </li>
            <li key="usuarios">
              <NavLink
                href="/admin/usuarios"
                icon={<UserCog className="w-5 h-5" />}
              >
                Usuarios & Permisos
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
      </div>
    </aside>
  );
}

