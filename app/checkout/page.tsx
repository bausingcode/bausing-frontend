"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useLocality } from "@/contexts/LocalityContext";
import {
  getUserAddresses,
  createUserAddress,
  getUserWalletBalance,
  fetchProductsPrices,
  getDocTypes,
  getProvinces,
  type Address,
  type Product,
  type DocType,
  type Province,
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
  Trash2,
  Minus,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { formatPrice, calculateProductPrice } from "@/utils/priceUtils";

type PaymentMethod = "card" | "cash" | "transfer" | "wallet" | null;

export default function CheckoutPage() {
  const { user, isAuthenticated, register, login, updateUser } = useAuth();
  const { cart, removeFromCart, updateCartQuantity } = useCart();
  const { locality } = useLocality();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [productsWithPrices, setProductsWithPrices] = useState<Record<string, Product>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [docTypes, setDocTypes] = useState<DocType[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loadingDocTypes, setLoadingDocTypes] = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  
  // Registration and verification states
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState("");
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [resendVerificationLoading, setResendVerificationLoading] = useState(false);
  
  // Login states
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    document_type: "",
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
    province_id: "",
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

  // Check cart and initialize
  useEffect(() => {
    if (cart.length === 0) {
      router.replace("/");
      return;
    }
    
    // Permitir ver el checkout sin estar autenticado
    // Solo mostrar formulario de registro si no está autenticado
    if (!isAuthenticated) {
      setShowRegistration(false); // No mostrar formulario de registro automáticamente
    }
    
    setLoading(false);
  }, [cart.length, router]);

  // Load doc types and provinces on mount
  useEffect(() => {
    const loadDocTypes = async () => {
      setLoadingDocTypes(true);
      try {
        const data = await getDocTypes();
        setDocTypes(data);
      } catch (error) {
        console.error("Error loading doc types:", error);
      } finally {
        setLoadingDocTypes(false);
      }
    };

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

    loadDocTypes();
    loadProvinces();
  }, []);

  // Load user data and addresses
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        document_type: "",
        dni: user.dni || "",
        phone: user.phone || "",
        alternate_phone: "",
        email: user.email || "",
      });
      loadAddresses();
      loadWalletBalance();
    }
  }, [isAuthenticated, user]);

  // Load product prices based on locality
  useEffect(() => {
    const loadProductPrices = async () => {
      if (cart.length === 0 || !locality?.id) {
        setProductsWithPrices({});
        return;
      }

      setLoadingPrices(true);
      try {
        const productIds = cart.map(item => item.id);
        const pricesData = await fetchProductsPrices(productIds, locality.id);
        
        // Convert prices data to Product-like objects for calculateProductPrice
        const productsMap: Record<string, Product> = {};
        cart.forEach(item => {
          const priceData = pricesData[item.id];
          if (priceData) {
            productsMap[item.id] = {
              id: item.id,
              name: item.name,
              min_price: priceData.min_price,
              max_price: priceData.max_price,
              promos: priceData.promos || [],
            } as Product;
          }
        });
        
        setProductsWithPrices(productsMap);
      } catch (error) {
        console.error("Error loading product prices:", error);
      } finally {
        setLoadingPrices(false);
      }
    };

    loadProductPrices();
  }, [cart, locality?.id]);

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
      if (!addressForm.province_id) {
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
        province_id: addressForm.province_id,
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
        province_id: "",
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
              province_id: addressForm.province_id,
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
          price: getItemUnitPrice(item),
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

  // Función helper para obtener el precio de un item del carrito
  // Si hay precio calculado según localidad, usarlo; sino usar el precio guardado
  const getItemPrice = (item: typeof cart[0]): number => {
    const product = productsWithPrices[item.id];
    if (product) {
      // Calcular precio usando calculateProductPrice con la cantidad
      const priceInfo = calculateProductPrice(product, item.quantity);
      return priceInfo.currentPriceValue;
    }
    // Fallback: parsear el precio guardado
    if (!item.price) return 0;
    if (typeof item.price === 'number') return item.price;
    const cleaned = item.price.replace(/[$\s]/g, '').replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Función helper para obtener el precio unitario de un item
  const getItemUnitPrice = (item: typeof cart[0]): number => {
    const product = productsWithPrices[item.id];
    if (product) {
      // Calcular precio unitario (cantidad 1)
      const priceInfo = calculateProductPrice(product, 1);
      return priceInfo.currentPriceValue;
    }
    // Fallback: parsear el precio guardado
    if (!item.price) return 0;
    if (typeof item.price === 'number') return item.price;
    const cleaned = item.price.replace(/[$\s]/g, '').replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + getItemPrice(item), 0);
  };

  const totalAmount = calculateTotal();
  const canPayWithWallet = walletBalance >= totalAmount;
  const remainingAfterWallet = Math.max(0, totalAmount - walletBalance);
  const shippingCost = 0; // TODO: Calculate shipping cost
  const subtotal = calculateTotal();
  const walletDiscount = useWalletBalance && walletBalance > 0 ? Math.min(walletBalance, subtotal) : 0;
  const finalTotal = Math.max(0, subtotal - walletDiscount + shippingCost);

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationError("");

    if (registrationData.password !== registrationData.confirmPassword) {
      setRegistrationError("Las contraseñas no coinciden");
      return;
    }

    if (registrationData.password.length < 6) {
      setRegistrationError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setRegistrationLoading(true);
    try {
      // Llamar al registro directamente sin usar el método del contexto que redirige
      const response = await fetch(`/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: registrationData.email,
          password: registrationData.password,
          first_name: registrationData.first_name,
          last_name: registrationData.last_name,
          phone: registrationData.phone || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Error al registrarse");
      }

      const { user: userData, token: userToken } = result.data;
      
      // Guardar en localStorage
      localStorage.setItem("user_token", userToken);
      localStorage.setItem("user_data", JSON.stringify(userData));
      
      // Disparar evento personalizado para que el AuthContext se actualice automáticamente
      window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { user: userData, token: userToken } 
      }));
      
      setShowRegistration(false);
      setShowLogin(false);
      setVerificationEmailSent(true);
      
      // Pequeño delay para asegurar que el contexto se actualice antes de cargar datos
      setTimeout(() => {
        // Reload addresses and wallet balance after registration
        loadAddresses();
        loadWalletBalance();
      }, 200);
    } catch (err: any) {
      setRegistrationError(err.message || "Error al registrarse");
    } finally {
      setRegistrationLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendVerificationLoading(true);
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

      setVerificationEmailSent(true);
    } catch (err: any) {
      setRegistrationError(err.message || "Error al reenviar el email de verificación");
    } finally {
      setResendVerificationLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setRegistrationError("");
    try {
      const token = localStorage.getItem("user_token");
      if (!token) {
        throw new Error("No hay sesión activa");
      }

      const response = await fetch(`/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success && data.data?.email_verified) {
        updateUser({ email_verified: true });
        setVerificationEmailSent(false);
        setRegistrationError("");
        // Reload addresses and wallet balance now that user is verified
        if (isAuthenticated) {
          loadAddresses();
          loadWalletBalance();
        }
      } else {
        setRegistrationError("Tu email aún no está verificado. Por favor, revisa tu correo y haz clic en el enlace de verificación.");
      }
    } catch (err: any) {
      setRegistrationError(err.message || "Error al verificar el estado");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      // Llamar al login directamente sin usar el método del contexto que redirige
      const response = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: loginData.email, password: loginData.password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Error al iniciar sesión");
      }

      const { user: userData, token: userToken } = data.data;
      
      // Guardar en localStorage
      localStorage.setItem("user_token", userToken);
      localStorage.setItem("user_data", JSON.stringify(userData));
      
      // Disparar evento personalizado para que el AuthContext se actualice inmediatamente
      window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { user: userData, token: userToken } 
      }));
      
      setShowLogin(false);
      setLoginData({ email: "", password: "" });
      
      // Cargar datos inmediatamente (el contexto ya se actualizó con el evento)
      loadAddresses();
      loadWalletBalance();
    } catch (err: any) {
      setLoginError(err.message || "Error al iniciar sesión");
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00C1A7]" />
      </div>
    );
  }

  const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId);
  const needsEmailVerification = !!(isAuthenticated && user && !user.email_verified);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 lg:py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">Checkout</h1>

          {/* Login/Register Banner - Show if not authenticated */}
          {!isAuthenticated && (
            <div className="bg-blue-50 border border-blue-200 rounded-[14px] p-4 md:p-6 mb-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      Inicia sesión o crea una cuenta para finalizar tu compra
                    </h3>
                    <p className="text-sm text-gray-600">
                      Necesitas estar registrado para completar tu pedido. Puedes iniciar sesión o crear una cuenta desde aquí.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLogin(true);
                      setShowRegistration(false);
                    }}
                    className="px-4 py-2 border border-[#00C1A7] text-[#00C1A7] rounded-lg hover:bg-[#00C1A7] hover:text-white transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    Iniciar sesión
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRegistration(true);
                      setShowLogin(false);
                    }}
                    className="px-4 py-2 bg-[#00C1A7] text-white rounded-lg hover:bg-[#00A892] transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    Crear cuenta
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          {!isAuthenticated && showLogin && (
            <div className="bg-white border border-gray-200 rounded-[14px] p-6 md:p-8 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Iniciar sesión</h2>
                <button
                  type="button"
                  onClick={() => setShowLogin(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                {loginError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{loginError}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-[#808080]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-[#808080] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLogin(false);
                      setShowRegistration(true);
                    }}
                    className="text-sm text-[#00C1A7] hover:text-[#00A892]"
                  >
                    ¿No tienes cuenta? Regístrate
                  </button>
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="px-6 py-2 bg-[#00C1A7] text-white rounded-lg hover:bg-[#00A892] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loginLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Iniciando sesión...
                      </>
                    ) : (
                      "Iniciar sesión"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Registration Form */}
          {!isAuthenticated && showRegistration && (
            <div className="bg-white border border-gray-200 rounded-[14px] p-6 md:p-8 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">Crear cuenta</h2>
                <button
                  type="button"
                  onClick={() => setShowRegistration(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleRegistration} className="space-y-4">
                {registrationError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{registrationError}</p>
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={registrationData.first_name}
                      onChange={(e) => setRegistrationData({ ...registrationData, first_name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-[#808080]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellido <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={registrationData.last_name}
                      onChange={(e) => setRegistrationData({ ...registrationData, last_name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-[#808080]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={registrationData.email}
                    onChange={(e) => setRegistrationData({ ...registrationData, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-[#808080]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={registrationData.phone}
                    onChange={(e) => setRegistrationData({ ...registrationData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-[#808080]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={registrationData.password}
                      onChange={(e) => setRegistrationData({ ...registrationData, password: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-[#808080] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar contraseña <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={registrationData.confirmPassword}
                      onChange={(e) => setRegistrationData({ ...registrationData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-[#808080] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRegistration(false);
                      setShowLogin(true);
                    }}
                    className="text-sm text-[#00C1A7] hover:text-[#00A892]"
                  >
                    ¿Ya tienes cuenta? Inicia sesión
                  </button>
                  <button
                    type="submit"
                    disabled={registrationLoading}
                    className="px-6 py-2 bg-[#00C1A7] text-white rounded-lg hover:bg-[#00A892] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {registrationLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creando cuenta...
                      </>
                    ) : (
                      "Crear cuenta"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Email Verification Banner */}
          {needsEmailVerification && (
            <div className="bg-amber-50 border border-amber-200 rounded-[14px] p-4 md:p-6 mb-6">
              {registrationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{registrationError}</p>
                </div>
              )}
              {verificationEmailSent && !registrationError && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-3 mb-4">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700">Email de verificación enviado. Revisa tu bandeja de entrada.</p>
                </div>
              )}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      Verifica tu email para finalizar la compra
                    </h3>
                    <p className="text-sm text-gray-600">
                      Hemos enviado un email de verificación a <strong>{user?.email}</strong>. 
                      Por favor, revisa tu bandeja de entrada y haz clic en el enlace para verificar tu cuenta.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendVerificationLoading}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  >
                    {resendVerificationLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Reenviando...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Reenviar email
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCheckVerification}
                    className="px-4 py-2 bg-[#00C1A7] text-white rounded-lg hover:bg-[#00A892] transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Check className="w-4 h-4" />
                    Ya verifiqué mi email
                  </button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6 order-2 lg:order-1">
              {/* Personal Information */}
              <div className="bg-white border border-gray-200 rounded-[14px] p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">
                  Información personal
                </h2>
                <div className="space-y-4">
                  {/* Name Row */}
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
                  </div>
                  
                  {/* Document Row */}
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
                        disabled={loadingDocTypes}
                      >
                        <option value="">Tipo</option>
                        {docTypes.map((docType) => (
                          <option key={docType.id} value={docType.id}>
                            {docType.name}
                          </option>
                        ))}
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

                  {/* Email Row */}
                  <div>
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

                  {/* Phone Row */}
                  <div className="grid md:grid-cols-2 gap-4">
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
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white border border-gray-200 rounded-[14px] p-4 md:p-6">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">
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
                            placeholder="Ej: Juan Pérez"
                            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900 placeholder:text-gray-400 ${
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
                            placeholder="Ej: +54 9 11 1234-5678"
                            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900 placeholder:text-gray-400 ${
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
                          placeholder="Ej: Av. Corrientes"
                          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900 placeholder:text-gray-400 ${
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
                          placeholder="Ej: 1234"
                          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900 placeholder:text-gray-400 ${
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
                          placeholder="Ej: C1000"
                          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900 placeholder:text-gray-400 ${
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
                          placeholder="Depto, piso, entrecalles, etc."
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900 placeholder:text-gray-400"
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
                          placeholder="Ej: Buenos Aires"
                          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900 placeholder:text-gray-400 ${
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
                        <select
                          value={addressForm.province_id || ""}
                          onChange={(e) => handleAddressInputChange("province_id", e.target.value)}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900 ${
                            errors.address_province ? "border-red-500" : "border-gray-300"
                          }`}
                          disabled={loadingProvinces}
                        >
                          <option value="" className="text-gray-400">Seleccione una provincia</option>
                          {provinces.map((province) => (
                            <option key={province.id} value={province.id}>
                              {province.name}
                            </option>
                          ))}
                        </select>
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
                            province_id: "",
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
              <div className="bg-white border border-gray-200 rounded-[14px] p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">
                  Método de pago
                </h2>
                {errors.payment_method && (
                  <p className="text-red-500 text-sm mb-4">{errors.payment_method}</p>
                )}
                <div className="space-y-2 md:space-y-3">
                  <label
                    className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 border rounded-lg cursor-pointer transition-colors ${
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
                        // Don't automatically set payOnDelivery to false
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
                    <span className="font-medium text-gray-900 text-sm md:text-base">Tarjeta</span>
                    {paymentMethod === "card" && (
                      <Check className="w-5 h-5 text-[#00C1A7] ml-auto" />
                    )}
                  </label>
                  <label
                    className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 border rounded-lg cursor-pointer transition-colors ${
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
                      <span className="font-medium text-gray-900 text-sm md:text-base">Efectivo</span>
                      <p className="text-xs text-gray-500 mt-0.5">Abonás al recibir</p>
                    </div>
                    {paymentMethod === "cash" && (
                      <Check className="w-5 h-5 text-[#00C1A7] ml-auto" />
                    )}
                  </label>
                  <label
                    className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 border rounded-lg cursor-pointer transition-colors ${
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
                      <span className="font-medium text-gray-900 text-sm md:text-base">Transferencia</span>
                      <p className="text-xs text-gray-500 mt-0.5">Abonás al recibir</p>
                    </div>
                    {paymentMethod === "transfer" && (
                      <Check className="w-5 h-5 text-[#00C1A7] ml-auto" />
                    )}
                  </label>
                  {/* Billetera Bausing - Solo como método de pago si el saldo cubre el total */}
                  {canPayWithWallet ? (
                    <label
                      className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 border rounded-lg cursor-pointer transition-colors ${
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
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-900 text-sm md:text-base">Billetera Bausing</span>
                        {walletLoading ? (
                          <p className="text-xs text-gray-500 mt-0.5">Cargando saldo...</p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            Saldo: ${walletBalance.toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        )}
                      </div>
                      {paymentMethod === "wallet" && (
                        <Check className="w-5 h-5 text-[#00C1A7] ml-auto flex-shrink-0" />
                      )}
                    </label>
                  ) : walletBalance > 0 && (
                    <div className="p-3 md:p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <label className="flex items-start md:items-center gap-3 cursor-pointer">
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
                          className="w-4 h-4 mt-0.5 md:mt-0 rounded border-gray-300 text-[#00C1A7] focus:ring-[#00C1A7]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-gray-600 flex-shrink-0" />
                            <span className="font-medium text-gray-900 text-sm md:text-base">
                              Aplicar saldo de Billetera
                            </span>
                          </div>
                          {walletLoading ? (
                            <p className="text-xs text-gray-500 mt-1">Cargando saldo...</p>
                          ) : (
                            <p className="text-xs text-gray-500 mt-1">
                              Aplicar ${walletBalance.toLocaleString("es-AR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}. Restante: ${remainingAfterWallet.toLocaleString("es-AR", {
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

                {/* Pay on delivery option for card */}
                {paymentMethod === "card" && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={payOnDelivery}
                        onChange={(e) => {
                          setPayOnDelivery(e.target.checked);
                          // Clear card data and errors when enabling pay on delivery
                          if (e.target.checked) {
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
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-[#00C1A7] focus:ring-[#00C1A7]"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Pagar al recibir</span>
                        <p className="text-sm text-gray-500">
                          Pagas con tarjeta cuando recibas tu pedido
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* Card payment fields */}
                {paymentMethod === "card" && !payOnDelivery && (
                  <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200 space-y-3 md:space-y-4">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
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

                {/* Pay on delivery option for cash and transfer */}
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
                          Pagas cuando recibas tu pedido
                        </p>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1 order-1 lg:order-2">
              <div className="bg-white border border-gray-200 rounded-[14px] p-4 md:p-6 lg:sticky lg:top-8">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">
                  Resumen del pedido
                </h2>
                <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                  {cart.map((item) => {
                    const unitPrice = getItemUnitPrice(item);
                    const totalPrice = getItemPrice(item);
                    return (
                      <div key={item.id} className="flex gap-2 md:gap-3 pb-3 md:pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs md:text-sm font-medium text-gray-900 truncate mb-1">
                            {item.name}
                          </p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-gray-500">Precio unitario:</span>
                              <span className="text-xs font-medium text-gray-700">
                                {formatPrice(unitPrice)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-gray-500">Cantidad:</span>
                              <div className="flex items-center gap-1.5 md:gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                  className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                                  title="Disminuir cantidad"
                                >
                                  <Minus className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                </button>
                                <span className="text-xs md:text-sm font-medium text-gray-900 min-w-[1.5rem] md:min-w-[2rem] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                  className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                                  title="Aumentar cantidad"
                                >
                                  <Plus className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                              <span className="text-xs md:text-sm font-semibold text-gray-700">Subtotal:</span>
                              <span className="text-xs md:text-sm font-bold text-gray-900">
                                {formatPrice(totalPrice)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors self-start"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Subtotal</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatPrice(subtotal)}
                    </span>
                  </div>

                  {/* Wallet Discount */}
                  {useWalletBalance && walletDiscount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-700">Descuento Billetera</span>
                      <span className="text-sm font-semibold text-green-600">
                        -{formatPrice(walletDiscount)}
                      </span>
                    </div>
                  )}

                  {/* Shipping */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Envío</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {shippingCost > 0 ? (
                        formatPrice(shippingCost)
                      ) : (
                        <span className="text-gray-400 text-xs">Calculado al finalizar</span>
                      )}
                    </span>
                  </div>

                  {/* Total */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-base md:text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-lg md:text-xl font-bold text-gray-900">
                        {formatPrice(finalTotal)}
                      </span>
                    </div>
                    {useWalletBalance && walletDiscount > 0 && remainingAfterWallet > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Se aplicará {formatPrice(walletDiscount)} de tu billetera. Restante a pagar: {formatPrice(remainingAfterWallet)}
                      </p>
                    )}
                    {useWalletBalance && walletDiscount > 0 && remainingAfterWallet === 0 && (
                      <p className="text-xs text-green-600 mt-2 font-medium">
                        ✓ El total será cubierto con tu billetera
                      </p>
                    )}
                  </div>
                </div>
                {errors.submit && (
                  <p className="text-red-500 text-xs md:text-sm mt-3 md:mt-4">{errors.submit}</p>
                )}
                {!isAuthenticated && (
                  <p className="text-blue-600 text-xs md:text-sm mt-3 md:mt-4 text-center">
                    Inicia sesión o crea una cuenta para finalizar la compra
                  </p>
                )}
                {needsEmailVerification && (
                  <p className="text-amber-600 text-xs md:text-sm mt-3 md:mt-4 text-center">
                    Verifica tu email para poder finalizar la compra
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting || needsEmailVerification || !isAuthenticated}
                  className="w-full mt-4 md:mt-6 bg-[#00C1A7] text-white py-2.5 md:py-3 px-4 md:px-6 rounded-lg font-semibold text-sm md:text-base hover:bg-[#00A892] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                      Procesando...
                    </>
                  ) : !isAuthenticated ? (
                    "Inicia sesión para continuar"
                  ) : needsEmailVerification ? (
                    "Verifica tu email para continuar"
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

