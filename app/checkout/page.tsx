"use client";

import { useEffect, useState, useRef } from "react";
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
  getSaleTypes,
  createOrder,
  type Address,
  type Product,
  type DocType,
  type Province,
  type SaleType,
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
import MercadoPagoCardForm from "@/components/MercadoPagoCardForm";

type PaymentMethodType = "card" | "cash" | "transfer" | "wallet";

export default function CheckoutPage() {
  const { user, isAuthenticated, register, login, updateUser } = useAuth();
  const { cart, removeFromCart, updateCartQuantity } = useCart();
  const { locality } = useLocality();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false); // Bandera para indicar que se completó una orden exitosamente
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [productsWithPrices, setProductsWithPrices] = useState<Record<string, Product>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [docTypes, setDocTypes] = useState<DocType[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [saleTypes, setSaleTypes] = useState<SaleType[]>([]);
  const [loadingDocTypes, setLoadingDocTypes] = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingSaleTypes, setLoadingSaleTypes] = useState(false);
  const [crmSaleTypeId, setCrmSaleTypeId] = useState<number>(1); // Default: Consumidor Final
  
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

  // Multi-payment support: allow combining multiple payment methods
  const [enableMultiPayment, setEnableMultiPayment] = useState(false);
  const [selectedMethods, setSelectedMethods] = useState<PaymentMethodType[]>([]);
  const [methodAmounts, setMethodAmounts] = useState<Record<string, number>>({});
  const [payOnDelivery, setPayOnDelivery] = useState(false);
  const [cardData, setCardData] = useState({
    number: "",
    cvv: "",
    expiry: "",
    holder_name: "",
    holder_dni: "",
  });
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletIsBlocked, setWalletIsBlocked] = useState<boolean>(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mpToken, setMpToken] = useState<string | null>(null);
  const [mpInstallments, setMpInstallments] = useState<number>(0); // Inicializar en 0 para detectar si se seleccionaron cuotas
  const [mpPaymentMethodId, setMpPaymentMethodId] = useState<string>("");
  const [mpIssuerId, setMpIssuerId] = useState<number | undefined>(undefined);
  const [mpCardholderData, setMpCardholderData] = useState<{
    name?: string;
    email?: string;
    identificationType?: string;
    identificationNumber?: string;
  } | null>(null);
  const [mpProcessing, setMpProcessing] = useState(false);
  const [mpReady, setMpReady] = useState(false);
  const [mpHasErrors, setMpHasErrors] = useState(false); // Para detectar si el brick tiene errores
  const mpProcessPaymentRef = useRef<(() => Promise<void>) | null>(null);
  const tokenPromiseRef = useRef<{ resolve: (token: string) => void; reject: (error: Error) => void } | null>(null);
  // Ref para guardar temporalmente los datos del token cuando se obtiene de la promesa
  const mpTokenDataRef = useRef<{
    token: string;
    installments: number;
    paymentMethodId: string;
    issuerId?: number;
    cardholderData?: {
      name?: string;
      email?: string;
      identificationType?: string;
      identificationNumber?: string;
    } | null;
  } | null>(null);

  // Resetear estado de MercadoPago cuando cambia el método de pago o se desactiva "abonar al recibir"
  useEffect(() => {
    // Si no hay tarjeta seleccionada o es "abonar al recibir", resetear el estado de MercadoPago
    if (!selectedMethods.includes("card") || payOnDelivery) {
      setMpToken(null);
      setMpInstallments(0);
      setMpPaymentMethodId("");
      setMpIssuerId(undefined);
      setMpCardholderData(null);
      setMpProcessing(false);
      setMpHasErrors(false);
      // Limpiar errores relacionados con MercadoPago
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.submit;
        return newErrors;
      });
    }
  }, [selectedMethods, payOnDelivery]);

  // Check cart and initialize
  useEffect(() => {
    // No redirigir si estamos en proceso de submit (para evitar redirección después de limpiar carrito)
    if (submitting) {
      return;
    }
    
    // No redirigir si acabamos de completar una orden exitosamente
    if (orderCompleted) {
      return;
    }
    
    // No redirigir si estamos en la página de éxito
    if (typeof window !== 'undefined' && window.location.pathname.includes('/checkout/success')) {
      return;
    }
    
    // No redirigir si hay errores (el usuario necesita corregirlos)
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    // No redirigir si estamos procesando el pago de MercadoPago
    if (mpProcessing) {
      return;
    }
    
    // Solo redirigir al catálogo si el carrito está vacío Y no hay ninguna operación en curso
    if (cart.length === 0 && !submitting && !orderCompleted && !mpProcessing) {
      // Pequeño delay para evitar redirecciones durante transiciones de estado
      const timer = setTimeout(() => {
        if (cart.length === 0 && !submitting && !orderCompleted && !mpProcessing) {
          router.replace("/");
        }
      }, 1000);
      
      return () => clearTimeout(timer);
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

  // Load sale types - ahora se cargan siempre ya que el campo aparece siempre
  useEffect(() => {
    const loadSaleTypes = async () => {
      setLoadingSaleTypes(true);
      try {
        const data = await getSaleTypes();
        setSaleTypes(data);
        // Default to Consumidor Final (crm_sale_type_id = 1)
        const consumidorFinal = data.find(st => st.crm_sale_type_id === 1);
        if (consumidorFinal) {
          setCrmSaleTypeId(1);
        }
      } catch (error) {
        console.error("Error loading sale types:", error);
      } finally {
        setLoadingSaleTypes(false);
      }
    };
    loadSaleTypes();
  }, []); // Cargar una sola vez al montar el componente

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
      setWalletIsBlocked(balanceData.is_blocked || false);
      // Si la wallet está bloqueada, desactivar el uso de billetera
      if (balanceData.is_blocked) {
        // Remover wallet de los métodos seleccionados
        setSelectedMethods(prev => prev.filter(m => m !== "wallet"));
        setMethodAmounts(prev => {
          const { wallet: _, ...rest } = prev;
          return rest;
        });
      }
    } catch (error) {
      console.error("Error loading wallet balance:", error);
    } finally {
      setWalletLoading(false);
    }
  };

  // Función para validar formato de CUIT/CUIL
  const validateCuitCuil = (documentNumber: string): boolean => {
    // Remover espacios y guiones para validar
    const cleaned = documentNumber.replace(/[\s-]/g, '');
    
    // Debe tener exactamente 11 dígitos
    if (!/^\d{11}$/.test(cleaned)) {
      return false;
    }
    
    // Si tiene guiones, debe tener el formato correcto: XX-XXXXXXXX-X
    if (documentNumber.includes('-')) {
      const parts = documentNumber.split('-');
      if (parts.length !== 3) {
        return false;
      }
      if (parts[0].length !== 2 || parts[1].length !== 8 || parts[2].length !== 1) {
        return false;
      }
      // Verificar que todas las partes sean numéricas
      return /^\d+$/.test(parts[0]) && /^\d+$/.test(parts[1]) && /^\d+$/.test(parts[2]);
    }
    
    return true;
  };

  // Función para verificar si un tipo de documento es CUIT o CUIL
  const isCuitOrCuil = (documentTypeId: string): boolean => {
    if (!documentTypeId) return false;
    const docType = docTypes.find(dt => dt.id === documentTypeId);
    if (!docType) return false;
    const name = docType.name.toLowerCase();
    return name.includes('cuit') || name.includes('cuil');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    
    // Validación en tiempo real para CUIT/CUIL
    if (field === "dni" && value.trim() && isCuitOrCuil(formData.document_type)) {
      if (!validateCuitCuil(value.trim())) {
        setErrors((prev) => ({ ...prev, dni: "El CUIT/CUIL debe tener formato XX-XXXXXXXX-X o 11 dígitos" }));
      } else {
        setErrors((prev) => ({ ...prev, dni: "" }));
      }
    }
    
    // Si cambia el tipo de documento, validar el DNI actual si es CUIT/CUIL
    if (field === "document_type" && formData.dni.trim()) {
      if (isCuitOrCuil(value)) {
        if (!validateCuitCuil(formData.dni.trim())) {
          setErrors((prev) => ({ ...prev, dni: "El CUIT/CUIL debe tener formato XX-XXXXXXXX-X o 11 dígitos" }));
        } else {
          setErrors((prev) => ({ ...prev, dni: "" }));
        }
      } else {
        // Si cambia a un tipo que no es CUIT/CUIL, limpiar el error de formato
        if (errors.dni && errors.dni.includes("CUIT/CUIL")) {
          setErrors((prev) => ({ ...prev, dni: "" }));
        }
      }
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
    } else {
      // Validar formato si es CUIT o CUIL
      if (isCuitOrCuil(formData.document_type)) {
        if (!validateCuitCuil(formData.dni.trim())) {
          newErrors.dni = "El CUIT/CUIL debe tener formato XX-XXXXXXXX-X o 11 dígitos";
        }
      }
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
    // Debe haber al menos un método de pago seleccionado
    if (selectedMethods.length === 0) {
      newErrors.payment_method = "Debes seleccionar al menos un método de pago";
    }
    // Si multi-payment está desactivado, solo permitir un método
    if (!enableMultiPayment && selectedMethods.length > 1) {
      newErrors.payment_method = "Solo puedes seleccionar un método de pago. Activa 'Combinar métodos' para usar múltiples métodos.";
    }
    // Validar que los montos sumen el total cuando hay múltiples métodos
    if (enableMultiPayment && selectedMethods.length > 1) {
      const totalPago = selectedMethods.reduce((sum, m) => sum + (methodAmounts[m] || 0), 0);
      const diff = Math.abs(totalPago - subtotal);
      if (diff > 0.01) {
        newErrors.payment_method = `La suma de los montos ($${totalPago.toFixed(2)}) no coincide con el total ($${subtotal.toFixed(2)})`;
      }
      // Validar que cada método tenga un monto >= $1
      for (const m of selectedMethods) {
        if (!methodAmounts[m] || methodAmounts[m] < 1) {
          newErrors.payment_method = `Cada método de pago debe tener al menos $1 asignado`;
          break;
        }
      }
    }
    // Validar wallet no exceda saldo
    if (selectedMethods.includes("wallet") && (methodAmounts["wallet"] || 0) > walletBalance) {
      newErrors.payment_method = "El monto de billetera excede tu saldo disponible";
    }

    // No validar campos de tarjeta si es pago con MercadoPago (card sin payOnDelivery)
    // Los campos de tarjeta ya no se usan, se redirige a MercadoPago

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
    
    // Limpiar errores previos y resetear estados de bloqueo
    setErrors({});
    setMpHasErrors(false); // Permitir que el usuario vuelva a intentar después de un error
    
    // Validar formulario antes de continuar
    if (!validateForm()) {
      // validateForm ya establece los errores, solo retornar
      return;
    }

    // Variables para almacenar los datos finales del token de MercadoPago
    // Se usarán los datos del ref si acabamos de obtener el token (disponibles inmediatamente)
    // o los datos del estado si ya estaban disponibles
    let finalToken = mpToken;
    let finalInstallments = mpInstallments;
    let finalPaymentMethodId = mpPaymentMethodId;
    let finalIssuerId = mpIssuerId;
    let finalCardholderData = mpCardholderData;
    let tokenObtained = false;

    // Si es pago con tarjeta sin "abonar al recibir", verificar que el brick esté completamente lleno
    if (hasCardPayment && !payOnDelivery) {
      // Verificar que el brick esté listo antes de continuar
      if (!mpReady) {
        setErrors({ submit: "Por favor, espera a que se cargue el formulario de pago" });
        return;
      }
      
      // Verificar que tengamos la función para procesar el pago
      if (!mpProcessPaymentRef.current) {
        setErrors({ submit: "El formulario de pago no está disponible. Por favor, recarga la página." });
        return;
      }
      
      // Si no tenemos el token, intentar procesar el pago del brick para obtenerlo
      // El brick validará que todos los datos estén completos antes de generar el token
      if (!mpToken && mpProcessPaymentRef.current) {
        try {
          setMpProcessing(true);
          // No mostrar error mientras se está procesando el token
          
          // Crear una promesa para esperar el token
          const tokenPromise = new Promise<string>((resolve, reject) => {
            tokenPromiseRef.current = { resolve, reject };
            // Timeout reducido a 5 segundos para detectar errores más rápido
            setTimeout(() => {
              if (tokenPromiseRef.current) {
                tokenPromiseRef.current.reject(new Error("Tiempo de espera agotado. Por favor, verifica que todos los datos de la tarjeta estén completos (número, fecha, CVV, titular y cuotas)"));
                tokenPromiseRef.current = null;
              }
            }, 5000);
          });
          
          // Disparar el submit del Brick para obtener el token
          await mpProcessPaymentRef.current();
          
          // Esperar a que el token esté disponible
          const token = await tokenPromise;
          
          // El token ya se estableció en el estado en onPaymentSuccess
          // Marcar que obtuvimos el token para continuar automáticamente
          tokenObtained = true;
          setMpProcessing(false);
          
          // Continuar automáticamente con el procesamiento de la orden
          // No retornar aquí, dejar que el código continúe
        } catch (error: any) {
          tokenPromiseRef.current = null;
          const errorMessage = error?.message || "Error al procesar la tarjeta";
          console.error("[Checkout] ❌ Error al procesar pago:", errorMessage);
          setErrors({ submit: errorMessage });
          setMpHasErrors(true);
          setMpProcessing(false);
          setSubmitting(false);
          return;
        }
      }
      
      // Verificación final: asegurarse de que tengamos el token después de procesar
      // Si acabamos de obtener el token, no verificar el estado (puede no haberse actualizado aún)
      // Si no acabamos de obtener el token, verificar el estado normalmente
      if (!tokenObtained && !mpToken) {
        if (mpProcessing) {
          // Si se está procesando, esperar un momento más (máximo 1 segundo adicional)
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (!mpToken) {
            const errorMsg = "No se pudo validar la tarjeta. Por favor, verifica que todos los datos estén completos:\n• Número de tarjeta\n• Fecha de vencimiento\n• CVV\n• Nombre del titular\n• Cuotas seleccionadas";
            setErrors({ submit: errorMsg });
            setMpHasErrors(true);
            setMpProcessing(false);
            setSubmitting(false);
            return;
          }
        } else {
          // Si no se está procesando y no hay token, significa que el brick rechazó el pago
          // El error ya debería estar en el estado, pero por si acaso mostramos uno genérico
          const errorMsg = "Por favor, completa correctamente todos los datos de la tarjeta:\n• Número de tarjeta\n• Fecha de vencimiento\n• CVV\n• Nombre del titular\n• Cuotas seleccionadas";
          setErrors({ submit: errorMsg });
          setMpHasErrors(true);
          setSubmitting(false);
          return;
        }
      }
      
      // Verificar que tengamos todos los datos necesarios (el token solo se genera si todo está completo)
      // Si acabamos de obtener el token, usar los datos del ref (que están disponibles inmediatamente)
      // en lugar del estado (que puede no haberse actualizado aún)
      if (tokenObtained && mpTokenDataRef.current) {
        // Usar los datos del ref que están disponibles inmediatamente
        finalToken = mpTokenDataRef.current.token;
        finalInstallments = mpTokenDataRef.current.installments;
        finalPaymentMethodId = mpTokenDataRef.current.paymentMethodId;
        finalIssuerId = mpTokenDataRef.current.issuerId;
        finalCardholderData = mpTokenDataRef.current.cardholderData || null;
      }
      
      if (!finalInstallments || finalInstallments <= 0) {
        setErrors({ submit: "Por favor, selecciona una opción de cuotas para continuar" });
        setSubmitting(false);
        return;
      }
      
      if (!finalPaymentMethodId || finalPaymentMethodId.trim() === "") {
        setErrors({ submit: "Por favor, completa correctamente todos los datos de la tarjeta" });
        setSubmitting(false);
        return;
      }
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

      // Prepare address data
      const addressData = showAddressForm
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
        : selectedAddress!; // We know it's not undefined because of the check above

      // Detectar localidad por IP (igual que al entrar a la página)
      // El backend siempre retornará una localidad (incluso si es el fallback 39acf5ca-28d1-4300-b009-07c675c45073)
      let crmZoneId: number | undefined = undefined;
      try {
        const localityResponse = await fetch("/api/detect-locality", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        if (localityResponse.ok) {
          const localityData = await localityResponse.json();
          console.log("[Checkout] Respuesta de detect-locality:", JSON.stringify(localityData, null, 2));
          
          if (localityData.success && localityData.data) {
            // El backend siempre debería retornar crm_zone_id (incluso si es del fallback)
            if (localityData.data.crm_zone_id) {
              crmZoneId = localityData.data.crm_zone_id;
              console.log("[Checkout] Zona de entrega detectada por IP:", crmZoneId);
            } else {
              console.warn("[Checkout] La respuesta no incluye crm_zone_id, intentando obtener del localStorage");
              // Si no hay crm_zone_id en la respuesta, intentar obtener del localStorage
              try {
                const savedLocality = localStorage.getItem("bausing_locality");
                if (savedLocality) {
                  const parsedLocality = JSON.parse(savedLocality);
                  if (parsedLocality.crm_zone_id) {
                    crmZoneId = parsedLocality.crm_zone_id;
                    console.log("[Checkout] Zona de entrega obtenida del localStorage:", crmZoneId);
                  }
                }
              } catch (localStorageError) {
                console.error("Error al obtener zona de entrega del localStorage:", localStorageError);
              }
            }
          }
        } else {
          console.error("[Checkout] Error en respuesta de detect-locality:", localityResponse.status, localityResponse.statusText);
          // Fallback: intentar obtener del localStorage
          try {
            const savedLocality = localStorage.getItem("bausing_locality");
            if (savedLocality) {
              const parsedLocality = JSON.parse(savedLocality);
              if (parsedLocality.crm_zone_id) {
                crmZoneId = parsedLocality.crm_zone_id;
                console.log("[Checkout] Zona de entrega obtenida del localStorage (fallback):", crmZoneId);
              }
            }
          } catch (localStorageError) {
            console.error("Error al obtener zona de entrega del localStorage:", localStorageError);
          }
        }
      } catch (error) {
        console.error("[Checkout] Error al detectar localidad por IP:", error);
        // Fallback: intentar obtener del localStorage
        try {
          const savedLocality = localStorage.getItem("bausing_locality");
          if (savedLocality) {
            const parsedLocality = JSON.parse(savedLocality);
            if (parsedLocality.crm_zone_id) {
              crmZoneId = parsedLocality.crm_zone_id;
              console.log("[Checkout] Zona de entrega obtenida del localStorage (error fallback):", crmZoneId);
            }
          }
        } catch (localStorageError) {
          console.error("Error al obtener zona de entrega del localStorage:", localStorageError);
        }
      }
      
      if (!crmZoneId) {
        console.warn("[Checkout] ⚠️ No se pudo obtener crm_zone_id. El backend debería usar el fallback automáticamente.");
      }

      // Log de datos del cardholder antes de enviar
      if (hasCardPayment && !payOnDelivery && mpCardholderData) {
        console.log("[Checkout] 📤 Enviando datos del cardholder al backend:", mpCardholderData);
      } else if (hasCardPayment && !payOnDelivery) {
        console.log("[Checkout] ⚠️ No hay datos del cardholder disponibles");
      }

      // Build payment_methods array for multi-payment support
      const paymentMethodsArray = selectedMethods.map(method => {
        const amount = isMultiPayment ? (methodAmounts[method] || 0) : subtotal;
        let processed = false;
        if (method === "wallet") processed = true;
        else if (method === "card" && !payOnDelivery) processed = true;
        // cash/transfer are not processed (pay on delivery)
        
        // Map to CRM medios_pago_id
        let mediosPagoId = 1;
        if (method === "card") mediosPagoId = 2;
        else if (method === "wallet") mediosPagoId = 3;
        else if (method === "transfer") mediosPagoId = 4;
        // cash = 1

        return {
          method,
          amount,
          processed,
          medios_pago_id: mediosPagoId,
        };
      });

      // Determine primary payment method (for backward compat)
      const primaryMethod = selectedMethods[0] || "card";
      const walletAmount = paymentMethodsArray.find(p => p.method === "wallet")?.amount || 0;

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
        address: addressData,
        payment_method: primaryMethod,
        pay_on_delivery: payOnDelivery,
        crm_sale_type_id: crmSaleTypeId,
        ...(crmZoneId && {
          crm_zone_id: crmZoneId,
        }),
        total: subtotal, // Total completo (antes de descuentos)
        // Multi-payment: enviar array de métodos de pago con montos
        payment_methods: paymentMethodsArray,
        // Wallet amount for backward compat
        ...(walletAmount > 0 && {
          use_wallet_balance: true,
          wallet_amount: walletAmount,
        }),
        // Si es pago con tarjeta sin "abonar al recibir", incluir token de MercadoPago
        ...(hasCardPayment && !payOnDelivery && finalToken && {
          mercadopago_token: finalToken,
          mercadopago_installments: finalInstallments,
          mercadopago_payment_method_id: finalPaymentMethodId,
          ...(finalIssuerId && { mercadopago_issuer_id: finalIssuerId }),
          ...(finalCardholderData && {
            mercadopago_cardholder_name: finalCardholderData.name,
            mercadopago_cardholder_email: finalCardholderData.email,
            mercadopago_cardholder_identification_type: finalCardholderData.identificationType,
            mercadopago_cardholder_identification_number: finalCardholderData.identificationNumber,
          }),
        }),
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          price: getItemUnitPrice(item),
        })),
        observations: "",
      };

      // Verificación final: Si es pago con tarjeta sin "abonar al recibir", verificar que tengamos todos los datos necesarios
      if (hasCardPayment && !payOnDelivery) {
        if (!finalToken) {
          setErrors({ submit: "Por favor, completa correctamente todos los datos de la tarjeta antes de continuar" });
          setSubmitting(false);
          return;
        }
        if (!finalInstallments || finalInstallments <= 0) {
          setErrors({ submit: "Por favor, selecciona una opción de cuotas para continuar" });
          setSubmitting(false);
          return;
        }
        if (!finalPaymentMethodId) {
          setErrors({ submit: "Por favor, completa correctamente todos los datos de la tarjeta" });
          setSubmitting(false);
          return;
        }
      }

      // Limpiar el ref después de usarlo para evitar problemas en futuros intentos
      if (tokenObtained) {
        mpTokenDataRef.current = null;
      }

      // Send order to backend
      console.log("[Checkout] Enviando orden con datos:", JSON.stringify(orderData, null, 2));
      let orderResponse;
      try {
        orderResponse = await createOrder(orderData);
        console.log("[Checkout] Respuesta completa del backend:", JSON.stringify(orderResponse, null, 2));
        
        // Verificar si el pago está pendiente (in_process o pending_contingency)
        if ((orderResponse as any)?.pending || (orderResponse as any)?.payment_status === 'in_process' || (orderResponse as any)?.status_detail === 'pending_contingency') {
          console.log("[Checkout] ✅ Orden creada exitosamente. El pago está siendo procesado por MercadoPago.");
          console.log("[Checkout] ⚠️ El webhook notificará cuando el pago sea aprobado o rechazado.");
        }
      } catch (orderError: any) {
        // Si hay un error al crear la orden, lanzarlo para que se maneje en el catch principal
        console.error("[Checkout] Error al crear orden:", orderError);
        throw orderError;
      }

      // La respuesta del backend es { success: True, data: { id: ... }, message: ... }
      // Pero createOrder retorna data.data || data, así que orderResponse ya es el objeto data
      // IMPORTANTE: Usar solo 'id' que es el UUID de la orden, NO usar 'payment_id' que es el ID de MercadoPago
      let orderId = orderResponse?.id || (orderResponse as any)?.data?.id || null;
      
      // Validar que orderId sea un UUID válido (no un número como payment_id)
      if (orderId && !orderId.toString().match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.error("[Checkout] ⚠️ ADVERTENCIA: orderId no parece ser un UUID válido:", orderId);
        console.error("[Checkout] ⚠️ Si es un número, podría ser payment_id de MercadoPago en lugar del UUID de la orden");
        // Intentar obtener el id correcto del objeto completo
        const fullResponse = (orderResponse as any)?.data || orderResponse;
        if (fullResponse?.id && fullResponse.id.toString().match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          console.log("[Checkout] ✅ Corrigiendo orderId usando fullResponse.id:", fullResponse.id);
          orderId = fullResponse.id;
        } else {
          // Si aún no es válido, buscar en la respuesta completa
          console.error("[Checkout] ⚠️ No se pudo encontrar un UUID válido en la respuesta");
          console.error("[Checkout] Respuesta completa:", JSON.stringify(orderResponse, null, 2));
        }
      }
      
      console.log("[Checkout] Order response completo:", JSON.stringify(orderResponse, null, 2));
      console.log("[Checkout] Order ID extraído:", orderId);
      console.log("[Checkout] Payment ID (solo referencia, NO usar para acceder a orden):", (orderResponse as any)?.payment_id);
      
      // Solo redirigir si la orden se creó exitosamente
      if (!orderId) {
        throw new Error("No se pudo obtener el ID de la orden. Por favor, intenta nuevamente.");
      }
      
      // Marcar que se completó la orden exitosamente (antes de redirigir)
      setOrderCompleted(true);
      
      // Redirigir a la página de éxito
      // IMPORTANTE: Redirigir ANTES de limpiar el carrito para evitar que el useEffect redirija al inicio
      console.log("[Checkout] Redirigiendo a página de éxito con order_id:", orderId);
      router.push(`/checkout/success?order_id=${orderId}`);
      
      // Clear cart AFTER redirecting (use setTimeout to ensure redirect happens first)
      setTimeout(() => {
        cart.forEach((item) => removeFromCart(item.id));
      }, 100);
    } catch (error: any) {
      console.error("[Checkout] Error al procesar el pedido:", error);
      console.error("[Checkout] Error completo:", JSON.stringify(error, null, 2));
      
      // Detectar error específico de tipo de documento incompatible con tipo de venta
      let errorMessage = error?.message || "Error al procesar el pedido";
      
      if (errorMessage.includes("Tipo de documento DNI no es compatible con tipo de venta mayor a 1") ||
          errorMessage.includes("Tipo de documento DNI no es compatible")) {
        errorMessage = "Para este tipo de venta debes usar CUIT o CUIL en lugar de DNI. Por favor, cambia el tipo de documento en el formulario.";
      }
      
      // Detectar error de precio de compra / stock
      if (errorMessage.includes("No se pudo obtener el precio de compra") ||
          errorMessage.includes("compras previas registradas") ||
          errorMessage.includes("este artículo no tiene stock")) {
        errorMessage = "Lo sentimos, pero este artículo no tiene stock.";
      }
      
      // Detectar errores de pago rechazado (pero no tratar in_process como error)
      if (errorMessage.includes("rejected") || (errorMessage.includes("El pago fue") && !errorMessage.includes("in_process") && !errorMessage.includes("pending_contingency"))) {
        errorMessage = "El pago fue rechazado. Por favor, verifica los datos de tu tarjeta o intenta con otra tarjeta.";
      }
      
      // Si el pago está en proceso (pending_contingency), no es un error
      if (errorMessage.includes("in_process") || errorMessage.includes("pending_contingency")) {
        // El backend debería retornar success: true con pending: true, pero por si acaso
        console.log("[Checkout] ⚠️ Pago en proceso, no es un error. El webhook notificará cuando se apruebe o rechace.");
      }
      
      setErrors({ submit: errorMessage });
      setMpProcessing(false);
      // NO redirigir cuando hay un error - mantener al usuario en la página de checkout
      // NO limpiar el carrito cuando hay un error
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
  const canPayWithWallet = walletBalance >= totalAmount && !walletIsBlocked;
  const shippingCost = 0; // TODO: Calculate shipping cost
  const subtotal = calculateTotal();

  // Multi-payment derived values
  const isMultiPayment = enableMultiPayment && selectedMethods.length > 1;
  const hasCardPayment = selectedMethods.includes("card");
  const hasWalletPayment = selectedMethods.includes("wallet");
  const getMethodAmount = (method: PaymentMethodType): number => methodAmounts[method] || 0;
  const cardPaymentAmount = getMethodAmount("card");
  const walletPaymentAmount = hasWalletPayment ? Math.min(getMethodAmount("wallet"), walletBalance) : 0;
  const totalAssigned = selectedMethods.reduce((sum, m) => sum + getMethodAmount(m), 0);
  const remainingToAssign = Math.max(0, subtotal - totalAssigned);
  // Backward compat aliases
  const walletDiscount = walletPaymentAmount;
  const remainingAfterWallet = Math.max(0, subtotal - walletPaymentAmount);
  const finalTotal = Math.max(0, subtotal - walletDiscount + shippingCost);

  // Auto-fill amount when single method or when multi-payment is disabled
  useEffect(() => {
    if (!enableMultiPayment && selectedMethods.length === 1) {
      const method = selectedMethods[0];
      const maxAmount = method === "wallet" ? Math.min(walletBalance, subtotal) : subtotal;
      setMethodAmounts({ [method]: maxAmount });
    } else if (enableMultiPayment && selectedMethods.length > 1) {
      // Auto-distribute when enabling multi-payment
      const currentTotal = selectedMethods.reduce((sum, m) => sum + (methodAmounts[m] || 0), 0);
      if (currentTotal === 0 || Math.abs(currentTotal - subtotal) > 0.01) {
        // Distribuir proporcionalmente, asegurando mínimo $1 por método
        const minPerMethod = 1;
        const totalMin = selectedMethods.length * minPerMethod;
        
        // Si el subtotal es menor que el mínimo total, ajustar
        if (subtotal < totalMin) {
          // Si no alcanza para $1 por método, distribuir equitativamente
          selectedMethods.forEach(m => {
            setMethodAmounts(prev => ({ ...prev, [m]: subtotal / selectedMethods.length }));
          });
        } else {
          // Distribuir con mínimo $1 por método
          const distribution: Record<string, number> = {};
          const availableForDistribution = subtotal - totalMin;
          
          selectedMethods.forEach(m => {
            // Asignar mínimo $1
            distribution[m] = minPerMethod;
          });
          
          // Distribuir el resto proporcionalmente
          if (availableForDistribution > 0) {
            selectedMethods.forEach(m => {
              const maxForMethod = m === "wallet" ? walletBalance : subtotal;
              const additional = availableForDistribution / selectedMethods.length;
              distribution[m] = Math.min(distribution[m] + additional, maxForMethod);
            });
            
            // Ajustar para que sume exactamente el subtotal
            const total = Object.values(distribution).reduce((sum, v) => sum + v, 0);
            if (total > 0 && Math.abs(total - subtotal) > 0.01) {
              const factor = subtotal / total;
              Object.keys(distribution).forEach(m => {
                distribution[m] = Math.max(minPerMethod, distribution[m] * factor);
                if (m === "wallet") {
                  distribution[m] = Math.min(distribution[m], walletBalance);
                }
              });
            }
          }
          
          setMethodAmounts(distribution);
        }
      }
    }
  }, [enableMultiPayment, selectedMethods.length, subtotal, walletBalance]);

  // Helper: toggle a payment method
  const togglePaymentMethod = (method: PaymentMethodType) => {
    setSelectedMethods(prev => {
      if (prev.includes(method)) {
        // Remove method
        const next = prev.filter(m => m !== method);
        setMethodAmounts(a => {
          const { [method]: _, ...rest } = a;
          // Si queda solo un método, asignarle el total completo
          if (next.length === 1 && !enableMultiPayment) {
            const remainingMethod = next[0];
            const maxAmount = remainingMethod === "wallet" ? Math.min(walletBalance, subtotal) : subtotal;
            return { [remainingMethod]: maxAmount };
          }
          return rest;
        });
        if (method === "card") setPayOnDelivery(false);
        // Clear MP state when removing card
        if (method === "card") {
          setMpToken(null);
          setMpInstallments(0);
          setMpPaymentMethodId("");
          setMpIssuerId(undefined);
          setMpCardholderData(null);
        }
        return next;
      } else {
        // Add method
        if (!enableMultiPayment && prev.length > 0) {
          // Si multi-payment está desactivado, reemplazar el método anterior
          const oldMethod = prev[0];
          setMethodAmounts({});
          if (oldMethod === "card") {
            setPayOnDelivery(false);
            setMpToken(null);
            setMpInstallments(0);
            setMpPaymentMethodId("");
            setMpIssuerId(undefined);
            setMpCardholderData(null);
          }
          const maxAmount = method === "wallet" ? Math.min(walletBalance, subtotal) : subtotal;
          setMethodAmounts({ [method]: maxAmount });
          return [method];
        }
        const next = [...prev, method];
        const minPerMethod = enableMultiPayment && next.length > 1 ? 1 : 0;
        // Pre-fill wallet with min(walletBalance, remaining)
        if (method === "wallet") {
          const otherTotal = next.filter(m => m !== "wallet").reduce((s, m) => s + (methodAmounts[m] || 0), 0);
          const walletDefault = Math.max(minPerMethod, Math.min(walletBalance, Math.max(0, subtotal - otherTotal)));
          setMethodAmounts(a => ({ ...a, wallet: walletDefault }));
        } else if (enableMultiPayment) {
          // Auto-distribute when adding a new method in multi-payment mode
          const currentTotal = next.reduce((sum, m) => sum + (methodAmounts[m] || 0), 0);
          const remaining = subtotal - currentTotal;
          
          // Asegurar que el nuevo método tenga al menos $1
          const newMethodAmount = Math.max(minPerMethod, remaining);
          setMethodAmounts(prev => {
            const updated = { ...prev, [method]: newMethodAmount };
            // Ajustar otros métodos si es necesario para mantener mínimo $1
            if (remaining < minPerMethod) {
              const excess = minPerMethod - remaining;
              const otherMethods = next.filter(m => m !== method);
              const otherTotal = otherMethods.reduce((sum, m) => sum + Math.max(0, (updated[m] || 0) - minPerMethod), 0);
              if (otherTotal > 0) {
                otherMethods.forEach(m => {
                  const current = updated[m] || 0;
                  const reducible = current - minPerMethod;
                  if (reducible > 0) {
                    const proportion = reducible / otherTotal;
                    updated[m] = Math.max(minPerMethod, current - excess * proportion);
                  }
                });
              }
            }
            // Asegurar que todos tengan al menos $1
            next.forEach(m => {
              if ((updated[m] || 0) < minPerMethod) {
                updated[m] = minPerMethod;
              }
            });
            return updated;
          });
        }
        return next;
      }
    });
    // Clear payment method errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.payment_method;
      return newErrors;
    });
  };

  // Helper: update amount for a method with auto-completion
  const updateMethodAmount = (method: PaymentMethodType, value: string) => {
    const numValue = parseFloat(value) || 0;
    const minPerMethod = enableMultiPayment && selectedMethods.length > 1 ? 1 : 0;
    const maxValue = method === "wallet" ? Math.min(numValue, walletBalance) : numValue;
    
    setMethodAmounts(prev => {
      const updated = { ...prev, [method]: maxValue };
      
      // Auto-complete: distribuir el resto entre los otros métodos
      if (enableMultiPayment && selectedMethods.length > 1) {
        const otherMethods = selectedMethods.filter(m => m !== method);
        const currentTotal = otherMethods.reduce((sum, m) => sum + (updated[m] || 0), 0) + maxValue;
        const remaining = subtotal - currentTotal;
        
        // Asegurar que el método actual tenga al menos $1 si hay otros métodos
        if (maxValue < minPerMethod && otherMethods.length > 0) {
          updated[method] = minPerMethod;
          const newRemaining = subtotal - (otherMethods.reduce((sum, m) => sum + (updated[m] || 0), 0) + minPerMethod);
          // Redistribuir el resto
          if (newRemaining > 0.01 && otherMethods.length > 0) {
            const otherTotal = otherMethods.reduce((sum, m) => {
              const maxForMethod = m === "wallet" ? walletBalance : subtotal;
              return sum + Math.max(0, maxForMethod - Math.max(minPerMethod, updated[m] || 0));
            }, 0);
            
            if (otherTotal > 0) {
              otherMethods.forEach(m => {
                const maxForMethod = m === "wallet" ? walletBalance : subtotal;
                const available = Math.max(0, maxForMethod - Math.max(minPerMethod, updated[m] || 0));
                if (available > 0) {
                  const proportion = available / otherTotal;
                  updated[m] = Math.max(minPerMethod, (updated[m] || 0) + newRemaining * proportion);
                  if (m === "wallet") {
                    updated[m] = Math.min(updated[m], walletBalance);
                  } else {
                    updated[m] = Math.min(updated[m], subtotal);
                  }
                } else {
                  updated[m] = Math.max(minPerMethod, updated[m] || 0);
                }
              });
            }
          }
        } else if (remaining > 0.01 && otherMethods.length > 0) {
          // Distribuir el resto proporcionalmente entre los otros métodos
          const otherTotal = otherMethods.reduce((sum, m) => {
            const maxForMethod = m === "wallet" ? walletBalance : subtotal;
            return sum + Math.max(0, maxForMethod - Math.max(minPerMethod, updated[m] || 0));
          }, 0);
          
          if (otherTotal > 0) {
            otherMethods.forEach(m => {
              const maxForMethod = m === "wallet" ? walletBalance : subtotal;
              const available = Math.max(0, maxForMethod - Math.max(minPerMethod, updated[m] || 0));
              if (available > 0) {
                const proportion = available / otherTotal;
                updated[m] = Math.max(minPerMethod, (updated[m] || 0) + remaining * proportion);
                // Asegurar que no exceda el máximo
                if (m === "wallet") {
                  updated[m] = Math.min(updated[m], walletBalance);
                } else {
                  updated[m] = Math.min(updated[m], subtotal);
                }
              } else {
                updated[m] = Math.max(minPerMethod, updated[m] || 0);
              }
            });
          }
        } else if (remaining < -0.01) {
          // Si excede, reducir proporcionalmente los otros métodos, pero mantener mínimo $1
          const excess = Math.abs(remaining);
          const otherTotal = otherMethods.reduce((sum, m) => sum + Math.max(0, (updated[m] || 0) - minPerMethod), 0);
          
          if (otherTotal > 0) {
            otherMethods.forEach(m => {
              const current = updated[m] || 0;
              const reducible = current - minPerMethod;
              if (reducible > 0) {
                const proportion = reducible / otherTotal;
                updated[m] = Math.max(minPerMethod, current - excess * proportion);
              } else {
                updated[m] = Math.max(minPerMethod, current);
              }
            });
          }
        }
        
        // Asegurar que todos los métodos tengan al menos $1
        selectedMethods.forEach(m => {
          if ((updated[m] || 0) < minPerMethod) {
            updated[m] = minPerMethod;
          }
        });
      }
      
      return updated;
    });
  };

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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900"
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
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900 pr-10"
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
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900"
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
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900"
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900"
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900"
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
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900 pr-10"
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
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900 pr-10"
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
                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900 ${
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
                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900 ${
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
                        className="px-4 py-2.5 border-r border-gray-300 bg-white focus:outline-none text-gray-900 text-sm min-w-[140px]"
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
                        className="flex-1 px-4 py-2.5 border-0 focus:outline-none text-gray-900 placeholder:text-gray-400"
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
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900 ${
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
                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900 ${
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Tipo de Venta - ahora aparece siempre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Venta <span className="text-red-500">*</span>
                    </label>
                    {loadingSaleTypes ? (
                      <div className="text-sm text-gray-500 py-2.5">Cargando tipos de venta...</div>
                    ) : (
                      <select
                        value={crmSaleTypeId}
                        onChange={(e) => setCrmSaleTypeId(Number(e.target.value))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900 bg-white"
                        required
                      >
                        {saleTypes.map((st) => (
                          <option key={st.id} value={st.crm_sale_type_id}>
                            {st.description || st.code || `Tipo ${st.crm_sale_type_id}`}
                          </option>
                        ))}
                      </select>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {crmSaleTypeId === 4 
                        ? "Para Responsable Inscripto, el documento debe tener formato CUIT (XX-XXXXXXXX-X)"
                        : crmSaleTypeId === 1
                        ? "Consumidor Final"
                        : ""}
                    </p>
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

              {/* Payment Method - Multi-payment support */}
              <div className="bg-white border border-gray-200 rounded-[14px] p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                    Medios de pago
                  </h2>
                </div>
                
                {/* Switch para combinar métodos */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">Combinar métodos de pago</span>
                        {enableMultiPayment && (
                          <span className="text-xs bg-[#00C1A7]/10 text-[#00C1A7] px-2 py-0.5 rounded-full font-medium">
                            Activo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600">
                        {enableMultiPayment 
                          ? "Podés seleccionar múltiples métodos y distribuir el monto entre ellos"
                          : "Activa esta opción para usar más de un método de pago en tu compra"}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={enableMultiPayment}
                        onChange={(e) => {
                          setEnableMultiPayment(e.target.checked);
                          if (!e.target.checked && selectedMethods.length > 1) {
                            // Si se desactiva, dejar solo el primer método
                            const firstMethod = selectedMethods[0];
                            setSelectedMethods([firstMethod]);
                            const maxAmount = firstMethod === "wallet" ? Math.min(walletBalance, subtotal) : subtotal;
                            setMethodAmounts({ [firstMethod]: maxAmount });
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#00C1A7] peer-focus:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00C1A7]"></div>
                    </label>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mb-4 md:mb-6">
                  {enableMultiPayment 
                    ? "Seleccioná los métodos que querés usar y especificá el monto para cada uno"
                    : "Seleccioná un método de pago"}
                </p>
                {errors.payment_method && (
                  <p className="text-red-500 text-sm mb-4">{errors.payment_method}</p>
                )}
                <div className="space-y-2 md:space-y-3">
                  {/* Tarjeta */}
                  <div
                    className={`border rounded-lg transition-colors ${
                      selectedMethods.includes("card")
                        ? "border-[#00C1A7] bg-[#00C1A7]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <label className="flex items-center gap-3 md:gap-4 p-3 md:p-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMethods.includes("card")}
                        onChange={() => togglePaymentMethod("card")}
                        className="w-4 h-4 rounded border-gray-300 text-[#00C1A7] focus:ring-[#00C1A7]"
                      />
                      <CreditCard className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-900 text-sm md:text-base flex-1">Tarjeta</span>
                      {selectedMethods.includes("card") && (
                        <Check className="w-5 h-5 text-[#00C1A7] flex-shrink-0" />
                      )}
                    </label>
                    {selectedMethods.includes("card") && isMultiPayment && (
                      <div className="px-3 md:px-4 pb-3 md:pb-4">
                        <label className="text-xs text-gray-500 mb-1 block">Monto con tarjeta</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                          <input
                            type="number"
                            min={isMultiPayment ? 1 : 0}
                            step="0.01"
                            max={subtotal}
                            value={methodAmounts["card"] || ""}
                            onChange={(e) => updateMethodAmount("card", e.target.value)}
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-[#00C1A7] focus:border-[#00C1A7] placeholder:text-gray-400"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Efectivo */}
                  <div
                    className={`border rounded-lg transition-colors ${
                      selectedMethods.includes("cash")
                        ? "border-[#00C1A7] bg-[#00C1A7]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <label className="flex items-center gap-3 md:gap-4 p-3 md:p-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMethods.includes("cash")}
                        onChange={() => togglePaymentMethod("cash")}
                        className="w-4 h-4 rounded border-gray-300 text-[#00C1A7] focus:ring-[#00C1A7]"
                      />
                      <Wallet className="w-5 h-5 text-gray-600" />
                      <div className="flex-1">
                        <span className="font-medium text-gray-900 text-sm md:text-base">Efectivo</span>
                        <p className="text-xs text-gray-500 mt-0.5">Abonás al recibir</p>
                      </div>
                      {selectedMethods.includes("cash") && (
                        <Check className="w-5 h-5 text-[#00C1A7] flex-shrink-0" />
                      )}
                    </label>
                    {selectedMethods.includes("cash") && isMultiPayment && (
                      <div className="px-3 md:px-4 pb-3 md:pb-4">
                        <label className="text-xs text-gray-500 mb-1 block">Monto en efectivo</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                          <input
                            type="number"
                            min={isMultiPayment ? 1 : 0}
                            step="0.01"
                            max={subtotal}
                            value={methodAmounts["cash"] || ""}
                            onChange={(e) => updateMethodAmount("cash", e.target.value)}
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-[#00C1A7] focus:border-[#00C1A7] placeholder:text-gray-400"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Transferencia */}
                  <div
                    className={`border rounded-lg transition-colors ${
                      selectedMethods.includes("transfer")
                        ? "border-[#00C1A7] bg-[#00C1A7]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <label className="flex items-center gap-3 md:gap-4 p-3 md:p-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMethods.includes("transfer")}
                        onChange={() => togglePaymentMethod("transfer")}
                        className="w-4 h-4 rounded border-gray-300 text-[#00C1A7] focus:ring-[#00C1A7]"
                      />
                      <ArrowRightLeft className="w-5 h-5 text-gray-600" />
                      <div className="flex-1">
                        <span className="font-medium text-gray-900 text-sm md:text-base">Transferencia</span>
                        <p className="text-xs text-gray-500 mt-0.5">Abonás al recibir</p>
                      </div>
                      {selectedMethods.includes("transfer") && (
                        <Check className="w-5 h-5 text-[#00C1A7] flex-shrink-0" />
                      )}
                    </label>
                    {selectedMethods.includes("transfer") && isMultiPayment && (
                      <div className="px-3 md:px-4 pb-3 md:pb-4">
                        <label className="text-xs text-gray-500 mb-1 block">Monto con transferencia</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                          <input
                            type="number"
                            min={isMultiPayment ? 1 : 0}
                            step="0.01"
                            max={subtotal}
                            value={methodAmounts["transfer"] || ""}
                            onChange={(e) => updateMethodAmount("transfer", e.target.value)}
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-[#00C1A7] focus:border-[#00C1A7] placeholder:text-gray-400"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Billetera Bausing */}
                  {walletBalance > 0 && !walletIsBlocked && (
                    <div
                      className={`border rounded-lg transition-colors ${
                        selectedMethods.includes("wallet")
                          ? "border-[#00C1A7] bg-[#00C1A7]/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <label className="flex items-center gap-3 md:gap-4 p-3 md:p-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedMethods.includes("wallet")}
                          onChange={() => togglePaymentMethod("wallet")}
                          className="w-4 h-4 rounded border-gray-300 text-[#00C1A7] focus:ring-[#00C1A7]"
                        />
                        <Wallet className="w-5 h-5 text-gray-600" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-900 text-sm md:text-base">Billetera Bausing</span>
                          {walletLoading ? (
                            <p className="text-xs text-gray-500 mt-0.5">Cargando saldo...</p>
                          ) : (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              Saldo disponible: {formatPrice(walletBalance)}
                            </p>
                          )}
                        </div>
                        {selectedMethods.includes("wallet") && (
                          <Check className="w-5 h-5 text-[#00C1A7] flex-shrink-0" />
                        )}
                      </label>
                      {selectedMethods.includes("wallet") && isMultiPayment && (
                        <div className="px-3 md:px-4 pb-3 md:pb-4">
                          <label className="text-xs text-gray-500 mb-1 block">Monto desde billetera (máx: {formatPrice(walletBalance)})</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                            <input
                              type="number"
                            min={isMultiPayment ? 1 : 0}
                            step="0.01"
                            max={walletBalance}
                              value={methodAmounts["wallet"] || ""}
                              onChange={(e) => updateMethodAmount("wallet", e.target.value)}
                              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-[#00C1A7] focus:border-[#00C1A7] placeholder:text-gray-400"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Multi-payment summary */}
                {isMultiPayment && (
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Total asignado:</span>
                      <span className={`font-semibold ${Math.abs(totalAssigned - subtotal) < 0.01 ? 'text-green-600' : 'text-amber-600'}`}>
                        {formatPrice(totalAssigned)} / {formatPrice(subtotal)}
                      </span>
                    </div>
                    {remainingToAssign > 0.01 && (
                      <p className="text-xs text-amber-600 mt-1">
                        Falta asignar {formatPrice(remainingToAssign)} para cubrir el total
                      </p>
                    )}
                    {totalAssigned > subtotal + 0.01 && (
                      <p className="text-xs text-red-600 mt-1">
                        El monto asignado excede el total en {formatPrice(totalAssigned - subtotal)}
                      </p>
                    )}
                    {Math.abs(totalAssigned - subtotal) <= 0.01 && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ El total está cubierto correctamente
                      </p>
                    )}
                  </div>
                )}

                {/* Pay on delivery option for card */}
                {hasCardPayment && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={payOnDelivery}
                        onChange={(e) => {
                          setPayOnDelivery(e.target.checked);
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
                        <span className="font-medium text-gray-900">Abonar al recibir</span>
                        <p className="text-sm text-gray-500">
                          Pagas con tarjeta cuando recibas tu pedido (no se procesa el pago ahora)
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* MercadoPago Card Form */}
                {hasCardPayment && !payOnDelivery && (
                  <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200">
                    <MercadoPagoCardForm
                      publicKey="TEST-851528f1-2389-49c8-8d2c-0d809b869bc0"
                      amount={isMultiPayment ? cardPaymentAmount : subtotal}
                      onPaymentSuccess={(token, installments, paymentMethodId, issuerId, cardholderData) => {
                        console.log("[Checkout] ✅ Token obtenido, estableciendo estado...");
                        setMpToken(token);
                        setMpInstallments(installments);
                        setMpPaymentMethodId(paymentMethodId);
                        setMpIssuerId(issuerId);
                        setMpCardholderData(cardholderData || null);
                        setMpProcessing(false);
                        setMpHasErrors(false);
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.submit;
                          return newErrors;
                        });
                        mpTokenDataRef.current = {
                          token,
                          installments,
                          paymentMethodId,
                          issuerId,
                          cardholderData: cardholderData || null,
                        };
                        if (tokenPromiseRef.current) {
                          tokenPromiseRef.current.resolve(token);
                          tokenPromiseRef.current = null;
                        }
                      }}
                      onPaymentError={(error) => {
                        console.error("[Checkout] ❌ Error en el pago de MercadoPago:", error);
                        setErrors({ submit: error });
                        setMpProcessing(false);
                        setMpHasErrors(true);
                        setMpToken(null);
                        setMpInstallments(0);
                        setMpPaymentMethodId("");
                        setMpIssuerId(undefined);
                        setMpCardholderData(null);
                        if (tokenPromiseRef.current) {
                          tokenPromiseRef.current.reject(new Error(error));
                          tokenPromiseRef.current = null;
                        }
                      }}
                      onReady={() => {
                        setMpReady(true);
                        setMpHasErrors(false);
                      }}
                      processPayment={mpProcessPaymentRef as any}
                      payerEmail={formData.email}
                      payerName={`${formData.first_name} ${formData.last_name}`}
                      payerDni={formData.dni}
                    />
                    {mpToken && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">
                          ✓ Tarjeta validada correctamente. Puedes proceder con el pago.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Pay on delivery info for cash and transfer */}
                {(selectedMethods.includes("cash") || selectedMethods.includes("transfer")) && !hasCardPayment && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-[#00C1A7]" />
                      <div>
                        <span className="font-medium text-gray-900">Pagar al recibir</span>
                        <p className="text-sm text-gray-500">
                          Pagas cuando recibas tu pedido
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botón Finalizar compra: solo en responsive (móvil/tablet), al final del formulario */}
                <div className="lg:hidden mt-6 pt-6 border-t border-gray-200">
                  {!isAuthenticated && (
                    <p className="text-blue-600 text-xs md:text-sm mb-3 text-center">
                      Inicia sesión o crea una cuenta para finalizar la compra
                    </p>
                  )}
                  {needsEmailVerification && (
                    <p className="text-amber-600 text-xs md:text-sm mb-3 text-center">
                      Verifica tu email para poder finalizar la compra
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      needsEmailVerification ||
                      !isAuthenticated ||
                      mpProcessing ||
                      (hasCardPayment && !payOnDelivery && !mpReady)
                    }
                    className="w-full bg-[#00C1A7] text-white py-3 px-6 rounded-lg font-semibold text-base hover:bg-[#00A892] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting || mpProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {mpProcessing ? "Procesando tarjeta..." : "Procesando..."}
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
                  {hasWalletPayment && walletDiscount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-700">Billetera Bausing</span>
                      <span className="text-sm font-semibold text-green-600">
                        -{formatPrice(walletDiscount)}
                      </span>
                    </div>
                  )}

                  {/* Multi-payment breakdown */}
                  {isMultiPayment && selectedMethods.filter(m => m !== "wallet").length > 0 && (
                    <div className="space-y-1 pt-1">
                      {selectedMethods.filter(m => m !== "wallet").map(method => (
                        <div key={method} className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-500">
                            {method === "card" ? "Tarjeta" : method === "cash" ? "Efectivo" : "Transferencia"}
                          </span>
                          <span className="text-xs font-semibold text-gray-600">
                            {formatPrice(methodAmounts[method] || 0)}
                          </span>
                        </div>
                      ))}
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
                    {hasWalletPayment && walletDiscount > 0 && remainingAfterWallet > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Se aplicará {formatPrice(walletDiscount)} de tu billetera. Restante a pagar: {formatPrice(remainingAfterWallet)}
                      </p>
                    )}
                    {hasWalletPayment && walletDiscount > 0 && remainingAfterWallet === 0 && (
                      <p className="text-xs text-green-600 mt-2 font-medium">
                        ✓ El total será cubierto con tu billetera
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Mostrar todos los errores de validación visibles */}
                {(() => {
                  // Solo mostrar errores que realmente tienen un mensaje
                  const visibleErrors = [
                    errors.first_name,
                    errors.last_name,
                    errors.document_type,
                    errors.dni,
                    errors.phone,
                    errors.email,
                    errors.address,
                    errors.address_full_name,
                    errors.address_phone,
                    errors.address_street,
                    errors.address_number,
                    errors.address_postal_code,
                    errors.address_city,
                    errors.address_province,
                    errors.payment_method,
                    errors.card_number,
                    errors.card_cvv,
                    errors.card_expiry,
                    errors.card_holder_name,
                    errors.card_holder_dni,
                    errors.submit,
                  ].filter(Boolean);
                  
                  return visibleErrors.length > 0 ? (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h3 className="text-sm font-semibold text-red-800 mb-2">Por favor, corrige los siguientes errores:</h3>
                      <ul className="space-y-1 text-sm text-red-700">
                        {errors.first_name && <li>• {errors.first_name}</li>}
                        {errors.last_name && <li>• {errors.last_name}</li>}
                        {errors.document_type && <li>• {errors.document_type}</li>}
                        {errors.dni && <li>• {errors.dni}</li>}
                        {errors.phone && <li>• {errors.phone}</li>}
                        {errors.email && <li>• {errors.email}</li>}
                        {errors.address && <li>• {errors.address}</li>}
                        {errors.address_full_name && <li>• {errors.address_full_name}</li>}
                        {errors.address_phone && <li>• {errors.address_phone}</li>}
                        {errors.address_street && <li>• {errors.address_street}</li>}
                        {errors.address_number && <li>• {errors.address_number}</li>}
                        {errors.address_postal_code && <li>• {errors.address_postal_code}</li>}
                        {errors.address_city && <li>• {errors.address_city}</li>}
                        {errors.address_province && <li>• {errors.address_province}</li>}
                        {errors.payment_method && <li>• {errors.payment_method}</li>}
                        {errors.card_number && <li>• {errors.card_number}</li>}
                        {errors.card_cvv && <li>• {errors.card_cvv}</li>}
                        {errors.card_expiry && <li>• {errors.card_expiry}</li>}
                        {errors.card_holder_name && <li>• {errors.card_holder_name}</li>}
                        {errors.card_holder_dni && <li>• {errors.card_holder_dni}</li>}
                        {errors.submit && <li>• {errors.submit}</li>}
                      </ul>
                    </div>
                  ) : null;
                })()}
                
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
                {/* Botón Finalizar compra: solo en desktop (lg+) */}
                <button
                  type="submit"
                  disabled={
                    submitting || 
                    needsEmailVerification || 
                    !isAuthenticated || 
                    mpProcessing || 
                    (hasCardPayment && !payOnDelivery && !mpReady)
                  }
                  className="hidden lg:flex w-full mt-4 md:mt-6 bg-[#00C1A7] text-white py-2.5 md:py-3 px-4 md:px-6 rounded-lg font-semibold text-sm md:text-base hover:bg-[#00A892] transition-colors disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center gap-2"
                >
                  {submitting || mpProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                      {mpProcessing ? "Procesando tarjeta..." : "Procesando..."}
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

