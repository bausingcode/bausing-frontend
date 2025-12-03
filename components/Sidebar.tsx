"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import NavLink from "./NavLink";
import { LogOut, Home, ShoppingCart, Users, CreditCard, Package, Truck, BarChart3, UserCog, Settings, Tag, User } from "lucide-react";
import { getCurrentAdminUser, AdminUser } from "@/lib/api";

export default function Sidebar() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

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

  const handleLogout = () => {
    // Eliminar cookie
    document.cookie = "admin_token=; path=/; max-age=0";
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <aside className="w-72 flex flex-col gap-3">
      {/* Logo */}
      <div className="bg-white rounded-[14px] px-4 py-6 flex items-center justify-center">
        <div className="text-2xl font-bold" style={{ color: '#155DFC' }}>
          Bausing
        </div>
      </div>

      {/* Tarjeta del menú de navegación con datos de usuario */}
      <div className="bg-white rounded-[14px] px-5 py-6 text-[14.5px] flex-1 flex flex-col">
        {/* Datos del usuario */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
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

        {/* Menú de navegación */}
        <nav className="flex-1">
          <ul className="space-y-2.5">
            <li key="inicio">
              <NavLink
                href="/admin"
                icon={<Home className="w-5 h-5" />}
              >
                Inicio (DEV)
              </NavLink>
            </li>
            <li key="ventas">
              <NavLink
                href="/admin/ventas"
                icon={<ShoppingCart className="w-5 h-5" />}
              >
                Ventas (DEV)
              </NavLink>
            </li>
            <li key="clientes">
              <NavLink
                href="/admin/clientes"
                icon={<Users className="w-5 h-5" />}
              >
                Clientes (DEV)
              </NavLink>
            </li>
            <li key="billetera">
              <NavLink
                href="/admin/billetera"
                icon={<CreditCard className="w-5 h-5" />}
              >
                Billetera Bausing (DEV)
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
                Logística (DEV)
              </NavLink>
            </li>
            <li key="reportes">
              <NavLink
                href="/admin/reportes"
                icon={<BarChart3 className="w-5 h-5" />}
              >
                Reportes (DEV)
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
      </div>
    </aside>
  );
}

