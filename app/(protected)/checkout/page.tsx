"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import {
  getUserAddresses,
  createUserAddress,
  getUserWalletBalance,
  type Address,
} from "@/lib/api";
import {
  MapPin,
  CreditCard,
  Wallet,
  Truck,
  Plus,
  Check,
  Loader2,
  ArrowRightLeft,
} from "lucide-react";

type PaymentMethod = "card" | "cash" | "transfer" | "wallet" | null;
type DocumentType = "dni" | "passport" | "cuit" | "";

export default function CheckoutPage() {
  const { user, isAuthenticated } = useAuth();
  const { cart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    document_type: "" as DocumentType,
    dni: "",
    phone: "",
    alternate_phone: "",
    email: "",
  });

  // Address form
  const [addressForm, setAddressForm] = useState({
    street: "",
    number: "",
    postal_code: "",
    additional_info: "",
    full_name: "",
    phone: "",
    city: "",
    province: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [payOnDelivery, setPayOnDelivery] = useState(false);
  const [useWalletBalance, setUseWalletBalance] = useState(false);
  const [cardData, setCardData] = useState({
    number: "",
    cvv: "",
    expiry: "",
    holder_name: "",
    holder_dni: "",
  });
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (cart.length === 0) {
      router.replace("/");
      return;
    }
    setLoading(false);
  }, [isAuthenticated, cart.length, router]);

  // Load user data and addresses
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        document_type: "" as DocumentType,
        dni: user.dni || "",
        phone: user.phone || "",
        alternate_phone: "",
        email: user.email || "",
      });
      loadAddresses();
      loadWalletBalance();
    }
  }, [isAuthenticated, user]);

  const loadAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const data = await getUserAddresses();
      setAddresses(data);
      // Select default address if exists
      const defaultAddress = data.find((addr) => addr.is_default);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      } else if (data.length > 0) {
        setSelectedAddressId(data[0].id);
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const loadWalletBalance = async () => {
    setWalletLoading(true);
    try {
      const balanceData = await getUserWalletBalance();
      setWalletBalance(balanceData.balance);
    } catch (error) {
      console.error("Error loading wallet balance:", error);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleCardInputChange = (field: string, value: string) => {
    setCardData((prev) => ({ ...prev, [field]: value }));
    if (errors[`card_${field}`]) {
      setErrors((prev) => ({ ...prev, [`card_${field}`]: "" }));
    }
  };

  const handleAddressInputChange = (field: string, value: string) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = "El nombre es obligatorio";
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = "El apellido es obligatorio";
    }
    if (!formData.document_type) {
      newErrors.document_type = "El tipo de documento es obligatorio";
    }
    if (!formData.dni.trim()) {
      newErrors.dni = "El número de documento es obligatorio";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "El celular es obligatorio";
    }
    if (!formData.email.trim()) {
      newErrors.email = "El email es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El email no es válido";
    }
    if (!selectedAddressId && !showAddressForm) {
      newErrors.address = "Debes seleccionar o agregar una dirección";
    }
    if (showAddressForm) {
      if (!addressForm.full_name.trim()) {
        newErrors.address_full_name = "El nombre completo del destinatario es obligatorio";
      }
      if (!addressForm.phone.trim()) {
        newErrors.address_phone = "El teléfono del destinatario es obligatorio";
      }
      if (!addressForm.street.trim()) {
        newErrors.address_street = "La calle es obligatoria";
      }
      if (!addressForm.number.trim()) {
        newErrors.address_number = "El número es obligatorio";
      }
      if (!addressForm.postal_code.trim()) {
        newErrors.address_postal_code = "El código postal es obligatorio";
      }
      if (!addressForm.city.trim()) {
        newErrors.address_city = "La ciudad es obligatoria";
      }
      if (!addressForm.province.trim()) {
        newErrors.address_province = "La provincia es obligatoria";
      }
    }
    // Si se aplica saldo parcial, se requiere otro método de pago
    if (useWalletBalance && !paymentMethod) {
      newErrors.payment_method = "Debes seleccionar un método de pago para el monto restante";
    }
    // Si no se aplica saldo, se requiere un método de pago
    if (!useWalletBalance && !paymentMethod) {
      newErrors.payment_method = "Debes seleccionar un método de pago";
    }

    // Validate card fields if payment method is card
    if (paymentMethod === "card" && !payOnDelivery) {
      if (!cardData.number.trim()) {
        newErrors.card_number = "El número de tarjeta es obligatorio";
      } else if (!/^\d{13,19}$/.test(cardData.number.replace(/\s/g, ""))) {
        newErrors.card_number = "El número de tarjeta no es válido";
      }
      if (!cardData.cvv.trim()) {
        newErrors.card_cvv = "El CVV es obligatorio";
      } else if (!/^\d{3,4}$/.test(cardData.cvv)) {
        newErrors.card_cvv = "El CVV no es válido";
      }
      if (!cardData.expiry.trim()) {
        newErrors.card_expiry = "La fecha de vencimiento es obligatoria";
      } else if (!/^\d{2}\/\d{2}$/.test(cardData.expiry)) {
        newErrors.card_expiry = "El formato debe ser MM/AA";
      }
      if (!cardData.holder_name.trim()) {
        newErrors.card_holder_name = "El nombre del titular es obligatorio";
      }
      if (!cardData.holder_dni.trim()) {
        newErrors.card_holder_dni = "El DNI del titular es obligatorio";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveAddress = async () => {
    try {
      const newAddress = await createUserAddress({
        full_name: addressForm.full_name,
        phone: addressForm.phone,
        street: addressForm.street,
        number: addressForm.number,
        additional_info: addressForm.additional_info || undefined,
        postal_code: addressForm.postal_code,
        city: addressForm.city,
        province: addressForm.province,
        is_default: addresses.length === 0,
      });
      setAddresses((prev) => [...prev, newAddress]);
      setSelectedAddressId(newAddress.id);
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
      });
    } catch (error: any) {
      setErrors({ address: error?.message || "Error al guardar la dirección" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      // If showing address form, save it first
      if (showAddressForm) {
        await handleSaveAddress();
      }

      const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId);
      if (!selectedAddress && !showAddressForm) {
        setErrors({ address: "Debes seleccionar una dirección" });
        setSubmitting(false);
        return;
      }

      // Prepare order data
      const orderData = {
        customer: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          document_type: formData.document_type,
          dni: formData.dni,
          phone: formData.phone,
          alternate_phone: formData.alternate_phone || undefined,
          email: formData.email,
        },
        address: showAddressForm
          ? {
              full_name: addressForm.full_name,
              phone: addressForm.phone,
              street: addressForm.street,
              number: addressForm.number,
              additional_info: addressForm.additional_info || undefined,
              postal_code: addressForm.postal_code,
              city: addressForm.city,
              province: addressForm.province,
            }
          : selectedAddress,
        payment_method: paymentMethod,
        pay_on_delivery: payOnDelivery,
        ...(useWalletBalance && {
          use_wallet_balance: true,
          wallet_amount: walletBalance,
        }),
        ...(paymentMethod === "card" && !payOnDelivery && {
          card_data: {
            number: cardData.number.replace(/\s/g, ""),
            cvv: cardData.cvv,
            expiry: cardData.expiry,
            holder_name: cardData.holder_name,
            holder_dni: cardData.holder_dni,
          },
        }),
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          price: parseFloat(item.price),
        })),
      };

      // TODO: Send order to backend
      console.log("Order data:", orderData);

      // For now, just show success message
      alert("¡Pedido realizado con éxito!");
      router.push("/");
    } catch (error: any) {
      setErrors({ submit: error?.message || "Error al procesar el pedido" });
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  };

  const totalAmount = calculateTotal();
  const canPayWithWallet = walletBalance >= totalAmount;
  const remainingAfterWallet = Math.max(0, totalAmount - walletBalance);

  if (loading) {
    return null;
  }

  const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 lg:px-8 py-8 lg:py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

          <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="bg-white border border-gray-200 rounded-[14px] p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Información personal
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange("first_name", e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-[#808080] ${
                        errors.first_name ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.first_name && (
                      <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellido <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange("last_name", e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-[#808080] ${
                        errors.last_name ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.last_name && (
                      <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Documento <span className="text-red-500">*</span>
                    </label>
                    <div className={`flex border rounded-lg overflow-hidden ${
                      errors.document_type || errors.dni ? "border-red-500" : "border-gray-300"
                    } focus-within:ring-2 focus-within:ring-[#00C1A7] focus-within:border-transparent`}>
                      <select
                        value={formData.document_type}
                        onChange={(e) => handleInputChange("document_type", e.target.value)}
                        className="px-4 py-2.5 border-r border-gray-300 bg-white focus:outline-none text-[#808080] text-sm min-w-[140px]"
                      >
                        <option value="">Tipo</option>
                        <option value="dni">DNI</option>
                        <option value="passport">Pasaporte</option>
                        <option value="cuit">CUIT</option>
                      </select>
                      <input
                        type="text"
                        value={formData.dni}
                        onChange={(e) => handleInputChange("dni", e.target.value)}
                        placeholder="Número de documento"
                        className="flex-1 px-4 py-2.5 border-0 focus:outline-none text-[#808080] placeholder:text-[#DEDEDE]"
                      />
                    </div>
                    {errors.document_type && (
                      <p className="text-red-500 text-xs mt-1">{errors.document_type}</p>
                    )}
                    {errors.dni && (
                      <p className="text-red-500 text-xs mt-1">{errors.dni}</p>
                    )}
                  </div>
                  <div className="md:col-span-2 grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Celular <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-[#808080] ${
                          errors.phone ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Celular alternativo
                      </label>
                      <input
                        type="tel"
                        value={formData.alternate_phone}
                        onChange={(e) => handleInputChange("alternate_phone", e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-[#808080]"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-[#808080] ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white border border-gray-200 rounded-[14px] p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Dirección de entrega
                  </h2>
                  {!showAddressForm && (
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(true)}
                      className="flex items-center gap-2 text-sm text-[#00C1A7] hover:text-[#00A892] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar dirección
                    </button>
                  )}
                </div>

                {errors.address && (
                  <p className="text-red-500 text-sm mb-4">{errors.address}</p>
                )}

                {showAddressForm ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">
                        Información del destinatario
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre completo <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={addressForm.full_name}
                            onChange={(e) => handleAddressInputChange("full_name", e.target.value)}
                            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-[#808080] ${
                              errors.address_full_name ? "border-red-500" : "border-gray-300"
                            }`}
                          />
                          {errors.address_full_name && (
                            <p className="text-red-500 text-xs mt-1">{errors.address_full_name}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Teléfono <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            value={addressForm.phone}
                            onChange={(e) => handleAddressInputChange("phone", e.target.value)}
                            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-[#808080] ${
                              errors.address_phone ? "border-red-500" : "border-gray-300"
                            }`}
                          />
                          {errors.address_phone && (
                            <p className="text-red-500 text-xs mt-1">{errors.address_phone}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Calle <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={addressForm.street}
                          onChange={(e) => handleAddressInputChange("street", e.target.value)}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-[#808080] ${
                            errors.address_street ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {errors.address_street && (
                          <p className="text-red-500 text-xs mt-1">{errors.address_street}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Número <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={addressForm.number}
                          onChange={(e) => handleAddressInputChange("number", e.target.value)}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-[#808080] ${
                            errors.address_number ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {errors.address_number && (
                          <p className="text-red-500 text-xs mt-1">{errors.address_number}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Código postal <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={addressForm.postal_code}
                          onChange={(e) => handleAddressInputChange("postal_code", e.target.value)}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-[#808080] ${
                            errors.address_postal_code ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {errors.address_postal_code && (
                          <p className="text-red-500 text-xs mt-1">{errors.address_postal_code}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Información adicional
                        </label>
                        <input
                          type="text"
                          value={addressForm.additional_info}
                          onChange={(e) => handleAddressInputChange("additional_info", e.target.value)}
                          placeholder="Depto, piso, etc."
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-[#808080] placeholder:text-[#DEDEDE]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ciudad <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={addressForm.city}
                          onChange={(e) => handleAddressInputChange("city", e.target.value)}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-[#808080] ${
                            errors.address_city ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {errors.address_city && (
                          <p className="text-red-500 text-xs mt-1">{errors.address_city}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Provincia <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={addressForm.province}
                          onChange={(e) => handleAddressInputChange("province", e.target.value)}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-[#808080] ${
                            errors.address_province ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {errors.address_province && (
                          <p className="text-red-500 text-xs mt-1">{errors.address_province}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
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
                          });
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAddress}
                        className="px-4 py-2 bg-[#00C1A7] text-white rounded-lg hover:bg-[#00A892] transition-colors"
                      >
                        Guardar dirección
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {loadingAddresses ? (
                      <p className="text-gray-500 text-sm">Cargando direcciones...</p>
                    ) : addresses.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">No tienes direcciones guardadas</p>
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(true)}
                          className="text-[#00C1A7] hover:text-[#00A892] font-medium"
                        >
                          Agregar dirección
                        </button>
                      </div>
                    ) : (
                      addresses.map((address) => (
                        <label
                          key={address.id}
                          className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedAddressId === address.id
                              ? "border-[#00C1A7] bg-[#00C1A7]/5"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="address"
                            value={address.id}
                            checked={selectedAddressId === address.id}
                            onChange={(e) => setSelectedAddressId(e.target.value)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-gray-900">
                                {address.full_name}
                              </span>
                              {address.is_default && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                  Por defecto
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {address.street} {address.number}
                              {address.additional_info && `, ${address.additional_info}`}
                            </p>
                            <p className="text-sm text-gray-600">
                              {address.city}, {address.province} {address.postal_code}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Tel: {address.phone}
                            </p>
                          </div>
                          {selectedAddressId === address.id && (
                            <Check className="w-5 h-5 text-[#00C1A7]" />
                          )}
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white border border-gray-200 rounded-[14px] p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Método de pago
                </h2>
                {errors.payment_method && (
                  <p className="text-red-500 text-sm mb-4">{errors.payment_method}</p>
                )}
                <div className="space-y-3">
                  <label
                    className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === "card"
                        ? "border-[#00C1A7] bg-[#00C1A7]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={() => {
                        setPaymentMethod("card");
                        setPayOnDelivery(false);
                        // Clear card errors when switching to card
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          Object.keys(newErrors).forEach((key) => {
                            if (key.startsWith("card_")) {
                              delete newErrors[key];
                            }
                          });
                          return newErrors;
                        });
                      }}
                      className="w-4 h-4"
                    />
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Tarjeta</span>
                    {paymentMethod === "card" && (
                      <Check className="w-5 h-5 text-[#00C1A7] ml-auto" />
                    )}
                  </label>
                  <label
                    className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === "cash"
                        ? "border-[#00C1A7] bg-[#00C1A7]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cash"
                      checked={paymentMethod === "cash"}
                      onChange={() => {
                        setPaymentMethod("cash");
                        setPayOnDelivery(true);
                        // Clear card data and errors when switching to cash
                        setCardData({
                          number: "",
                          cvv: "",
                          expiry: "",
                          holder_name: "",
                          holder_dni: "",
                        });
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          Object.keys(newErrors).forEach((key) => {
                            if (key.startsWith("card_")) {
                              delete newErrors[key];
                            }
                          });
                          return newErrors;
                        });
                      }}
                      className="w-4 h-4"
                    />
                    <Wallet className="w-5 h-5 text-gray-600" />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Efectivo</span>
                      <p className="text-xs text-gray-500 mt-0.5">Abonás al recibir</p>
                    </div>
                    {paymentMethod === "cash" && (
                      <Check className="w-5 h-5 text-[#00C1A7] ml-auto" />
                    )}
                  </label>
                  <label
                    className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === "transfer"
                        ? "border-[#00C1A7] bg-[#00C1A7]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="transfer"
                      checked={paymentMethod === "transfer"}
                      onChange={() => {
                        setPaymentMethod("transfer");
                        setPayOnDelivery(true);
                        // Clear card data and errors when switching to transfer
                        setCardData({
                          number: "",
                          cvv: "",
                          expiry: "",
                          holder_name: "",
                          holder_dni: "",
                        });
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          Object.keys(newErrors).forEach((key) => {
                            if (key.startsWith("card_")) {
                              delete newErrors[key];
                            }
                          });
                          return newErrors;
                        });
                      }}
                      className="w-4 h-4"
                    />
                    <ArrowRightLeft className="w-5 h-5 text-gray-600" />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Transferencia</span>
                      <p className="text-xs text-gray-500 mt-0.5">Abonás al recibir</p>
                    </div>
                    {paymentMethod === "transfer" && (
                      <Check className="w-5 h-5 text-[#00C1A7] ml-auto" />
                    )}
                  </label>
                  {/* Billetera Bausing - Solo como método de pago si el saldo cubre el total */}
                  {canPayWithWallet ? (
                    <label
                      className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === "wallet"
                          ? "border-[#00C1A7] bg-[#00C1A7]/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="wallet"
                        checked={paymentMethod === "wallet"}
                        onChange={() => {
                          setPaymentMethod("wallet");
                          setPayOnDelivery(false);
                          setUseWalletBalance(false);
                          // Clear card data and errors when switching to wallet
                          setCardData({
                            number: "",
                            cvv: "",
                            expiry: "",
                            holder_name: "",
                            holder_dni: "",
                          });
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            Object.keys(newErrors).forEach((key) => {
                              if (key.startsWith("card_")) {
                                delete newErrors[key];
                              }
                            });
                            delete newErrors.payment_method;
                            return newErrors;
                          });
                        }}
                        className="w-4 h-4"
                      />
                      <CreditCard className="w-5 h-5 text-gray-600" />
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">Billetera Bausing</span>
                        {walletLoading ? (
                          <p className="text-xs text-gray-500 mt-0.5">Cargando saldo...</p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Saldo disponible: ${walletBalance.toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        )}
                      </div>
                      {paymentMethod === "wallet" && (
                        <Check className="w-5 h-5 text-[#00C1A7] ml-auto" />
                      )}
                    </label>
                  ) : walletBalance > 0 && (
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useWalletBalance}
                          onChange={(e) => {
                            setUseWalletBalance(e.target.checked);
                            if (e.target.checked) {
                              // Si estaba seleccionado wallet como método completo, limpiarlo
                              if (paymentMethod === "wallet") {
                                setPaymentMethod(null);
                              }
                              setPayOnDelivery(false);
                              // Limpiar errores de pago
                              setErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.payment_method;
                                return newErrors;
                              });
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-[#00C1A7] focus:ring-[#00C1A7]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-gray-600" />
                            <span className="font-medium text-gray-900">
                              Aplicar saldo de Billetera Bausing
                            </span>
                          </div>
                          {walletLoading ? (
                            <p className="text-xs text-gray-500 mt-1">Cargando saldo...</p>
                          ) : (
                            <p className="text-xs text-gray-500 mt-1">
                              Aplicar ${walletBalance.toLocaleString("es-AR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })} de tu saldo disponible. Restante: ${remainingAfterWallet.toLocaleString("es-AR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                          )}
                        </div>
                      </label>
                    </div>
                  )}
                </div>

                {/* Card payment fields */}
                {paymentMethod === "card" && !payOnDelivery && (
                  <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Información de la tarjeta
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de tarjeta <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={cardData.number}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, "");
                          if (value.length > 16) value = value.slice(0, 16);
                          value = value.replace(/(.{4})/g, "$1 ").trim();
                          handleCardInputChange("number", value);
                        }}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-[#808080] placeholder:text-[#DEDEDE] ${
                          errors.card_number ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.card_number && (
                        <p className="text-red-500 text-xs mt-1">{errors.card_number}</p>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vencimiento <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={cardData.expiry}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, "");
                            if (value.length >= 2) {
                              value = value.slice(0, 2) + "/" + value.slice(2, 4);
                            }
                            handleCardInputChange("expiry", value);
                          }}
                          placeholder="MM/AA"
                          maxLength={5}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-[#808080] placeholder:text-[#DEDEDE] ${
                            errors.card_expiry ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {errors.card_expiry && (
                          <p className="text-red-500 text-xs mt-1">{errors.card_expiry}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={cardData.cvv}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                            handleCardInputChange("cvv", value);
                          }}
                          placeholder="123"
                          maxLength={4}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-[#808080] placeholder:text-[#DEDEDE] ${
                            errors.card_cvv ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {errors.card_cvv && (
                          <p className="text-red-500 text-xs mt-1">{errors.card_cvv}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del titular <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={cardData.holder_name}
                        onChange={(e) => handleCardInputChange("holder_name", e.target.value)}
                        placeholder="Como aparece en la tarjeta"
                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-[#808080] placeholder:text-[#DEDEDE] ${
                          errors.card_holder_name ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.card_holder_name && (
                        <p className="text-red-500 text-xs mt-1">{errors.card_holder_name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        DNI del titular <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={cardData.holder_dni}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          handleCardInputChange("holder_dni", value);
                        }}
                        placeholder="12345678"
                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-[#808080] placeholder:text-[#DEDEDE] ${
                          errors.card_holder_dni ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.card_holder_dni && (
                        <p className="text-red-500 text-xs mt-1">{errors.card_holder_dni}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Pay on delivery option */}
                {(paymentMethod === "cash" || paymentMethod === "transfer") && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={payOnDelivery}
                        disabled
                        className="w-4 h-4 rounded border-gray-300 text-[#00C1A7] focus:ring-[#00C1A7] cursor-not-allowed opacity-60"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Pagar al recibir</span>
                        <p className="text-sm text-gray-500">
                          Pagarás cuando recibas tu pedido
                        </p>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-[14px] p-6 sticky top-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Resumen del pedido
                </h2>
                <div className="space-y-4 mb-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Cantidad: {item.quantity}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          ${(parseFloat(item.price) * item.quantity).toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>
                      ${calculateTotal().toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  {useWalletBalance && walletBalance > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Descuento Billetera Bausing</span>
                      <span>
                        -${walletBalance.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Envío</span>
                    <span className="text-gray-400">Calculado al finalizar</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-gray-900">
                        ${(useWalletBalance 
                          ? Math.max(0, totalAmount - walletBalance)
                          : totalAmount
                        ).toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    {useWalletBalance && remainingAfterWallet > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Se aplicará ${walletBalance.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} de tu billetera. Restante a pagar: ${remainingAfterWallet.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    )}
                  </div>
                </div>
                {errors.submit && (
                  <p className="text-red-500 text-sm mt-4">{errors.submit}</p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-6 bg-[#00C1A7] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#00A892] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    "Finalizar compra"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

