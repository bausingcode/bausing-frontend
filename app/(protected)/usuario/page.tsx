"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loader from "@/components/Loader";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  updateUserProfile,
  changePassword,
  getUserAddresses,
  createUserAddress,
  updateUserAddress,
  deleteUserAddress,
  type Address,
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
  User
} from "lucide-react";

type MenuKey = "perfil" | "direcciones" | "pedidos" | "seguridad" | "logout";

const menuItems: { key: MenuKey; label: string; icon: LucideIcon }[] = [
  { key: "perfil", label: "Perfil", icon: User },
  { key: "direcciones", label: "Direcciones", icon: MapPin },
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
        <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start">
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
                const isDisabled = !["perfil", "direcciones", "seguridad", "logout"].includes(item.key);

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
          <section className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-[14px] shadow-sm p-6">
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

              {activeSection === "seguridad" && (
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
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

