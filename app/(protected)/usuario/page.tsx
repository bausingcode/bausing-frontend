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
  type Address,
  type WalletMovement,
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
  ShoppingCart
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
    province: "",
    is_default: false,
  });
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

  // Cargar datos de wallet cuando se activa la sección
  useEffect(() => {
    if (activeSection === "billetera" && isAuthenticated) {
      loadWalletData();
    }
  }, [activeSection, isAuthenticated]);

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

      <main className="flex-1 container mx-auto px-4 lg:px-8 py-8 lg:py-12">
        <div className={`grid lg:grid-cols-[280px_1fr] gap-6 ${activeSection === "billetera" ? "items-stretch" : "items-start"}`}>
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
                const isDisabled = !["perfil", "direcciones", "seguridad", "billetera", "logout"].includes(item.key);

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
          <section className={`space-y-4 ${activeSection === "billetera" ? "h-full" : ""}`}>
            <div className={`bg-white border border-gray-200 rounded-[14px] shadow-sm p-6 ${activeSection === "billetera" ? "h-full" : ""}`}>
              <div className="flex items-center justify-between gap-3 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Sección</p>
                  <h1 className="text-2xl font-bold text-gray-900">{currentTitle}</h1>
                </div>
                <div className="bg-[#00C1A7]/10 text-[#00C1A7] px-3 py-1.5 rounded-full text-sm font-semibold">
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
                          if (!addressForm.street || !addressForm.number || !addressForm.postal_code || !addressForm.city || !addressForm.province) {
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
                              province: addressForm.province.trim(),
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
                              province: addressForm.province.trim(),
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
                            province: "",
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
                          <input
                            type="text"
                            value={addressForm.province}
                            onChange={(e) => setAddressForm((prev) => ({ ...prev, province: e.target.value }))}
                            className="block w-full px-3 py-3 border border-gray-300 rounded-[10px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-transparent"
                            placeholder="Ej: CABA"
                            required
                          />
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
                              province: "",
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
                                  province: address.province,
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
                <div className="space-y-8">
                  {/* Sección de Email y Verificación */}
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Email y Verificación</h2>
                      
                      {/* Email del usuario */}
                      <div className="border border-gray-200 rounded-[12px] p-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg border border-gray-200">
                              <Mail className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Email</p>
                              <p className="text-base font-semibold text-gray-900">{user?.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {user?.email_verified ? (
                              <>
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                                <span className="text-sm font-semibold text-emerald-600">Verificado</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-5 h-5 text-red-600" />
                                <span className="text-sm font-semibold text-red-600">No verificado</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Mensaje de estado de reenvío */}
                      {resendMessage && (
                        <div
                          className={`px-4 py-3 rounded-lg border text-sm ${
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
                        <div className="border border-amber-200 rounded-[12px] p-4 bg-amber-50">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                              <Mail className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-amber-900 mb-1">
                                Tu email no está verificado
                              </p>
                              <p className="text-sm text-amber-700 mb-3">
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
                                className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-[8px] text-sm font-semibold hover:bg-amber-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                <RefreshCw className={`w-4 h-4 ${resendLoading ? "animate-spin" : ""}`} />
                                {resendLoading ? "Enviando..." : "Reenviar email de verificación"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sección de Cambio de Contraseña */}
                  <div className="border-t border-gray-200 pt-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Cambiar Contraseña</h2>
                    <form
                      className="space-y-6"
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
                          className={`px-4 py-3 rounded-lg border text-sm ${
                            passwordStatus.type === "success"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-red-50 border-red-200 text-red-700"
                          }`}
                        >
                          {passwordStatus.message}
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Contraseña actual</label>
                        <input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                          }
                          className="block w-full px-3 py-3 border border-gray-300 rounded-[10px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-transparent"
                          placeholder="••••••••"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Nueva contraseña</label>
                        <input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                          }
                          className="block w-full px-3 py-3 border border-gray-300 rounded-[10px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-transparent"
                          placeholder="Mínimo 8 caracteres"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Confirmar nueva contraseña</label>
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                          }
                          className="block w-full px-3 py-3 border border-gray-300 rounded-[10px] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00C1A7] focus:border-transparent"
                          placeholder="Repite la nueva contraseña"
                          required
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3">
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
                          className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
                          disabled={passwordSaving}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={passwordSaving}
                          className="inline-flex items-center gap-2 bg-[#00C1A7] text-white py-3 px-5 rounded-[8px] font-semibold hover:bg-[#00a892] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {passwordSaving ? "Guardando..." : "Actualizar contraseña"}
                        </button>
                      </div>
                    </form>
                  </div>
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

