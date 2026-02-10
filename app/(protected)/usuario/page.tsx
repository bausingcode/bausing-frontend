"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loader from "@/components/Loader";
import { useAuth } from "@/contexts/AuthContext";
import {
  updateUserProfile,
  changePassword,
  getUserAddresses,
  createUserAddress,
  updateUserAddress,
  deleteUserAddress,
  getUserWalletBalance,
  getUserWalletMovements,
  transferWalletBalance,
  getUserOrders,
  getUserOrder,
  getProvinces,
  type Address,
  type WalletMovement,
  type Order,
  type Province,
} from "@/lib/api";
import {
  Calendar,
  FileText,
  LogOut,
  MapPin,
  LucideIcon,
  Package,
  Phone,
  Shield,
  User,
  Mail,
  CheckCircle,
  XCircle,
  RefreshCw,
  CreditCard,
  X,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Truck,
  HelpCircle,
  ExternalLink,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

type MenuKey = "perfil" | "direcciones" | "pedidos" | "seguridad" | "billetera" | "logout";

const menuItems: { key: MenuKey; label: string; icon: LucideIcon }[] = [
  { key: "perfil", label: "Perfil", icon: User },
  { key: "direcciones", label: "Direcciones", icon: MapPin },
  { key: "billetera", label: "Billetera", icon: CreditCard },
  { key: "pedidos", label: "Pedidos", icon: Package },
  { key: "seguridad", label: "Seguridad", icon: Shield },
  { key: "logout", label: "Cerrar sesión", icon: LogOut },
];

const genderOptions = [
  { value: "", label: "Selecciona una opción" },
  { value: "femenino", label: "Femenino" },
  { value: "masculino", label: "Masculino" },
  { value: "otro", label: "Otro / Prefiero no decirlo" },
];

// Función helper para normalizar el estado de la orden
// 'pending' se trata igual que 'pendiente de entrega'
const normalizeOrderStatus = (status: string): string => {
  if (status === "pending" || status === "pendiente de entrega") {
    return "pendiente de entrega";
  }
  return status;
};

// Función helper para formatear el método de pago (soporta múltiples métodos separados por coma)
const formatPaymentMethod = (paymentMethod: string | undefined | null): string => {
  if (!paymentMethod) return "N/A";
  
  const methodLabels: Record<string, string> = {
    card: "Tarjeta",
    cash: "Efectivo",
    transfer: "Transferencia",
    wallet: "Billetera Bausing",
  };
  
  // Si contiene coma, es múltiple
  if (paymentMethod.includes(",")) {
    const methods = paymentMethod.split(",").map(m => m.trim());
    return methods.map(m => methodLabels[m] || m).join(" + ");
  }
  
  // Método único
  return methodLabels[paymentMethod] || paymentMethod;
};

export default function UsuarioPage() {
  const { user, loading, isAuthenticated, logout, updateUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<MenuKey>("perfil");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    dni: "",
    gender: "",
    birth_date: "",
    phone: "",
  });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressStatus, setAddressStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressForm, setAddressForm] = useState({
    street: "",
    number: "",
    postal_code: "",
    additional_info: "",
    full_name: "",
    phone: "",
    city: "",
    province_id: "",
    is_default: false,
  });
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({
    email: "",
    amount: "",
  });
  const [transferSaving, setTransferSaving] = useState(false);
  const [transferStatus, setTransferStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletMovements, setWalletMovements] = useState<WalletMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [ordersPagination, setOrdersPagination] = useState({
    page: 1,
    per_page: 5,
    total: 0,
    pages: 0,
  });

  // Cargar datos de wallet cuando se activa la sección
  useEffect(() => {
    if (activeSection === "billetera" && isAuthenticated) {
      loadWalletData();
    }
  }, [activeSection, isAuthenticated]);

  // Cargar pedidos cuando se activa la sección
  useEffect(() => {
    if (activeSection === "pedidos" && isAuthenticated && !ordersLoading) {
      loadOrders(1);
    }
  }, [activeSection, isAuthenticated]);

  // Cargar provincias al montar
  useEffect(() => {
    const loadProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const data = await getProvinces();
        setProvinces(data);
      } catch (error) {
        console.error("Error loading provinces:", error);
      } finally {
        setLoadingProvinces(false);
      }
    };

    loadProvinces();
  }, []);

  const loadOrders = async (page: number = 1) => {
    setOrdersLoading(true);
    try {
      const ordersData = await getUserOrders({ page, per_page: ordersPagination.per_page });
      setOrders(ordersData.orders);
      if (ordersData.pagination) {
        setOrdersPagination(ordersData.pagination);
      }
    } catch (error: any) {
      console.error("Error loading orders:", error);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadOrder = async (orderId: string) => {
    setOrderLoading(true);
    try {
      // Primero buscar en la lista cargada
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
      } else {
        // Si no está en la lista, cargar desde la API
        const orderData = await getUserOrder(orderId);
        if (orderData) {
          setSelectedOrder(orderData);
        } else {
          console.error("Order not found");
        }
      }
    } catch (error: any) {
      console.error("Error loading order:", error);
    } finally {
      setOrderLoading(false);
    }
  };

  const loadWalletData = async () => {
    setWalletLoading(true);
    try {
      const balanceData = await getUserWalletBalance();
      setWalletBalance(balanceData.balance);
      
      const movementsData = await getUserWalletMovements({ page: 1, per_page: 50 });
      setWalletMovements(movementsData.movements);
    } catch (error: any) {
      console.error("Error loading wallet data:", error);
    } finally {
      setWalletLoading(false);
    }
  };

  const loadMovements = async () => {
    setMovementsLoading(true);
    try {
      const movementsData = await getUserWalletMovements({ page: 1, per_page: 50 });
      setWalletMovements(movementsData.movements);
    } catch (error: any) {
      console.error("Error loading movements:", error);
    } finally {
      setMovementsLoading(false);
    }
  };

  // Datos de ejemplo de transacciones (transferencias y compras) - DEPRECATED, usar walletMovements
  const exampleTransactions = [
    {
      id: "1",
      type: "sent" as const,
      email: "juan.perez@example.com",
      amount: 5000,
      date: new Date("2025-01-15T14:30:00"),
    },
    {
      id: "2",
      type: "purchase" as const,
      productName: "Colchón Premium 160x200",
      amount: 45000,
      date: new Date("2025-01-14T11:20:00"),
    },
    {
      id: "3",
      type: "received" as const,
      email: "maria.garcia@example.com",
      amount: 3000,
      date: new Date("2025-01-12T10:15:00"),
    },
    {
      id: "4",
      type: "purchase" as const,
      productName: "Almohadas Memory Foam x2",
      amount: 8500,
      date: new Date("2025-01-11T16:00:00"),
    },
    {
      id: "5",
      type: "sent" as const,
      email: "carlos.rodriguez@example.com",
      amount: 2500,
      date: new Date("2025-01-10T16:45:00"),
    },
    {
      id: "6",
      type: "received" as const,
      email: "ana.martinez@example.com",
      amount: 7500,
      date: new Date("2025-01-08T09:20:00"),
    },
    {
      id: "7",
      type: "purchase" as const,
      productName: "Sommier Box Spring 140x190",
      amount: 32000,
      date: new Date("2025-01-06T14:30:00"),
    },
    {
      id: "8",
      type: "sent" as const,
      email: "luis.fernandez@example.com",
      amount: 1200,
      date: new Date("2025-01-05T11:30:00"),
    },
  ];

  // Leer query params para establecer la sección activa
  useEffect(() => {
    const section = searchParams.get("section");
    if (section && ["perfil", "direcciones", "billetera", "pedidos", "seguridad"].includes(section)) {
      setActiveSection(section as MenuKey);
    }
  }, [searchParams]);

  // Pre-cargar los datos del usuario cuando están disponibles
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        dni: user.dni || "",
        gender: user.gender || "",
        birth_date: user.birth_date ? user.birth_date.slice(0, 10) : "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  // Cargar direcciones cuando se activa la sección
  useEffect(() => {
    if (activeSection === "direcciones" && isAuthenticated && !loadingAddresses) {
      loadAddresses();
    }
  }, [activeSection, isAuthenticated]);

  const loadAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const data = await getUserAddresses();
      setAddresses(data);
    } catch (error: any) {
      setAddressStatus({
        type: "error",
        message: error?.message || "Error al cargar direcciones",
      });
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setSaving(true);

    try {
      const updatedUser = await updateUserProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        dni: formData.dni,
        gender: formData.gender,
        birth_date: formData.birth_date || undefined,
        phone: formData.phone,
      });
      
      // Actualizar el contexto con los datos actualizados
      updateUser(updatedUser);
      setStatus({ type: "success", message: "Perfil actualizado correctamente." });
    } catch (error: any) {
      setStatus({
        type: "error",
        message: error?.message || "No pudimos actualizar tu perfil. Inténtalo nuevamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  const currentTitle = useMemo(() => {
    const current = menuItems.find((item) => item.key === activeSection);
    return current?.label || "Perfil";
  }, [activeSection]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
        <div className={`grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 md:gap-6 ${activeSection === "billetera" ? "items-stretch" : "items-start"}`}>
          {/* Sidebar */}
          <aside className="bg-white border border-gray-200 rounded-[14px] shadow-sm p-4">
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100">
              <div className="min-w-0">
                <p className="text-sm text-gray-500">Mi cuenta</p>
                <p
                  className="text-base font-semibold text-gray-900 leading-tight truncate"
                  title={`${user?.first_name ?? ""} ${user?.last_name ?? ""}`}
                >
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate" title={user?.email}>
                  {user?.email}
                </p>
              </div>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.key;
                const isDisabled = !["perfil", "direcciones", "seguridad", "billetera", "pedidos", "logout"].includes(item.key);

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      if (item.key === "logout") {
                        logout();
                      } else if (!isDisabled) {
                        setActiveSection(item.key);
                        setStatus(null);
                        setAddressStatus(null);
                        setPasswordStatus(null);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm transition-colors ${
                      isActive
                        ? "bg-[#00C1A7]/10 text-[#00C1A7] font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    } ${item.key === "logout" ? "hover:text-red-600 hover:bg-red-50" : ""} ${
                      isDisabled ? "cursor-not-allowed opacity-60" : ""
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {isDisabled && <span className="ml-auto text-xs text-gray-400">Próximamente</span>}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Content */}
          <section className={`space-y-4 min-w-0 ${activeSection === "billetera" ? "h-full" : ""}`}>
            <div className={`bg-white border border-gray-200 rounded-[14px] shadow-sm p-4 md:p-6 ${activeSection === "billetera" ? "h-full" : ""}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 md:mb-6">
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Sección</p>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">{currentTitle}</h1>
                </div>
                <div className="bg-[#00C1A7]/10 text-[#00C1A7] px-3 py-1.5 rounded-full text-sm font-semibold w-fit">
                  {currentTitle}
                </div>
              </div>

              {activeSection === "perfil" && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Nombre</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={formData.first_name}
                          onChange={(e) => handleChange("first_name", e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-[10px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-transparent"
                          placeholder="Tu nombre"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Apellido</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={formData.last_name}
                          onChange={(e) => handleChange("last_name", e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-[10px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-transparent"
                          placeholder="Tu apellido"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">DNI</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FileText className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={formData.dni}
                          onChange={(e) => handleChange("dni", e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-[10px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-transparent"
                          placeholder="Documento"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Género</label>
                      <div className="relative">
                        <select
                          value={formData.gender}
                          onChange={(e) => handleChange("gender", e.target.value)}
                          className="block w-full pl-3 pr-3 py-3 border border-gray-300 rounded-[10px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-transparent bg-white"
                        >
                          {genderOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Fecha de nacimiento</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="date"
                          value={formData.birth_date}
                          onChange={(e) => handleChange("birth_date", e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-[10px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Teléfono</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleChange("phone", e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-[10px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-transparent"
                          placeholder="+54 9 11 1234-5678"
                        />
                      </div>
                    </div>
                  </div>

                  {status && (
                    <div
                      className={`px-4 py-3 rounded-lg border text-sm ${
                        status.type === "success"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-red-50 border-red-200 text-red-700"
                      }`}
                    >
                      {status.message}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({
                        first_name: user?.first_name || "",
                        last_name: user?.last_name || "",
                        dni: user?.dni || "",
                        gender: user?.gender || "",
                        birth_date: user?.birth_date ? user.birth_date.slice(0, 10) : "",
                        phone: user?.phone || "",
                      })}
                      className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
                      disabled={saving}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 bg-[#00C1A7] text-white py-3 px-5 rounded-[8px] font-semibold hover:bg-[#00a892] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {saving ? "Guardando..." : "Guardar cambios"}
                    </button>
                  </div>
                </form>
              )}

              {activeSection === "direcciones" && (
                <div className="space-y-6">
                  {addressStatus && (
                    <div
                      className={`px-4 py-3 rounded-lg border text-sm ${
                        addressStatus.type === "success"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-red-50 border-red-200 text-red-700"
                      }`}
                    >
                      {addressStatus.message}
                    </div>
                  )}

                  {/* Empty state */}
                  {!loadingAddresses && !addresses.length && !showAddressForm && (
                    <div className="border border-dashed border-gray-300 rounded-[12px] p-6 text-center space-y-3 bg-gray-50">
                      <div className="mx-auto w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[#00C1A7]">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-gray-900">Aún no tienes direcciones guardadas</p>
                        <p className="text-sm text-gray-600">
                          Agrega tu primera dirección para agilizar tus compras y envíos.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddressForm(true);
                          setEditingAddressId(null);
                          setAddressStatus(null);
                        }}
                        className="inline-flex items-center justify-center gap-2 bg-[#00C1A7] text-white px-4 py-2.5 rounded-[10px] font-semibold hover:bg-[#00a892] transition-colors"
                      >
                        Agregar dirección
                      </button>
                    </div>
                  )}

                  {/* Address form */}
                  {showAddressForm && (
                    <form
                      className="space-y-5 border border-gray-200 rounded-[12px] p-5 bg-gray-50"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setAddressStatus(null);
                        setAddressSaving(true);
                        try {
                          if (!addressForm.street || !addressForm.number || !addressForm.postal_code || !addressForm.city || !addressForm.province_id) {
                            throw new Error("Calle, número, código postal, ciudad y provincia son obligatorios.");
                          }
                          if (!addressForm.full_name || !addressForm.phone) {
                            throw new Error("Nombre completo y teléfono del destinatario son obligatorios.");
                          }

                          if (editingAddressId) {
                            await updateUserAddress(editingAddressId, {
                              street: addressForm.street.trim(),
                              number: addressForm.number.trim(),
                              postal_code: addressForm.postal_code.trim(),
                              additional_info: addressForm.additional_info.trim() || undefined,
                              full_name: addressForm.full_name.trim(),
                              phone: addressForm.phone.trim(),
                              city: addressForm.city.trim(),
                              province_id: addressForm.province_id,
                              is_default: addressForm.is_default,
                            });
                            await loadAddresses();
                            setAddressStatus({
                              type: "success",
                              message: "Dirección actualizada.",
                            });
                          } else {
                            await createUserAddress({
                              street: addressForm.street.trim(),
                              number: addressForm.number.trim(),
                              postal_code: addressForm.postal_code.trim(),
                              additional_info: addressForm.additional_info.trim() || undefined,
                              full_name: addressForm.full_name.trim(),
                              phone: addressForm.phone.trim(),
                              city: addressForm.city.trim(),
                              province_id: addressForm.province_id,
                              is_default: addressForm.is_default,
                            });
                            await loadAddresses();
                            setAddressStatus({
                              type: "success",
                              message: "Dirección guardada.",
                            });
                          }

                          setAddressForm({
                            street: "",
                            number: "",
                            postal_code: "",
                            additional_info: "",
                            full_name: "",
                            phone: "",
                            city: "",
                            province_id: "",
                            is_default: false,
                          });
                          setShowAddressForm(false);
                          setEditingAddressId(null);
                        } catch (error: any) {
                          setAddressStatus({
                            type: "error",
                            message: error?.message || "No pudimos guardar la dirección.",
                          });
                        } finally {
                          setAddressSaving(false);
                        }
                      }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Calle *</label>
                          <input
                            type="text"
                            value={addressForm.street}
                            onChange={(e) => setAddressForm((prev) => ({ ...prev, street: e.target.value }))}
                            className="block w-full px-3 py-3 border border-gray-300 rounded-[10px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-transparent"
                            placeholder="Ej: Av. Siempre Viva"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Número *</label>
                          <input
                            type="text"
                            value={addressForm.number}
                            onChange={(e) => setAddressForm((prev) => ({ ...prev, number: e.target.value }))}
                            className="block w-full px-3 py-3 border border-gray-300 rounded-[10px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-transparent"
                            placeholder="Ej: 742"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Código postal *</label>
                          <input
                            type="text"
                            value={addressForm.postal_code}
                            onChange={(e) => setAddressForm((prev) => ({ ...prev, postal_code: e.target.value }))}
                            className="block w-full px-3 py-3 border border-gray-300 rounded-[10px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-transparent"
                            placeholder="Ej: 1405"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Ciudad *</label>
                          <input
                            type="text"
                            value={addressForm.city}
                            onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                            className="block w-full px-3 py-3 border border-gray-300 rounded-[10px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-transparent"
                            placeholder="Ej: Buenos Aires"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Provincia *</label>
                          <select
                            value={addressForm.province_id || ""}
                            onChange={(e) => setAddressForm((prev) => ({ ...prev, province_id: e.target.value }))}
                            className="block w-full px-3 py-3 border border-gray-300 rounded-[10px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-transparent"
                            required
                            disabled={loadingProvinces}
                          >
                            <option value="">Seleccione una provincia</option>
                            {provinces.map((province) => (
                              <option key={province.id} value={province.id}>
                                {province.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Información adicional</label>
                          <input
                            type="text"
                            value={addressForm.additional_info}
                            onChange={(e) => setAddressForm((prev) => ({ ...prev, additional_info: e.target.value }))}
                            className="block w-full px-3 py-3 border border-gray-300 rounded-[10px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-transparent"
                            placeholder="Depto, piso, entrecalles"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-3">
                          <p className="text-sm font-semibold text-gray-900">Información del destinatario</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Nombre completo *</label>
                              <input
                                type="text"
                                value={addressForm.full_name}
                                onChange={(e) =>
                                  setAddressForm((prev) => ({ ...prev, full_name: e.target.value }))
                                }
                                className="block w-full px-3 py-3 border border-gray-300 rounded-[10px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-transparent"
                                placeholder="Ej: Juan Pérez"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Teléfono *</label>
                              <input
                                type="tel"
                                value={addressForm.phone}
                                onChange={(e) =>
                                  setAddressForm((prev) => ({ ...prev, phone: e.target.value }))
                                }
                                className="block w-full px-3 py-3 border border-gray-300 rounded-[10px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-transparent"
                                placeholder="+54 9 11 1234-5678"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        <div className="md:col-span-2 flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="is_default"
                            checked={addressForm.is_default}
                            onChange={(e) => setAddressForm((prev) => ({ ...prev, is_default: e.target.checked }))}
                            className="w-4 h-4 text-[#00C1A7] border-gray-300 rounded focus:ring-[#00C1A7]"
                          />
                          <label htmlFor="is_default" className="text-sm font-medium text-gray-700">
                            Marcar como dirección por defecto
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddressForm(false);
                            setAddressForm({
                              street: "",
                              number: "",
                              postal_code: "",
                              additional_info: "",
                              full_name: "",
                              phone: "",
                              city: "",
                              province_id: "",
                              is_default: false,
                            });
                            setEditingAddressId(null);
                          }}
                          className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
                          disabled={addressSaving}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={addressSaving}
                          className="inline-flex items-center gap-2 bg-[#00C1A7] text-white py-3 px-5 rounded-[8px] font-semibold hover:bg-[#00a892] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {addressSaving ? "Guardando..." : "Guardar dirección"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* List of addresses */}
                  {loadingAddresses ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Cargando direcciones...</p>
                    </div>
                  ) : addresses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className="border border-gray-200 rounded-[12px] p-4 space-y-2 bg-white"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-900 font-semibold">
                              <MapPin className="w-4 h-4 text-[#00C1A7]" />
                              Dirección guardada
                            </div>
                            {address.is_default && (
                              <span className="text-xs bg-[#00C1A7]/10 text-[#00C1A7] px-2 py-1 rounded-full font-semibold">
                                Por defecto
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-800">
                            {address.street} {address.number}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address.city}, {address.province} - CP {address.postal_code}
                          </p>
                          {address.additional_info && (
                            <p className="text-sm text-gray-600">Info adicional: {address.additional_info}</p>
                          )}
                          <p className="text-sm text-gray-600">
                            Destinatario: {address.full_name} · {address.phone}
                          </p>
                          <div className="flex gap-3 pt-2">
                            <button
                              type="button"
                              className="text-sm font-semibold text-[#00C1A7] hover:text-[#008f87]"
                              onClick={() => {
                                setEditingAddressId(address.id);
                                setAddressForm({
                                  street: address.street,
                                  number: address.number,
                                  postal_code: address.postal_code,
                                  additional_info: address.additional_info || "",
                                  full_name: address.full_name,
                                  phone: address.phone,
                                  city: address.city,
                                  province_id: address.province_id || "",
                                  is_default: address.is_default,
                                });
                                setShowAddressForm(true);
                                setAddressStatus(null);
                              }}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="text-sm font-semibold text-red-600 hover:text-red-700"
                              onClick={async () => {
                                try {
                                  await deleteUserAddress(address.id);
                                  await loadAddresses();
                                  setAddressStatus({ type: "success", message: "Dirección eliminada." });
                                  if (editingAddressId === address.id) {
                                    setShowAddressForm(false);
                                    setEditingAddressId(null);
                                  }
                                } catch (error: any) {
                                  setAddressStatus({
                                    type: "error",
                                    message: error?.message || "Error al eliminar dirección",
                                  });
                                }
                              }}
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* CTA to add more when there are addresses */}
                  {addresses.length > 0 && !showAddressForm && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddressForm(true);
                          setEditingAddressId(null);
                          setAddressStatus(null);
                        }}
                        className="inline-flex items-center justify-center gap-2 bg-[#00C1A7] text-white px-4 py-2.5 rounded-[10px] font-semibold hover:bg-[#00a892] transition-colors"
                      >
                        Agregar otra dirección
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeSection === "billetera" && (
                <div className="space-y-6 h-full flex flex-col">
                  {/* Saldo actual */}
                  <div className="border border-gray-200 rounded-[14px] p-6 bg-gradient-to-br from-[#00C1A7]/5 to-[#00C1A7]/10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Saldo disponible</p>
                        {walletLoading ? (
                          <p className="text-3xl font-bold text-gray-900">Cargando...</p>
                        ) : (
                          <p className="text-3xl font-bold text-gray-900">
                            ${walletBalance.toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        )}
                      </div>
                      <div className="p-3 bg-white rounded-full border border-gray-200">
                        <CreditCard className="w-6 h-6 text-[#00C1A7]" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Usa tu billetera Bausing para pagar tus compras de forma rápida y segura.
                    </p>
                  </div>

                  {/* Acciones rápidas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowTransferModal(true);
                        setTransferStatus(null);
                        setTransferForm({ email: "", amount: "" });
                      }}
                      className="border border-gray-200 rounded-[12px] p-4 hover:border-[#00C1A7] hover:bg-[#00C1A7]/5 transition-colors text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#00C1A7]/10 rounded-lg">
                          <CreditCard className="w-5 h-5 text-[#00C1A7]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Transferir saldo</p>
                          <p className="text-xs text-gray-500">Transfiere dinero a otra cuenta</p>
                        </div>
                      </div>
                    </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowHistoryModal(true);
                      loadMovements();
                    }}
                    className="border border-gray-200 rounded-[12px] p-4 hover:border-[#00C1A7] hover:bg-[#00C1A7]/5 transition-colors text-left cursor-pointer"
                  >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#00C1A7]/10 rounded-lg">
                          <FileText className="w-5 h-5 text-[#00C1A7]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Ver historial</p>
                          <p className="text-xs text-gray-500">Consulta tus movimientos</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {activeSection === "seguridad" && (
                <div className="space-y-6 md:space-y-8">
                  {/* Sección de Email y Verificación */}
                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Email y Verificación</h2>
                      
                      {/* Email del usuario */}
                      <div className="border border-gray-200 rounded-[10px] md:rounded-[12px] p-3 md:p-4 bg-gray-50">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-white rounded-lg border border-gray-200 shrink-0">
                              <Mail className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs md:text-sm text-gray-500">Email</p>
                              <p className="text-sm md:text-base font-semibold text-gray-900 truncate" title={user?.email}>{user?.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {user?.email_verified ? (
                              <>
                                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-emerald-600 shrink-0" />
                                <span className="text-xs md:text-sm font-semibold text-emerald-600">Verificado</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600 shrink-0" />
                                <span className="text-xs md:text-sm font-semibold text-red-600">No verificado</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Mensaje de estado de reenvío */}
                      {resendMessage && (
                        <div
                          className={`px-3 md:px-4 py-2.5 md:py-3 rounded-lg border text-xs md:text-sm ${
                            resendMessage.type === "success"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-red-50 border-red-200 text-red-700"
                          }`}
                        >
                          {resendMessage.message}
                        </div>
                      )}

                      {/* Botón para reenviar email si no está verificado */}
                      {!user?.email_verified && (
                        <div className="border border-amber-200 rounded-[10px] md:rounded-[12px] p-3 md:p-4 mt-3 md:mt-4 bg-amber-50">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                              <Mail className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs md:text-sm font-semibold text-amber-900 mb-1">
                                Tu email no está verificado
                              </p>
                              <p className="text-xs md:text-sm text-amber-700 mb-3">
                                Por favor, verifica tu email para acceder a todas las funcionalidades de tu cuenta.
                              </p>
                              <button
                                type="button"
                                onClick={async () => {
                                  setResendMessage(null);
                                  setResendLoading(true);
                                  try {
                                    const token = localStorage.getItem("user_token");
                                    if (!token) {
                                      throw new Error("Debes iniciar sesión para reenviar el email");
                                    }

                                    const response = await fetch(`/api/auth/resend-verification`, {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${token}`,
                                      },
                                    });

                                    const data = await response.json();

                                    if (!response.ok || !data.success) {
                                      throw new Error(data.error || "Error al reenviar el email");
                                    }

                                    setResendMessage({
                                      type: "success",
                                      message: "Email de verificación reenviado. Revisa tu bandeja de entrada.",
                                    });
                                  } catch (error: any) {
                                    setResendMessage({
                                      type: "error",
                                      message: error?.message || "Error al reenviar el email de verificación",
                                    });
                                  } finally {
                                    setResendLoading(false);
                                  }
                                }}
                                disabled={resendLoading}
                                className="w-full sm:w-auto inline-flex items-center justify-center cursor-pointer gap-2 bg-amber-600 text-white px-4 py-2.5 rounded-[8px] text-xs md:text-sm font-semibold hover:bg-amber-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                <RefreshCw className={`w-4 h-4 shrink-0 ${resendLoading ? "animate-spin" : ""}`} />
                                {resendLoading ? "Enviando..." : "Reenviar email de verificación"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sección de Cambio de Contraseña */}
                  <div className="border-t border-gray-200 pt-4 md:pt-6">
                    <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Cambiar Contraseña</h2>
                    <form
                      className="space-y-4 md:space-y-6"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setPasswordStatus(null);
                        if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) {
                          setPasswordStatus({
                            type: "error",
                            message: "La nueva contraseña debe tener al menos 8 caracteres.",
                          });
                          return;
                        }
                        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                          setPasswordStatus({
                            type: "error",
                            message: "Las contraseñas no coinciden.",
                          });
                          return;
                        }
                        setPasswordSaving(true);
                        try {
                          await changePassword({
                            current_password: passwordForm.currentPassword,
                            new_password: passwordForm.newPassword,
                          });
                          setPasswordStatus({ type: "success", message: "Contraseña actualizada." });
                          setPasswordForm({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: "",
                          });
                        } catch (error: any) {
                          setPasswordStatus({
                            type: "error",
                            message: error?.message || "No pudimos actualizar tu contraseña.",
                          });
                        } finally {
                          setPasswordSaving(false);
                        }
                      }}
                    >
                      {passwordStatus && (
                        <div
                          className={`px-3 md:px-4 py-2.5 md:py-3 rounded-lg border text-xs md:text-sm ${
                            passwordStatus.type === "success"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-red-50 border-red-200 text-red-700"
                          }`}
                        >
                          {passwordStatus.message}
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-xs md:text-sm font-medium text-gray-700">Contraseña actual</label>
                        <input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                          }
                          className="block w-full px-3 py-2.5 md:py-3 border border-gray-300 rounded-[10px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-transparent text-sm md:text-base"
                          placeholder="••••••••"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs md:text-sm font-medium text-gray-700">Nueva contraseña</label>
                        <input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                          }
                          className="block w-full px-3 py-2.5 md:py-3 border border-gray-300 rounded-[10px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-transparent text-sm md:text-base"
                          placeholder="Mínimo 8 caracteres"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs md:text-sm font-medium text-gray-700">Confirmar nueva contraseña</label>
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                          }
                          className="block w-full px-3 py-2.5 md:py-3 border border-gray-300 rounded-[10px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-transparent text-sm md:text-base"
                          placeholder="Repite la nueva contraseña"
                          required
                        />
                      </div>

                      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setPasswordForm({
                              currentPassword: "",
                              newPassword: "",
                              confirmPassword: "",
                            });
                            setPasswordStatus(null);
                          }}
                          className="w-full sm:w-auto px-4 py-2.5 md:py-2 text-xs md:text-sm font-semibold text-gray-700 hover:text-gray-900"
                          disabled={passwordSaving}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={passwordSaving}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#00C1A7] text-white py-2.5 md:py-3 px-4 md:px-5 rounded-[8px] font-semibold hover:bg-[#00a892] transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm md:text-base"
                        >
                          {passwordSaving ? "Guardando..." : "Actualizar contraseña"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {activeSection === "pedidos" && (
                <div className="space-y-6">
                  {selectedOrder ? (
                    // Vista de detalle de pedido
                    <div className="space-y-4 md:space-y-6">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrder(null);
                        }}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 mb-2 md:mb-4"
                      >
                        <ArrowLeft className="w-4 h-4 shrink-0" />
                        Volver a mis pedidos
                      </button>

                      {orderLoading ? (
                        <div className="text-center py-8 md:py-12">
                          <p className="text-gray-500 text-sm md:text-base">Cargando pedido...</p>
                        </div>
                      ) : (
                        <>
                          {/* Información del producto */}
                          <div className="border border-gray-200 rounded-[12px] md:rounded-[14px] p-4 md:p-6">
                            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Productos</h2>
                            <div className="space-y-3 md:space-y-4">
                              {selectedOrder.items.map((item) => (
                                <div key={item.id} className="flex flex-col sm:flex-row gap-3 md:gap-4 pb-3 md:pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                  {item.product_image && (
                                    <img
                                      src={item.product_image}
                                      alt={item.product_name}
                                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg shrink-0"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 text-sm md:text-base">{item.product_name}</h3>
                                    {item.variant_name && (
                                      <p className="text-xs md:text-sm text-gray-600">Variante: {item.variant_name}</p>
                                    )}
                                    <p className="text-xs md:text-sm text-gray-600">Cantidad: {item.quantity}</p>
                                    <p className="text-xs md:text-sm font-semibold text-gray-900 mt-1">
                                      ${item.total_price.toLocaleString("es-AR", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Información de compra (Ticket) */}
                          <div className="border border-gray-200 rounded-[12px] md:rounded-[14px] p-4 md:p-6">
                            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Información de compra</h2>
                            <div className="space-y-2 md:space-y-3">
                              <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
                                <span className="text-xs md:text-sm text-gray-600">Número de pedido:</span>
                                <span className="text-xs md:text-sm font-semibold text-gray-900">{selectedOrder.order_number}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
                                <span className="text-xs md:text-sm text-gray-600">Fecha:</span>
                                <span className="text-xs md:text-sm text-gray-900">
                                  {new Date(selectedOrder.created_at).toLocaleDateString("es-AR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
                                <span className="text-xs md:text-sm text-gray-600">Método de pago:</span>
                                <span className="text-xs md:text-sm text-gray-900">
                                  {formatPaymentMethod(selectedOrder.payment_method)}
                                </span>
                              </div>
                              {selectedOrder.payment_processed !== undefined && (
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
                                  <span className="text-xs md:text-sm text-gray-600">Estado de pago:</span>
                                  <span className={`text-xs md:text-sm font-medium inline-flex items-center gap-1 ${
                                    selectedOrder.payment_processed ? "text-green-700" : "text-amber-700"
                                  }`}>
                                    {selectedOrder.payment_processed ? (
                                      <>
                                        <CheckCircle className="w-4 h-4 shrink-0" />
                                        Pagado
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="w-4 h-4 shrink-0" />
                                        Pendiente de pago
                                      </>
                                    )}
                                  </span>
                                </div>
                              )}
                              {selectedOrder.pay_on_delivery && (
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
                                  <span className="text-xs md:text-sm text-gray-600">Pago al recibir:</span>
                                  <span className="text-xs md:text-sm text-gray-900">Sí</span>
                                </div>
                              )}
                              <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2 pt-2 md:pt-3 border-t border-gray-200">
                                <span className="text-sm md:text-base font-semibold text-gray-900">Total:</span>
                                <span className="text-base md:text-lg font-bold text-gray-900">
                                  ${selectedOrder.total_amount.toLocaleString("es-AR", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Estado del pedido */}
                          <div className="border border-gray-200 rounded-[12px] md:rounded-[14px] p-4 md:p-6">
                            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Estado del pedido</h2>
                            <div className="space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full shrink-0 ${
                                    (() => {
                                      const normalizedStatus = normalizeOrderStatus(selectedOrder.status);
                                      return normalizedStatus === "finalizado" ? "bg-green-600" :
                                             normalizedStatus === "en reparto" ? "bg-blue-500" :
                                             normalizedStatus === "pendiente de entrega" ? "bg-amber-500" :
                                             "bg-gray-400";
                                    })()
                                  }`} />
                                  <span className="text-xs md:text-sm font-semibold text-gray-900">
                                    {(() => {
                                      const normalizedStatus = normalizeOrderStatus(selectedOrder.status);
                                      if (normalizedStatus === "pendiente de entrega") return "Pendiente de entrega";
                                      if (normalizedStatus === "en reparto") return "En reparto";
                                      if (normalizedStatus === "finalizado") return "Finalizado";
                                      return selectedOrder.status;
                                    })()}
                                  </span>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <button
                                    onClick={() => {
                                      router.push(`/tracking/${selectedOrder.id}`);
                                    }}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#00C1A7] text-white px-4 py-2.5 rounded-[8px] text-sm font-semibold hover:bg-[#00a892] transition-colors"
                                  >
                                    <Truck className="w-4 h-4 shrink-0" />
                                    Ver seguimiento
                                  </button>
                                  {normalizeOrderStatus(selectedOrder.status) === "finalizado" && (
                                    <button
                                      onClick={() => {
                                        router.push(`/reviews/${selectedOrder.id}`);
                                      }}
                                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-[8px] text-sm font-semibold hover:bg-emerald-600 transition-colors"
                                    >
                                      <FileText className="w-4 h-4 shrink-0" />
                                      Dejar reseña
                                    </button>
                                  )}
                                </div>
                              </div>
                              {selectedOrder.tracking_number && (
                                <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200">
                                  <p className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">Número de seguimiento:</p>
                                  <p className="text-xs md:text-sm font-semibold text-gray-900 break-all">{selectedOrder.tracking_number}</p>
                                </div>
                              )}
                              {selectedOrder.tracking_url && (
                                <div className="flex justify-end mt-3">
                                  <a
                                    href={selectedOrder.tracking_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-[8px] text-sm font-semibold hover:bg-gray-200 transition-colors"
                                  >
                                    <ExternalLink className="w-4 h-4 shrink-0" />
                                    Rastrear en transportista
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Dirección de entrega */}
                          <div className="border border-gray-200 rounded-[12px] md:rounded-[14px] p-4 md:p-6">
                            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Dirección de entrega</h2>
                            <div className="space-y-1 text-xs md:text-sm text-gray-700">
                              <p className="font-semibold">{selectedOrder.shipping_address.full_name}</p>
                              <p>{selectedOrder.shipping_address.street} {selectedOrder.shipping_address.number}</p>
                              {selectedOrder.shipping_address.additional_info && (
                                <p>{selectedOrder.shipping_address.additional_info}</p>
                              )}
                              <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.province}</p>
                              <p>CP {selectedOrder.shipping_address.postal_code}</p>
                              <p className="mt-2">{selectedOrder.shipping_address.phone}</p>
                            </div>
                          </div>

                          {/* Ayuda */}
                          <div className="border border-gray-200 rounded-[12px] md:rounded-[14px] p-4 md:p-6">
                            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
                              <HelpCircle className="w-5 h-5 text-[#00C1A7] shrink-0" />
                              Ayuda
                            </h2>
                            <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
                              ¿Necesitas ayuda con tu pedido? Contáctanos y te ayudaremos a resolver cualquier duda.
                            </p>
                            <a
                              href="https://wa.me/5491112345678"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 text-white px-5 py-2.5 md:px-6 md:py-3 rounded-[10px] text-sm font-semibold hover:bg-emerald-600 transition-colors"
                            >
                              <Phone className="w-5 h-5 shrink-0" />
                              Contactar por WhatsApp
                            </a>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    // Vista de lista de pedidos
                    <>
                      {ordersLoading ? (
                        <div className="space-y-3 md:space-y-4">
                          {[...Array(3)].map((_, index) => (
                            <div
                              key={index}
                              className="border border-gray-200 rounded-[12px] md:rounded-[14px] p-4 md:p-6 animate-pulse"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3 md:mb-4">
                                <div className="space-y-2">
                                  <div className="h-4 bg-gray-200 rounded w-28 md:w-32"></div>
                                  <div className="h-3 bg-gray-200 rounded w-20 md:w-24"></div>
                                </div>
                                <div className="h-6 bg-gray-200 rounded-full w-20 md:w-24 self-start"></div>
                              </div>
                              <div className="space-y-2">
                                {[...Array(2)].map((_, itemIndex) => (
                                  <div key={itemIndex} className="flex items-center gap-3">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-lg shrink-0"></div>
                                    <div className="flex-1 space-y-2 min-w-0">
                                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                      <div className="h-3 bg-gray-200 rounded w-16 md:w-20"></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center justify-between mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200">
                                <div className="h-4 bg-gray-200 rounded w-10 md:w-12"></div>
                                <div className="h-5 bg-gray-200 rounded w-20 md:w-24"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : orders.length === 0 ? (
                        <div className="border border-dashed border-gray-300 rounded-[12px] p-5 md:p-6 text-center space-y-3 bg-gray-50">
                          <div className="mx-auto w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[#00C1A7]">
                            <Package className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm md:text-base font-semibold text-gray-900">Aún no tienes pedidos</p>
                            <p className="text-xs md:text-sm text-gray-600">
                              Cuando realices tu primera compra, aparecerá aquí.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 md:space-y-4">
                          {orders.map((order) => (
                            <div
                              key={order.id}
                              className="border border-gray-200 rounded-[12px] md:rounded-[14px] p-4 md:p-6 hover:border-[#00C1A7] transition-colors cursor-pointer"
                              onClick={() => {
                                setSelectedOrder(order);
                              }}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3 md:mb-4">
                                <div className="min-w-0">
                                  <p className="text-xs md:text-sm text-gray-600 mb-0.5 md:mb-1">Pedido #{order.order_number}</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(order.created_at).toLocaleDateString("es-AR", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })}
                                  </p>
                                  {/* Estado de pago */}
                                  {order.payment_processed !== undefined && (
                                    <div className="flex items-center gap-2 mt-1">
                                      {order.payment_processed ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                                          <CheckCircle className="w-3 h-3 shrink-0" />
                                          Pagado
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                                          <XCircle className="w-3 h-3 shrink-0" />
                                          Pendiente de pago
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <span className={`text-xs font-semibold px-2.5 md:px-3 py-1 rounded-full w-fit shrink-0 ${
                                  (() => {
                                    const normalizedStatus = normalizeOrderStatus(order.status);
                                    return normalizedStatus === "finalizado" ? "bg-green-100 text-green-700" :
                                           normalizedStatus === "en reparto" ? "bg-blue-100 text-blue-700" :
                                           normalizedStatus === "pendiente de entrega" ? "bg-amber-100 text-amber-700" :
                                           "bg-gray-100 text-gray-700";
                                  })()
                                }`}>
                                  {(() => {
                                    const normalizedStatus = normalizeOrderStatus(order.status);
                                    if (normalizedStatus === "pendiente de entrega") return "Pendiente de entrega";
                                    if (normalizedStatus === "en reparto") return "En reparto";
                                    if (normalizedStatus === "finalizado") return "Finalizado";
                                    return order.status;
                                  })()}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {order.items.slice(0, 2).map((item) => (
                                  <div key={item.id} className="flex items-center gap-2 md:gap-3">
                                    {item.product_image && (
                                      <img
                                        src={item.product_image}
                                        alt={item.product_name}
                                        className="w-10 h-10 md:w-12 md:h-12 object-cover rounded-lg shrink-0"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs md:text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                                      <p className="text-xs text-gray-600">Cantidad: {item.quantity}</p>
                                    </div>
                                  </div>
                                ))}
                                {order.items.length > 2 && (
                                  <p className="text-xs text-gray-500">+{order.items.length - 2} producto(s) más</p>
                                )}
                              </div>
                              <div className="flex items-center justify-between mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200">
                                <span className="text-xs md:text-sm text-gray-600">Total:</span>
                                <span className="text-sm md:text-base font-semibold text-gray-900">
                                  ${order.total_amount.toLocaleString("es-AR", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                              <div className="mt-3 md:mt-4 flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/tracking/${order.id}`);
                                  }}
                                  className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 bg-[#00C1A7] text-white px-3 py-2.5 md:px-4 md:py-2 rounded-[8px] font-semibold hover:bg-[#00a892] transition-colors text-xs md:text-sm"
                                >
                                  <Truck className="w-4 h-4 shrink-0" />
                                  Ver seguimiento
                                </button>
                                {normalizeOrderStatus(order.status) === "finalizado" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/reviews/${order.id}`);
                                    }}
                                    className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 bg-emerald-500 text-white px-3 py-2.5 md:px-4 md:py-2 rounded-[8px] font-semibold hover:bg-emerald-600 transition-colors text-xs md:text-sm"
                                  >
                                    <FileText className="w-4 h-4 shrink-0" />
                                    Reseñar
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Controles de paginación */}
                      {ordersPagination.pages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                          <div className="text-xs md:text-sm text-gray-600">
                            Página {ordersPagination.page} de {ordersPagination.pages} ({ordersPagination.total} pedidos)
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (ordersPagination.page > 1) {
                                  loadOrders(ordersPagination.page - 1);
                                }
                              }}
                              disabled={ordersPagination.page === 1 || ordersLoading}
                              className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs md:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-[8px] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              Anterior
                            </button>
                            <button
                              onClick={() => {
                                if (ordersPagination.page < ordersPagination.pages) {
                                  loadOrders(ordersPagination.page + 1);
                                }
                              }}
                              disabled={ordersPagination.page === ordersPagination.pages || ordersLoading}
                              className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs md:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-[8px] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Siguiente
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />

      {/* Modal de Transferir Saldo */}
      {showTransferModal && (
        <div 
          className="fixed inset-0 backdrop-blur-[1px] bg-black/40 z-[200] flex items-center justify-center p-4"
          onClick={() => {
            setShowTransferModal(false);
            setTransferForm({ email: "", amount: "" });
            setTransferStatus(null);
          }}
        >
          <div 
            className="bg-white rounded-[14px] w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-[#00C1A7]" />
                  <h2 className="text-xl font-semibold text-gray-900">Transferir saldo</h2>
                </div>
                <button
                  onClick={() => {
                    setShowTransferModal(false);
                    setTransferForm({ email: "", amount: "" });
                    setTransferStatus(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  type="button"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {transferStatus && (
                <div
                  className={`px-4 py-3 rounded-lg border text-sm mb-4 ${
                    transferStatus.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  {transferStatus.message}
                </div>
              )}

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setTransferStatus(null);

                  // Validaciones
                  if (!transferForm.email || !transferForm.email.includes("@")) {
                    setTransferStatus({
                      type: "error",
                      message: "Por favor ingresa un email válido.",
                    });
                    return;
                  }

                  const amount = parseFloat(transferForm.amount);
                  if (!transferForm.amount || isNaN(amount) || amount <= 0) {
                    setTransferStatus({
                      type: "error",
                      message: "Por favor ingresa un monto válido mayor a 0.",
                    });
                    return;
                  }

                  setTransferSaving(true);
                  try {
                    await transferWalletBalance(transferForm.email, amount);
                    
                    setTransferStatus({
                      type: "success",
                      message: `Transferencia de $${amount.toFixed(2)} a ${transferForm.email} realizada exitosamente.`,
                    });
                    
                    // Recargar datos de wallet
                    await loadWalletData();
                    
                    setTimeout(() => {
                      setShowTransferModal(false);
                      setTransferForm({ email: "", amount: "" });
                      setTransferStatus(null);
                    }, 2000);
                  } catch (error: any) {
                    setTransferStatus({
                      type: "error",
                      message: error?.message || "Error al realizar la transferencia. Inténtalo nuevamente.",
                    });
                  } finally {
                    setTransferSaving(false);
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email del destinatario *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={transferForm.email}
                      onChange={(e) =>
                        setTransferForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-[10px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-transparent"
                      placeholder="usuario@ejemplo.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Monto a transferir *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={transferForm.amount}
                      onChange={(e) =>
                        setTransferForm((prev) => ({ ...prev, amount: e.target.value }))
                      }
                      className="block w-full pl-8 pr-3 py-3 border border-gray-300 rounded-[10px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTransferModal(false);
                      setTransferForm({ email: "", amount: "" });
                      setTransferStatus(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-[6px] font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                    disabled={transferSaving}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={transferSaving}
                    className="flex-1 px-4 py-2 bg-[#00C1A7] text-white rounded-[6px] font-medium hover:bg-[#00a892] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {transferSaving ? "Transferiendo..." : "Transferir"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Historial de Uso */}
      {showHistoryModal && (
        <div 
          className="fixed inset-0 backdrop-blur-[1px] bg-black/40 z-[200] flex items-center justify-center p-4"
          onClick={() => setShowHistoryModal(false)}
        >
          <div 
            className="bg-white rounded-[14px] w-full max-w-2xl shadow-xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-[#00C1A7]" />
                  <h2 className="text-xl font-semibold text-gray-900">Historial de uso</h2>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  type="button"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {movementsLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Cargando movimientos...</p>
                </div>
              ) : walletMovements.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay movimientos registrados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {walletMovements.map((movement) => {
                    // Si la descripción contiene "Descuento", es una reducción de dinero
                    const isDiscount = movement.description?.toLowerCase().includes("descuento") || false;
                    // Las compras también son reducción de dinero
                    const isPurchase = movement.type === "purchase" || movement.type === "order_payment";
                    const isOutgoing = movement.amount < 0 || isDiscount || isPurchase;
                    const isIncoming = movement.amount > 0 && !isDiscount && !isPurchase;
                    const movementDate = new Date(movement.created_at);
                    const formattedDate = movementDate.toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    });
                    const formattedTime = movementDate.toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    // Determinar tipo de movimiento
                    let movementType = "Otro";
                    let icon = <ShoppingCart className="w-5 h-5" />;
                    let bgColor = "bg-blue-50 text-blue-600";
                    let badgeColor = "bg-blue-100 text-blue-700";
                    
                    // Si es descuento, tratarlo como reducción
                    if (isDiscount) {
                      movementType = "Descuento";
                      icon = <ArrowUpRight className="w-5 h-5" />;
                      bgColor = "bg-red-50 text-red-600";
                      badgeColor = "bg-red-100 text-red-700";
                    }

                    if (movement.type === "transfer_out") {
                      movementType = "Enviada";
                      icon = <ArrowUpRight className="w-5 h-5" />;
                      bgColor = "bg-red-50 text-red-600";
                      badgeColor = "bg-red-100 text-red-700";
                    } else if (movement.type === "transfer_in") {
                      movementType = "Recibida";
                      icon = <ArrowDownRight className="w-5 h-5" />;
                      bgColor = "bg-emerald-50 text-emerald-600";
                      badgeColor = "bg-emerald-100 text-emerald-700";
                    } else if (movement.type === "purchase" || movement.type === "order_payment") {
                      movementType = "Compra";
                      icon = <ShoppingCart className="w-5 h-5" />;
                      bgColor = "bg-red-50 text-red-600";
                      badgeColor = "bg-red-100 text-red-700";
                    } else if (movement.type === "accreditation" || movement.type === "manual_credit") {
                      movementType = "Acreditación";
                      icon = <ArrowDownRight className="w-5 h-5" />;
                      bgColor = "bg-emerald-50 text-emerald-600";
                      badgeColor = "bg-emerald-100 text-emerald-700";
                    }

                    return (
                      <div
                        key={movement.id}
                        className="border border-gray-200 rounded-[12px] p-4 hover:border-[#00C1A7] transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${bgColor}`}>
                              {icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
                                  {movementType}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {movement.description || movementType}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formattedDate} a las {formattedTime}
                              </p>
                              {/* Mostrar información de vencimiento para créditos */}
                              {isIncoming && movement.expires_at && (
                                (() => {
                                  const expiresDate = new Date(movement.expires_at);
                                  const now = new Date();
                                  const isExpired = expiresDate < now;
                                  const daysUntilExpiry = Math.ceil((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                  const formattedExpiryDate = expiresDate.toLocaleDateString("es-AR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  });
                                  
                                  return (
                                    <div className="mt-1">
                                      {isExpired ? (
                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                          <span>Vencido el {formattedExpiryDate}</span>
                                        </span>
                                      ) : daysUntilExpiry <= 7 ? (
                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                                          <span>Vence el {formattedExpiryDate} ({daysUntilExpiry} {daysUntilExpiry === 1 ? 'día' : 'días'})</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                          <span>Vence el {formattedExpiryDate}</span>
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-lg font-bold ${
                                isOutgoing ? "text-red-600" : "text-emerald-600"
                              }`}
                            >
                              {isOutgoing ? "-" : "+"}${Math.abs(movement.amount).toLocaleString("es-AR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

