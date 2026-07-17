"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useLocality } from "@/contexts/LocalityContext";
import {
  getUserAddresses,
  createUserAddress,
  updateUserAddress,
  getUserWalletBalance,
  fetchProductsPrices,
  getDocTypes,
  getProvinces,
  createOrder,
  previewCouponCheckout,
  fetchCardTypes,
  fetchCardBankData,
  formatEstimatedDelivery,
  type Address,
  type Product,
  type DocType,
  type Province,
  type CardType,
  type CardBankData,
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
  AlertCircle,
} from "lucide-react";
import {
  formatPrice,
  calculateProductPrice,
  checkoutPaymentPriceKind,
  productFromCheckoutPricesApi,
} from "@/utils/priceUtils";
import {
  buildCardPaymentDetailsPayload,
  buildCardPaymentObservations,
  calculateInstallmentAmounts,
  computePayableWithInstallmentSurcharge,
  formatInstallmentCuotasLabel,
  formatInstallmentCuotasSelectedLabel,
  installmentOptionKey,
  parseInstallmentOptionKey,
  paymentMethodAmountWithInstallment,
  sortInstallmentOptions,
} from "@/lib/cardPaymentObservations";
import {
  CRM_MEDIOS_PAGO_BILLETERA,
  crmMediosPagoIdForCheckoutMethod,
} from "@/lib/crmPaymentMethods";
import { postalCodeDigitsOnly } from "@/utils/postalCodeInput";

type PaymentMethodType = "card" | "cash" | "transfer" | "wallet";

/** Tipo de venta CRM por defecto en checkout web (Consumidor Final). */
const DEFAULT_CRM_SALE_TYPE_ID = 1;

/**
 * CP para Vía Cargo / Busplus: 4 dígitos clásicos, o los 4 centrales del CPA (X1234ABC).
 * Más de 4 dígitos seguidos sin formato CPA → se toman los primeros 4 (evita "10001" → inválido en Busplus).
 */
function normalizeArPostalCode(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const s = raw.trim().toUpperCase().replace(/\s/g, "");
  const cpa = /^([A-Z])?([0-9]{4})([A-Z]{3})?$/.exec(s);
  if (cpa?.[2]) {
    return cpa[2];
  }
  const d = raw.replace(/\D/g, "");
  if (d.length < 4) return null;
  if (d.length > 4) return d.slice(0, 4);
  return d;
}

export default function CheckoutPage() {
  const { user, isAuthenticated } = useAuth();
  const { cart, removeFromCart, updateCartQuantity } = useCart();
  const { locality, selectAddress, isLoading: localityLoading, error: localityError } = useLocality();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false); // Bandera para indicar que se completó una orden exitosamente
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [savingCheckoutAddress, setSavingCheckoutAddress] = useState(false);
  const saveAddressInFlightRef = useRef(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [productsWithPrices, setProductsWithPrices] = useState<Record<string, Product>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [docTypes, setDocTypes] = useState<DocType[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loadingDocTypes, setLoadingDocTypes] = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [viacargoQuoteTotal, setViacargoQuoteTotal] = useState<number | null>(null);
  const [viacargoQuoteError, setViacargoQuoteError] = useState<string | null>(null);
  const [viacargoCotizarLoading, setViacargoCotizarLoading] = useState(false);


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
  // Siempre se abona al recibir
  const [payOnDelivery] = useState(true);
  const [cardData, setCardData] = useState({
    number: "",
    cvv: "",
    expiry: "",
    holder_name: "",
    holder_dni: "",
  });
  // Estados para selección de tarjeta y banco
  const [selectedCardType, setSelectedCardType] = useState<string>("");
  const [selectedBank, setSelectedBank] = useState<string>("");
  /** Clave "cuotas:recargo" de la opción de financiación elegida */
  const [selectedInstallmentKey, setSelectedInstallmentKey] = useState<string>("");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletIsBlocked, setWalletIsBlocked] = useState<boolean>(false);
  const [walletLoading, setWalletLoading] = useState(false);
  /** Saldo como descuento (switch); no es un “método de pago” combinable */
  const [useWalletCredit, setUseWalletCredit] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPaisCatalog, setIsPaisCatalog] = useState<boolean>(false);
  const PAIS_CATALOG_ID = "8335e521-f25a-4f92-8f59-c4439671ef26";
  const [estimatedDeliveryDaysMin, setEstimatedDeliveryDaysMin] = useState<number | null>(null);
  const [estimatedDeliveryDaysMax, setEstimatedDeliveryDaysMax] = useState<number | null>(null);
  const [referralCode, setReferralCode] = useState<string>("");
  const [referralCodeValidating, setReferralCodeValidating] = useState<boolean>(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    clubBeneficiosOnly: boolean;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [cardTypes, setCardTypes] = useState<CardType[]>([]);
  const [cardBankData, setCardBankData] = useState<CardBankData>({});
  const [loadingCardData, setLoadingCardData] = useState(false);
  const [isThirdPartyTransport, setIsThirdPartyTransport] = useState<boolean>(false);
  const [configuredShippingPrice, setConfiguredShippingPrice] = useState<number | null>(null);
  const [shippingLocalityError, setShippingLocalityError] = useState(false);
  const [shippingQuoteLoading, setShippingQuoteLoading] = useState(false);
  /** Evita duplicar fetch para la misma localidad + dirección de envío */
  const lastShippingContextKeyRef = useRef<string | null>(null);
  /** Invalida respuestas de detect-locality / precios si el usuario cambió de dirección */
  const localityRequestIdRef = useRef(0);
  const priceLoadSeqRef = useRef(0);
  const shippingCheckSeqRef = useRef(0);
  const selectedAddressIdRef = useRef<string | null>(null);
  const lastAddressIdRef = useRef<string | null>(null);
  const isDetectingLocalityRef = useRef(false);
  /** true mientras syncLocalityForAddress carga precios/envío (evita carrera con useEffect de precios) */
  const addressSyncInProgressRef = useRef(false);
  /** Ref síncrono para bloquear doble submit antes del re-render */
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    setAppliedCoupon(null);
    setCouponError("");
  }, [cart]);

  // Resetear selecciones de tarjeta cuando se deselecciona
  useEffect(() => {
    if (!selectedMethods.includes("card")) {
      setSelectedCardType("");
      setSelectedBank("");
      setSelectedInstallmentKey("");
    }
  }, [selectedMethods]);

  useEffect(() => {
    setSelectedInstallmentKey("");
  }, [selectedCardType, selectedBank]);

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
    
    // Solo redirigir al catálogo si el carrito está vacío Y no hay ninguna operación en curso
    if (cart.length === 0 && !submitting && !orderCompleted) {
      // Pequeño delay para evitar redirecciones durante transiciones de estado
      const timer = setTimeout(() => {
        if (cart.length === 0 && !submitting && !orderCompleted) {
          router.replace("/");
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    // Mostrar formulario de dirección cuando no está autenticado (sin direcciones guardadas)
    if (!isAuthenticated) {
      setShowAddressForm(true);
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

  const loadCheckoutProductPrices = useCallback(
    async (localityId: string, requestId: number) => {
      if (cart.length === 0) {
        setProductsWithPrices({});
        setLoadingPrices(false);
        return;
      }

      const loadId = ++priceLoadSeqRef.current;
      setLoadingPrices(true);

      try {
        const productIds = cart.map((item) => item.id);
        const pricesData = await fetchProductsPrices(productIds, localityId);
        if (
          requestId !== localityRequestIdRef.current ||
          loadId !== priceLoadSeqRef.current
        ) {
          return;
        }

        const productsMap: Record<string, Product> = {};
        cart.forEach((item) => {
          const priceData = pricesData[item.id];
          if (priceData) {
            productsMap[item.id] = productFromCheckoutPricesApi(
              item.id,
              item.name,
              priceData,
            );
          }
        });
        setProductsWithPrices(productsMap);
      } catch (error) {
        console.error("Error loading product prices:", error);
        if (
          requestId === localityRequestIdRef.current &&
          loadId === priceLoadSeqRef.current
        ) {
          setProductsWithPrices({});
        }
      } finally {
        if (
          requestId === localityRequestIdRef.current &&
          loadId === priceLoadSeqRef.current
        ) {
          setLoadingPrices(false);
        }
      }
    },
    [cart],
  );

  const refreshCheckoutShipping = useCallback(
    async (
      localityId: string,
      addressId: string | null,
      checkoutRequestId: number,
    ) => {
      const runId = ++shippingCheckSeqRef.current;
      const isCurrentRun = () =>
        runId === shippingCheckSeqRef.current &&
        checkoutRequestId === localityRequestIdRef.current;

      const shippingContextKey = `${localityId}:${addressId ?? ""}`;
      if (lastShippingContextKeyRef.current === shippingContextKey) {
        setShippingQuoteLoading(false);
        return;
      }

      const fetchForContextKey = shippingContextKey;
      lastShippingContextKeyRef.current = shippingContextKey;
      setShippingLocalityError(false);
      setShippingQuoteLoading(true);
      setIsPaisCatalog(false);
      setIsThirdPartyTransport(false);
      setConfiguredShippingPrice(null);
      setViacargoQuoteTotal(null);
      setViacargoQuoteError(null);
      setEstimatedDeliveryDaysMin(null);
      setEstimatedDeliveryDaysMax(null);

      try {
        const savedLocality = localStorage.getItem("bausing_locality");
        let localIsThirdParty = false;

        if (savedLocality) {
          const parsedLocality = JSON.parse(savedLocality);
          if (parsedLocality.id === localityId) {
            if (parsedLocality.is_third_party_transport !== undefined) {
              localIsThirdParty = parsedLocality.is_third_party_transport;
            }
          }
        }

        const detectParams = new URLSearchParams();
        if (addressId) {
          detectParams.set("address_id", addressId);
        }
        const detectQuery = detectParams.toString();
        const detectUrl = detectQuery
          ? `/api/detect-locality?${detectQuery}`
          : "/api/detect-locality";
        const detectHeaders: HeadersInit = { "Content-Type": "application/json" };
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("user_token");
          if (token) {
            detectHeaders["Authorization"] = `Bearer ${token}`;
          }
        }

        // Disparar ambas requests en paralelo: detect-locality ya tiene shipping_price e
        // is_third_party_transport; el catalog check también se necesita y su URL se conoce
        // de antemano (localityId viene como parámetro), así que no hay motivo para esperarlo.
        const catalogFetchPromise = fetch(`/api/localities/${localityId}/catalog`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const detectResponse = await fetch(detectUrl, {
          method: "GET",
          headers: detectHeaders,
        });

        if (detectResponse.ok) {
          const detectData = await detectResponse.json();
          if (!isCurrentRun()) return;

          if (!detectData.success || !detectData.data) {
            setShippingLocalityError(true);
          }

          if (detectData.success && detectData.data) {
            const detectedLid = detectData.data.locality?.id;
            if (detectedLid && detectedLid !== localityId && !addressId) {
              setShippingLocalityError(true);
            }
            if (
              detectData.data.catalog?.id === PAIS_CATALOG_ID ||
              (detectData.data.locality?.id &&
                detectData.data.locality.id === localityId)
            ) {
              // La respuesta ya está en vuelo desde antes — solo await el resultado
              const catalogResponse = await catalogFetchPromise;
              if (!isCurrentRun()) return;

              if (!catalogResponse.ok) {
                setShippingLocalityError(true);
              } else {
                const catalogData = await catalogResponse.json();
                if (!isCurrentRun()) return;
                if (!catalogData.success) {
                  setShippingLocalityError(true);
                }
                if (catalogData.success && catalogData.data?.catalog_id) {
                  setIsPaisCatalog(
                    catalogData.data.catalog_id === PAIS_CATALOG_ID,
                  );
                  setEstimatedDeliveryDaysMin(
                    catalogData.data.estimated_delivery_days_min ?? null,
                  );
                  setEstimatedDeliveryDaysMax(
                    catalogData.data.estimated_delivery_days_max ?? null,
                  );
                }
              }
            }

            if (!isCurrentRun()) return;
            const serverIsThirdParty =
              detectData.data.is_third_party_transport !== undefined
                ? detectData.data.is_third_party_transport
                : localIsThirdParty;
            const serverShippingPrice =
              detectData.data.shipping_price !== undefined &&
              detectData.data.shipping_price !== null
                ? detectData.data.shipping_price
                : null;

            if (detectData.data.is_third_party_transport !== undefined) {
              setIsThirdPartyTransport(serverIsThirdParty);
              setConfiguredShippingPrice(serverShippingPrice);
            }
          }
        } else {
          setShippingLocalityError(true);
        }
      } catch (error) {
        console.error("Error checking pais catalog and third party transport:", error);
        if (!isCurrentRun()) return;
        setIsPaisCatalog(false);
        setIsThirdPartyTransport(false);
        setConfiguredShippingPrice(null);
        setShippingLocalityError(true);
      } finally {
        if (
          fetchForContextKey === lastShippingContextKeyRef.current &&
          isCurrentRun()
        ) {
          setShippingQuoteLoading(false);
        }
      }
    },
    [PAIS_CATALOG_ID],
  );

  // Catálogo/envío cuando cambia localidad sin pasar por sync (p. ej. detección por IP)
  useEffect(() => {
    if (addressSyncInProgressRef.current) return;
    if (!locality?.id) {
      setIsPaisCatalog(false);
      setIsThirdPartyTransport(false);
      setConfiguredShippingPrice(null);
      setShippingLocalityError(false);
      setShippingQuoteLoading(false);
      lastShippingContextKeyRef.current = null;
      return;
    }
    void refreshCheckoutShipping(
      locality.id,
      selectedAddressId,
      localityRequestIdRef.current,
    );
  }, [locality?.id, selectedAddressId, refreshCheckoutShipping]);

  // Precios por carrito / localidad (no durante sync de dirección — ahí carga syncLocalityForAddress)
  useEffect(() => {
    if (addressSyncInProgressRef.current) return;
    const localityId = locality?.id;
    if (cart.length === 0 || !localityId) {
      setProductsWithPrices({});
      setLoadingPrices(false);
      return;
    }
    void loadCheckoutProductPrices(localityId, localityRequestIdRef.current);
  }, [cart, locality?.id, loadCheckoutProductPrices]);

  const syncLocalityForAddress = useCallback(
    async (addressId: string) => {
      if (!addressId || orderCompleted || submitting) return;
      const requestId = ++localityRequestIdRef.current;
      addressSyncInProgressRef.current = true;
      lastShippingContextKeyRef.current = null;
      setShippingLocalityError(false);
      setIsPaisCatalog(false);
      setIsThirdPartyTransport(false);
      setConfiguredShippingPrice(null);
      setViacargoQuoteTotal(null);
      setViacargoQuoteError(null);
      setLoadingPrices(true);

      try {
        const detected = await selectAddress(addressId);
        if (requestId !== localityRequestIdRef.current) return;

        if (!detected?.id) {
          setErrors((prev) => ({
            ...prev,
            address: localityError || "No se pudo detectar la localidad para esta dirección",
          }));
          setProductsWithPrices({});
          setLoadingPrices(false);
          return;
        }

        // Precios y shipping son independientes entre sí — ambos solo necesitan detected.id
        await Promise.all([
          loadCheckoutProductPrices(detected.id, requestId),
          refreshCheckoutShipping(detected.id, addressId, requestId),
        ]);
      } catch (error) {
        console.error("Error al detectar localidad para la dirección:", error);
        if (requestId === localityRequestIdRef.current) {
          setErrors((prev) => ({
            ...prev,
            address: "No se pudo detectar la localidad para esta dirección",
          }));
          setProductsWithPrices({});
          setLoadingPrices(false);
        }
      } finally {
        if (requestId === localityRequestIdRef.current) {
          addressSyncInProgressRef.current = false;
        }
      }
    },
    [
      orderCompleted,
      submitting,
      selectAddress,
      loadCheckoutProductPrices,
      refreshCheckoutShipping,
    ],
  );

  const handleCheckoutAddressSelect = useCallback(
    (addressId: string) => {
      selectedAddressIdRef.current = addressId;
      setSelectedAddressId(addressId);
      void syncLocalityForAddress(addressId);
    },
    [syncLocalityForAddress],
  );

  useEffect(() => {
    selectedAddressIdRef.current = selectedAddressId;
  }, [selectedAddressId]);

  // Load card types and bank data
  useEffect(() => {
    const loadCardData = async () => {
      try {
        setLoadingCardData(true);
        const [cardTypesData, cardBankDataResponse] = await Promise.all([
          fetchCardTypes(true),
          fetchCardBankData(true),
        ]);
        setCardTypes(cardTypesData);
        setCardBankData(cardBankDataResponse);
      } catch (error) {
        console.error("Error loading card data:", error);
        // Si falla, usar datos vacíos (el checkout seguirá funcionando sin cuotas)
        setCardTypes([]);
        setCardBankData({});
      } finally {
        setLoadingCardData(false);
      }
    };

    loadCardData();
  }, []);

  const loadAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const data = await getUserAddresses();
      setAddresses(data);
      if (data.length === 0) {
        // Sin direcciones: mostrar el formulario para agregar una
        setShowAddressForm(true);
      } else {
        const defaultAddress = data.find((addr) => addr.is_default);
        const initialAddressId = defaultAddress?.id ?? data[0].id;
        selectedAddressIdRef.current = initialAddressId;
        setSelectedAddressId(initialAddressId);
        await syncLocalityForAddress(initialAddressId);
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
        setUseWalletCredit(false);
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
    const v = field === "postal_code" ? postalCodeDigitsOnly(value) : value;
    setAddressForm((prev) => ({ ...prev, [field]: v }));
  };

  const emptyAddressForm = () => ({
    street: "",
    number: "",
    postal_code: "",
    additional_info: "",
    full_name: "",
    phone: "",
    city: "",
    province_id: "",
  });

  const closeAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddressId(null);
    setAddressForm(emptyAddressForm());
  };

  const openNewAddressForm = () => {
    setEditingAddressId(null);
    setAddressForm(emptyAddressForm());
    setShowAddressForm(true);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.address;
      delete next.address_full_name;
      delete next.address_phone;
      delete next.address_street;
      delete next.address_number;
      delete next.address_postal_code;
      delete next.address_city;
      delete next.address_province;
      return next;
    });
  };

  const openEditAddressForm = (address: Address) => {
    setEditingAddressId(address.id);
    if (selectedAddressId !== address.id) {
      handleCheckoutAddressSelect(address.id);
    } else {
      setSelectedAddressId(address.id);
    }
    setAddressForm({
      street: address.street,
      number: address.number,
      postal_code: address.postal_code,
      additional_info: address.additional_info || "",
      full_name: address.full_name,
      phone: address.phone,
      city: address.city,
      province_id: address.province_id || "",
    });
    setShowAddressForm(true);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.address;
      delete next.address_full_name;
      delete next.address_phone;
      delete next.address_street;
      delete next.address_number;
      delete next.address_postal_code;
      delete next.address_city;
      delete next.address_province;
      return next;
    });
  };

  const collectAddressFormErrors = (): Record<string, string> => {
    const addressErrors: Record<string, string> = {};
    if (!addressForm.full_name.trim()) {
      addressErrors.address_full_name = "El nombre completo del destinatario es obligatorio";
    }
    if (!addressForm.phone.trim()) {
      addressErrors.address_phone = "El teléfono del destinatario es obligatorio";
    }
    if (!addressForm.street.trim()) {
      addressErrors.address_street = "La calle es obligatoria";
    }
    if (!addressForm.number.trim()) {
      addressErrors.address_number = "El número es obligatorio";
    }
    if (!addressForm.postal_code.trim()) {
      addressErrors.address_postal_code = "El código postal es obligatorio";
    } else if (addressForm.postal_code.length < 4) {
      addressErrors.address_postal_code = "Ingresá al menos 4 dígitos del código postal";
    }
    if (!addressForm.city.trim()) {
      addressErrors.address_city = "La ciudad es obligatoria";
    }
    if (!addressForm.province_id) {
      addressErrors.address_province = "La provincia es obligatoria";
    }
    return addressErrors;
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
      Object.assign(newErrors, collectAddressFormErrors());
    }
    const subtotalValRaw = calculateTotal();
    const subtotalVal = Math.max(
      0,
      subtotalValRaw - (appliedCoupon?.discountAmount ?? 0),
    );
    const walletCreditAppliedVal =
      useWalletCredit &&
      !isThirdPartyTransport &&
      !walletIsBlocked &&
      walletBalance > 0
        ? Math.min(walletBalance, subtotalVal)
        : 0;
    const payableSubtotalVal = Math.max(0, subtotalVal - walletCreditAppliedVal);
    const installmentForValidation = selectedInstallmentKey
      ? parseInstallmentOptionKey(selectedInstallmentKey)
      : null;
    const isMultiForValidation =
      enableMultiPayment && selectedMethods.length > 1;
    const payableTotalVal = computePayableWithInstallmentSurcharge(
      payableSubtotalVal,
      {
        hasCardPayment: selectedMethods.includes("card"),
        cardPaymentAmount: methodAmounts["card"] || 0,
        isMultiPayment: isMultiForValidation,
        installment: installmentForValidation,
      },
    );

    if (payableSubtotalVal > 0.01) {
      if (selectedMethods.length === 0) {
        newErrors.payment_method = "Debes seleccionar al menos un método de pago para el monto a abonar";
      }
      if (!enableMultiPayment && selectedMethods.length > 1) {
        newErrors.payment_method =
          "Solo puedes seleccionar un método de pago. Activa 'Combinar métodos' para usar múltiples métodos.";
      }
      if (enableMultiPayment && selectedMethods.length > 1) {
        const totalPago = selectedMethods.reduce((sum, m) => {
          const base = methodAmounts[m] || 0;
          return (
            sum +
            paymentMethodAmountWithInstallment(m, base, installmentForValidation)
          );
        }, 0);
        const diff = Math.abs(totalPago - payableTotalVal);
        if (diff > 0.01) {
          newErrors.payment_method = `La suma de los montos ($${totalPago.toFixed(2)}) no coincide con lo que falta pagar ($${payableTotalVal.toFixed(2)})`;
        }
        for (const m of selectedMethods) {
          if (!methodAmounts[m] || methodAmounts[m] < 1) {
            newErrors.payment_method = `Cada método de pago debe tener al menos $1 asignado`;
            break;
          }
        }
      }
    }

    if (
      payableSubtotalVal > 0.01 &&
      selectedMethods.includes("card") &&
      Object.keys(cardBankData).length > 0
    ) {
      if (!selectedCardType.trim()) {
        newErrors.card_installment = "Seleccioná el tipo de tarjeta";
      } else if (!selectedBank.trim()) {
        newErrors.card_installment = "Seleccioná el banco";
      } else {
        const bankInstallments = cardBankData[selectedCardType]?.[selectedBank] ?? [];
        if (bankInstallments.length > 0 && !selectedInstallmentKey) {
          newErrors.card_installment = "Seleccioná la cantidad de cuotas";
        }
      }
    }

    if (isPaisCatalog && !isThirdPartyTransport && cart.length > 0) {
      const sel = addresses.find((a) => a.id === selectedAddressId);
      const cpO = normalizeArPostalCode(sel?.postal_code);
      if (locality?.id && !shippingLocalityError && sel && cpO) {
        if (viacargoCotizarLoading) {
          newErrors.address = "Esperá a que termine el cálculo del costo de envío";
        } else if (viacargoQuoteError) {
          newErrors.address = viacargoQuoteError;
        } else if (viacargoQuoteTotal === null) {
          newErrors.address = "No se pudo obtener el costo de envío";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveAddress = async (): Promise<boolean> => {
    if (saveAddressInFlightRef.current) {
      return false;
    }

    const addressFieldErrors = collectAddressFormErrors();
    if (Object.keys(addressFieldErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...addressFieldErrors }));
      return false;
    }

    saveAddressInFlightRef.current = true;
    setSavingCheckoutAddress(true);
    try {
      if (!isAuthenticated) {
        if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          setErrors({ email: "Ingresá un email válido para crear tu cuenta" });
          return false;
        }
        if (!formData.first_name.trim() || !formData.last_name.trim()) {
          setErrors({ first_name: !formData.first_name.trim() ? "El nombre es obligatorio" : "", last_name: !formData.last_name.trim() ? "El apellido es obligatorio" : "" });
          return false;
        }
        const autoRegResponse = await fetch("/api/auth/auto-register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone || undefined,
          }),
        });
        const autoRegResult = await autoRegResponse.json();
        if (!autoRegResponse.ok || !autoRegResult.success) {
          if (autoRegResult.email_exists) {
            setErrors({ email: "Ya tenés una cuenta con este email. Por favor, iniciá sesión desde el menú antes de continuar." });
          } else {
            setErrors({ address: autoRegResult.error || "Error al crear la cuenta" });
          }
          return false;
        }
        const { user: newUser, token: newToken } = autoRegResult.data;
        localStorage.setItem("user_token", newToken);
        localStorage.setItem("user_data", JSON.stringify(newUser));
        window.dispatchEvent(new CustomEvent("authStateChanged", { detail: { user: newUser, token: newToken } }));
      }
      const payload = {
        full_name: addressForm.full_name.trim(),
        phone: addressForm.phone.trim(),
        street: addressForm.street.trim(),
        number: addressForm.number.trim(),
        additional_info: addressForm.additional_info.trim() || undefined,
        postal_code: addressForm.postal_code.trim(),
        city: addressForm.city.trim(),
        province_id: addressForm.province_id,
      };

      let savedAddressId: string;
      if (editingAddressId) {
        const updatedAddress = await updateUserAddress(editingAddressId, payload);
        setAddresses((prev) =>
          prev.map((addr) => (addr.id === editingAddressId ? updatedAddress : addr)),
        );
        savedAddressId = updatedAddress.id;
        setSelectedAddressId(savedAddressId);
      } else {
        const newAddress = await createUserAddress({
          ...payload,
          is_default: addresses.length === 0,
        });
        setAddresses((prev) => [...prev, newAddress]);
        savedAddressId = newAddress.id;
        setSelectedAddressId(savedAddressId);
      }

      closeAddressForm();
      await syncLocalityForAddress(savedAddressId);
      return true;
    } catch (error: any) {
      setErrors({ address: error?.message || "Error al guardar la dirección" });
      return false;
    } finally {
      saveAddressInFlightRef.current = false;
      setSavingCheckoutAddress(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmittingRef.current) return;

    // Limpiar errores previos
    setErrors({});
    
    // Validar formulario antes de continuar
    if (!validateForm()) {
      // validateForm ya establece los errores, solo retornar
      return;
    }

    if (isPaisCatalog && !isThirdPartyTransport) {
      const postalCodeRaw = showAddressForm
        ? addressForm.postal_code
        : addresses.find((addr) => addr.id === selectedAddressId)?.postal_code;
      const cpOk = normalizeArPostalCode(postalCodeRaw);
      if (showAddressForm) {
        setErrors({ address: "Guardá la dirección antes de continuar" });
        return;
      }
      if (!locality?.id || shippingLocalityError || !cpOk) {
        setErrors({ address: "Ingresá un código postal válido en la dirección de envío" });
        return;
      }
      if (viacargoCotizarLoading) {
        setErrors({ address: "Esperá a que termine el cálculo del costo de envío" });
        return;
      }
      if (viacargoQuoteError) {
        setErrors({
          address: viacargoQuoteError,
        });
        return;
      }
      if (viacargoQuoteTotal === null) {
        setErrors({ address: "No se pudo obtener el costo de envío" });
        return;
      }
    }

    isSubmittingRef.current = true;
    setSubmitting(true);
    try {
      // If showing address form, save it first (also handles auto-register if not authenticated)
      if (showAddressForm) {
        const saved = await handleSaveAddress();
        if (!saved) {
          return;
        }
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

      // Leer crm_zone_id y catalogId desde localStorage (ya fue calculado correctamente por LocalityContext)
      let crmZoneId: number | undefined = undefined;
      let catalogId: string | undefined = undefined;
      const PAIS_CATALOG_ID = "8335e521-f25a-4f92-8f59-c4439671ef26";

      try {
        const savedLocality = localStorage.getItem("bausing_locality");
        if (savedLocality) {
          const parsedLocality = JSON.parse(savedLocality);
          if (parsedLocality.crm_zone_id) crmZoneId = parsedLocality.crm_zone_id;
          if (parsedLocality.catalog_id) catalogId = parsedLocality.catalog_id;
        }
      } catch {
        /* non-fatal */
      }

      // Obtener catalogId desde detect-locality si no está en localStorage
      if (!catalogId) {
        try {
          const localityResponse = await fetch("/api/detect-locality", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          if (localityResponse.ok) {
            const localityData = await localityResponse.json();
            if (localityData.success && localityData.data) {
              if (!crmZoneId && localityData.data.crm_zone_id) {
                crmZoneId = localityData.data.crm_zone_id;
              }
              if (localityData.data.catalog?.id) {
                catalogId = localityData.data.catalog.id;
              } else if (localityData.data.locality?.id) {
                try {
                  const catalogResponse = await fetch(`/api/localities/${localityData.data.locality.id}/catalog`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                  });
                  if (catalogResponse.ok) {
                    const catalogData = await catalogResponse.json();
                    if (catalogData.success && catalogData.data?.catalog_id) {
                      catalogId = catalogData.data.catalog_id;
                    }
                  }
                } catch {
                  /* catalog not required for order flow to continue */
                }
              }
            }
          }
        } catch {
          /* non-fatal */
        }
      }
      
      // Si no se obtuvo catalog_id, intentar obtenerlo desde la localidad del contexto
      if (!catalogId && locality?.id) {
        try {
          const catalogResponse = await fetch(`/api/localities/${locality.id}/catalog`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });
          if (catalogResponse.ok) {
            const catalogData = await catalogResponse.json();
            if (catalogData.success && catalogData.data?.catalog_id) {
              catalogId = catalogData.data.catalog_id;
            }
          }
        } catch {
          /* optional catalog for validation branch */
        }
      }
      
      // Verificar si el catálogo activo es "pais" (8335e521-f25a-4f92-8f59-c4439671ef26)
      // O si es transporte tercerizado y se seleccionó tarjeta
      // Si es catálogo Pais, SIEMPRE redirigir a WhatsApp sin crear orden en CRM
      // Si es transporte tercerizado y se seleccionó tarjeta, también redirigir a WhatsApp sin crear orden
      // Usar el estado isPaisCatalog que se actualiza correctamente en el useEffect
      // Este estado es más confiable que catalogId que puede no estar disponible en el momento del submit
      
      // Si es transporte tercerizado y se seleccionó tarjeta, redirigir a WhatsApp sin crear orden
      if (isThirdPartyTransport && selectedMethods.includes("card")) {
        // Obtener número de WhatsApp desde la configuración
        try {
          const whatsappResponse = await fetch("/api/settings/public/phone", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });
          
          if (whatsappResponse.ok) {
            const whatsappData = await whatsappResponse.json();
            if (whatsappData.success && whatsappData.phone) {
              // Limpiar el número de teléfono para WhatsApp (solo números)
              const cleanPhone = whatsappData.phone.replace(/\D/g, "");
              
              // Construir mensaje completo con toda la información de la compra
              const cartItems = cart.map(item => {
                const itemPrice = getItemPrice(item);
                const unitPrice = getItemUnitPrice(item);
                return `• ${item.name} x${item.quantity} - $${itemPrice.toLocaleString('es-AR')} ($${unitPrice.toLocaleString('es-AR')} c/u)`;
              }).join('\n');
              
              const paymentInfo = cardPaymentObservationsText
                ? `\n\n*Método de pago:* Tarjeta (completarás la venta por WhatsApp)\n${cardPaymentObservationsText}`
                : `\n\n*Método de pago:* Tarjeta (completarás la venta por WhatsApp)`;
              
              // Información de dirección
              const addressText = addressData.additional_info 
                ? `${addressData.street} ${addressData.number}, ${addressData.city}, ${addressData.postal_code}${addressData.additional_info ? ` (${addressData.additional_info})` : ''}`
                : `${addressData.street} ${addressData.number}, ${addressData.city}, ${addressData.postal_code}`;
              
              // Obtener nombre de provincia si está disponible
              const provinceName = 'province' in addressData && addressData.province 
                ? addressData.province 
                : addressData.province_id 
                  ? provinces.find(p => p.id === addressData.province_id)?.name || ''
                  : '';
              
              // Construir mensaje completo
              const message = `Hola! Quiero realizar el siguiente pedido:

*PRODUCTOS:*
${cartItems}

*RESUMEN:*
${couponDiscount > 0.01 ? `Subtotal: $${subtotal.toLocaleString('es-AR')}\nDescuento cupón: −$${couponDiscount.toLocaleString('es-AR')}\n` : ""}Subtotal productos: $${subtotalAfterCoupon.toLocaleString('es-AR')}
${shippingCost > 0 ? `Envío: $${shippingCost.toLocaleString('es-AR')}` : 'Envío: Gratis'}
*Total: $${finalTotal.toLocaleString('es-AR')}*${paymentInfo}

*DATOS DEL CLIENTE:*
Nombre: ${formData.first_name} ${formData.last_name}
Teléfono: ${formData.phone}
${formData.alternate_phone ? `Teléfono alternativo: ${formData.alternate_phone}\n` : ''}Email: ${formData.email}
${formData.document_type ? `Tipo de documento: ${docTypes.find(dt => dt.id === formData.document_type)?.name || formData.document_type}\n` : ''}DNI: ${formData.dni}

*DIRECCIÓN DE ENTREGA:*
${addressData.full_name}
${addressData.phone}
${addressText}${provinceName ? `, ${provinceName}` : ''}`;
              
              const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
              
              // Redirigir a WhatsApp - NO crear orden en CRM
              window.location.href = whatsappUrl;
              setSubmitting(false);
              return; // Este return evita que se ejecute el código de creación de orden
            }
          }
        } catch (whatsappError) {
          console.error("Error al obtener número de WhatsApp:", whatsappError);
          setErrors({ submit: "No se pudo obtener el número de WhatsApp. Por favor, intenta nuevamente." });
          setSubmitting(false);
          return;
        }
      }

      // Transporte tercerizado + transferencia → WhatsApp (sin crear orden; si también hay tarjeta, ya se redirigió arriba)
      if (
        isThirdPartyTransport &&
        selectedMethods.includes("transfer") &&
        !selectedMethods.includes("card")
      ) {
        try {
          const whatsappResponse = await fetch("/api/settings/public/phone", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (whatsappResponse.ok) {
            const whatsappData = await whatsappResponse.json();
            if (whatsappData.success && whatsappData.phone) {
              const cleanPhone = whatsappData.phone.replace(/\D/g, "");

              const cartItems = cart
                .map((item) => {
                  const itemPrice = getItemPrice(item);
                  const unitPrice = getItemUnitPrice(item);
                  return `• ${item.name} x${item.quantity} - $${itemPrice.toLocaleString("es-AR")} ($${unitPrice.toLocaleString("es-AR")} c/u)`;
                })
                .join("\n");

              let paymentInfo = "";
              const payLines: string[] = [];
              if (walletCreditApplied > 0.01) {
                payLines.push(
                  `  - Billetera Bausing (descuento): $${walletCreditApplied.toLocaleString("es-AR")}`,
                );
              }
              if (payableSubtotal > 0.01 && selectedMethods.length > 0) {
                selectedMethods.forEach((method) => {
                  const methodName =
                    method === "card"
                      ? "Tarjeta"
                      : method === "transfer"
                        ? "Transferencia (completar por WhatsApp)"
                        : "Efectivo";
                  const base = isMultiPayment
                    ? methodAmounts[method] || 0
                    : payableSubtotal;
                  const amount = paymentMethodAmountWithInstallment(
                    method,
                    base,
                    selectedInstallment,
                  );
                  payLines.push(
                    `  - ${methodName}: $${amount.toLocaleString("es-AR")}`,
                  );
                });
              }
              if (payLines.length > 0) {
                paymentInfo = `\n\n*Métodos de pago:*\n${payLines.join("\n")}`;
              }

              const addressText = addressData.additional_info
                ? `${addressData.street} ${addressData.number}, ${addressData.city}, ${addressData.postal_code}${addressData.additional_info ? ` (${addressData.additional_info})` : ""}`
                : `${addressData.street} ${addressData.number}, ${addressData.city}, ${addressData.postal_code}`;

              const provinceName =
                "province" in addressData && addressData.province
                  ? addressData.province
                  : addressData.province_id
                    ? provinces.find((p) => p.id === addressData.province_id)?.name || ""
                    : "";

              const totalWithShippingWa = finalTotal;

              const message = `Hola! Quiero realizar el siguiente pedido:

*PRODUCTOS:*
${cartItems}

*RESUMEN:*
${couponDiscount > 0.01 ? `Subtotal: $${subtotal.toLocaleString("es-AR")}\nDescuento cupón: −$${couponDiscount.toLocaleString("es-AR")}\n` : ""}Subtotal productos: $${subtotalAfterCoupon.toLocaleString("es-AR")}
${shippingCost > 0 ? `Envío: $${shippingCost.toLocaleString("es-AR")}` : "Envío: Gratis"}
*Total: $${totalWithShippingWa.toLocaleString("es-AR")}*${paymentInfo}

*DATOS DEL CLIENTE:*
Nombre: ${formData.first_name} ${formData.last_name}
Teléfono: ${formData.phone}
${formData.alternate_phone ? `Teléfono alternativo: ${formData.alternate_phone}\n` : ""}Email: ${formData.email}
${formData.document_type ? `Tipo de documento: ${docTypes.find((dt) => dt.id === formData.document_type)?.name || formData.document_type}\n` : ""}DNI: ${formData.dni}

*DIRECCIÓN DE ENTREGA:*
${addressData.full_name}
${addressData.phone}
${addressText}${provinceName ? `, ${provinceName}` : ""}`;

              const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
              window.location.href = whatsappUrl;
              setSubmitting(false);
              return;
            }
          }
        } catch (whatsappError) {
          console.error("Error al obtener número de WhatsApp (transferencia tercerizada):", whatsappError);
          setErrors({
            submit: "No se pudo obtener el número de WhatsApp. Por favor, intenta nuevamente.",
          });
          setSubmitting(false);
          return;
        }
      }
      
      // Solo redirigir a WhatsApp si isPaisCatalog es true (estado actualizado correctamente)
      if (isPaisCatalog) {
        // Obtener número de WhatsApp desde la configuración
        try {
          const whatsappResponse = await fetch("/api/settings/public/phone", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });
          
          if (whatsappResponse.ok) {
            const whatsappData = await whatsappResponse.json();
            if (whatsappData.success && whatsappData.phone) {
              // Limpiar el número de teléfono para WhatsApp (solo números)
              const cleanPhone = whatsappData.phone.replace(/\D/g, "");
              
              // Construir mensaje completo con toda la información de la compra
              const cartItems = cart.map(item => {
                const itemPrice = getItemPrice(item);
                const unitPrice = getItemUnitPrice(item);
                return `• ${item.name} x${item.quantity} - $${itemPrice.toLocaleString('es-AR')} ($${unitPrice.toLocaleString('es-AR')} c/u)`;
              }).join('\n');
              
              let paymentInfo = "";
              const payLinesPais: string[] = [];
              if (walletCreditApplied > 0.01) {
                payLinesPais.push(
                  `  - Billetera Bausing (descuento): $${walletCreditApplied.toLocaleString("es-AR")}`,
                );
              }
              if (payableSubtotal > 0.01 && selectedMethods.length > 0) {
                selectedMethods.forEach((method) => {
                  const methodName =
                    method === "card"
                      ? "Tarjeta"
                      : method === "transfer"
                        ? "Transferencia"
                        : "Efectivo";
                  const base = isMultiPayment
                    ? methodAmounts[method] || 0
                    : payableSubtotal;
                  const amount = paymentMethodAmountWithInstallment(
                    method,
                    base,
                    selectedInstallment,
                  );
                  payLinesPais.push(
                    `  - ${methodName}: $${amount.toLocaleString("es-AR")}`,
                  );
                });
              }
              if (payLinesPais.length > 0) {
                paymentInfo = `\n\n*Métodos de pago seleccionados:*\n${payLinesPais.join("\n")}`;
              } else {
                paymentInfo = "\n\n*Método de pago:* Abonar al recibir";
              }
              if (cardPaymentObservationsText) {
                paymentInfo += `\n${cardPaymentObservationsText}`;
              }

              // Información de dirección
              const addressText = addressData.additional_info 
                ? `${addressData.street} ${addressData.number}, ${addressData.city}, ${addressData.postal_code}${addressData.additional_info ? ` (${addressData.additional_info})` : ''}`
                : `${addressData.street} ${addressData.number}, ${addressData.city}, ${addressData.postal_code}`;
              
              // Obtener nombre de provincia si está disponible
              const provinceName = 'province' in addressData && addressData.province 
                ? addressData.province 
                : addressData.province_id 
                  ? provinces.find(p => p.id === addressData.province_id)?.name || ''
                  : '';
              
              const totalWithShippingPais = finalTotal;

              // Construir mensaje completo
              const message = `Hola! Quiero realizar el siguiente pedido:

*PRODUCTOS:*
${cartItems}

*RESUMEN:*
${couponDiscount > 0.01 ? `Subtotal: $${subtotal.toLocaleString('es-AR')}\nDescuento cupón: −$${couponDiscount.toLocaleString('es-AR')}\n` : ""}Subtotal productos: $${subtotalAfterCoupon.toLocaleString('es-AR')}
${shippingCost > 0 ? `Envío: $${shippingCost.toLocaleString('es-AR')}` : 'Envío: Gratis'}
*Total: $${totalWithShippingPais.toLocaleString('es-AR')}*${paymentInfo}

*DATOS DEL CLIENTE:*
Nombre: ${formData.first_name} ${formData.last_name}
Teléfono: ${formData.phone}
${formData.alternate_phone ? `Teléfono alternativo: ${formData.alternate_phone}\n` : ''}Email: ${formData.email}
${formData.document_type ? `Tipo de documento: ${docTypes.find(dt => dt.id === formData.document_type)?.name || formData.document_type}\n` : ''}DNI: ${formData.dni}

*DIRECCIÓN DE ENTREGA:*
${addressData.full_name}
${addressData.phone}
${addressText}${provinceName ? `, ${provinceName}` : ''}`;
              
              const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
              
              // Redirigir a WhatsApp - NO crear orden en CRM
              window.location.href = whatsappUrl;
              setSubmitting(false);
              return; // Este return evita que se ejecute el código de creación de orden
            }
          }
        } catch (whatsappError) {
          console.error("Error al obtener número de WhatsApp:", whatsappError);
          setErrors({ submit: "No se pudo obtener el número de WhatsApp. Por favor, intenta nuevamente." });
          setSubmitting(false);
          return;
        }
      }

      // Billetera = descuento (primero); el resto se paga con tarjeta / efectivo / transferencia
      const paymentMethodsArray: Array<{
        method: PaymentMethodType;
        amount: number;
        processed: boolean;
        medios_pago_id: number;
      }> = [];

      if (walletCreditApplied > 0.01) {
        paymentMethodsArray.push({
          method: "wallet",
          amount: walletCreditApplied,
          processed: true,
          medios_pago_id: CRM_MEDIOS_PAGO_BILLETERA,
        });
      }

      if (payableSubtotal > 0.01) {
        for (const method of selectedMethods) {
          const base = isMultiPayment
            ? methodAmounts[method] || 0
            : payableSubtotal;
          const amount = paymentMethodAmountWithInstallment(
            method,
            base,
            selectedInstallment,
          );
          let processed = false;
          const mediosPagoId = crmMediosPagoIdForCheckoutMethod(method);
          paymentMethodsArray.push({
            method,
            amount,
            processed,
            medios_pago_id: mediosPagoId,
          });
        }
      }

      const primaryMethod =
        payableSubtotal > 0.01 ? selectedMethods[0] || "card" : "wallet";
      const walletAmount = walletCreditApplied;

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
        crm_sale_type_id: DEFAULT_CRM_SALE_TYPE_ID,
        ...(crmZoneId && { crm_zone_id: crmZoneId }),
        total: finalTotal,
        // Multi-payment: enviar array de métodos de pago con montos
        payment_methods: paymentMethodsArray,
        // Wallet amount for backward compat
        ...(walletAmount > 0 && {
          use_wallet_balance: true,
          wallet_amount: walletAmount,
        }),
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          price: getItemUnitPrice(item),
        })),
        observations: cardPaymentObservationsText,
        ...(cardPaymentDetailsPayload && {
          card_payment_details: cardPaymentDetailsPayload,
        }),
        ...(referralCode.trim() && {
          referral_code: referralCode.trim().toUpperCase(),
        }),
        ...(appliedCoupon && {
          coupon_code: appliedCoupon.code,
        }),
      };


      // Send order to backend
      let orderResponse;
      try {
        orderResponse = await createOrder(orderData);
      } catch (orderError: any) {
        console.error("Error al crear orden:", orderError);
        throw orderError;
      }

      // La respuesta del backend es { success: True, data: { id: ... }, message: ... }
      // Pero createOrder retorna data.data || data, así que orderResponse ya es el objeto data
      let orderId = orderResponse?.id || (orderResponse as any)?.data?.id || null;
      
      // Solo redirigir si la orden se creó exitosamente
      if (!orderId) {
        throw new Error("No se pudo obtener el ID de la orden. Por favor, intenta nuevamente.");
      }
      
      // Marcar que se completó la orden exitosamente (antes de redirigir)
      setOrderCompleted(true);
      
      // Resetear refs para evitar problemas en futuras sesiones
      lastAddressIdRef.current = null;
      isDetectingLocalityRef.current = false;
      
      // Redirigir a la página de éxito
      // IMPORTANTE: Redirigir ANTES de limpiar el carrito para evitar que el useEffect redirija al inicio
      router.push(`/checkout/success?order_id=${orderId}`);
      
      // Clear cart AFTER redirecting (use setTimeout to ensure redirect happens first)
      setTimeout(() => {
        cart.forEach((item) => removeFromCart(item.id));
      }, 100);
    } catch (error: any) {
      console.error("Error al procesar el pedido:", error);
      
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
      
      // Detectar error de localidad no encontrada
      if (errorMessage.includes("No se pudo obtener crm_zone_id para la localidad") ||
          (errorMessage.includes("no se encontró") && errorMessage.includes("localidad")) ||
          errorMessage.includes("zona de entrega para")) {
        errorMessage = "La localidad ingresada no se encontró. Por favor, verifica que la localidad sea correcta.";
      }
      
      // Detectar error de teléfono inválido para WhatsApp (validación CRM)
      if (errorMessage.toLowerCase().includes("mensajer") && errorMessage.toLowerCase().includes("whatsapp") ||
          errorMessage.toLowerCase().includes("cliente_telefono") ||
          errorMessage.toLowerCase().includes("formato inv") && errorMessage.toLowerCase().includes("tel")) {
        errorMessage = "Ingresá un teléfono válido";
      }

      // Detectar errores de pago rechazado (pero no tratar in_process como error)
      if (errorMessage.includes("rejected") || (errorMessage.includes("El pago fue") && !errorMessage.includes("in_process") && !errorMessage.includes("pending_contingency"))) {
        errorMessage = "El pago fue rechazado. Por favor, verifica los datos de tu tarjeta o intenta con otra tarjeta.";
      }
      
      setErrors({ submit: errorMessage });
      // NO redirigir cuando hay un error - mantener al usuario en la página de checkout
      // NO limpiar el carrito cuando hay un error
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  // Función helper para obtener el precio de un item del carrito
  // Si hay precio calculado según localidad, usarlo; sino usar el precio guardado
  const checkoutPriceKind = checkoutPaymentPriceKind(selectedMethods);

  const selectedInstallment = selectedInstallmentKey
    ? parseInstallmentOptionKey(selectedInstallmentKey)
    : null;

  const cardPaymentObservationsText =
    selectedMethods.includes("card")
      ? buildCardPaymentObservations(
          cardTypes,
          selectedCardType,
          selectedBank,
          selectedInstallment,
        )
      : "";

  const cardPaymentDetailsPayload = buildCardPaymentDetailsPayload(
    cardTypes,
    selectedCardType,
    selectedBank,
    selectedInstallment,
  );

  const getItemPrice = (item: typeof cart[0]): number => {
    const product = productsWithPrices[item.id];
    if (product) {
      const priceInfo = calculateProductPrice(product, item.quantity, {
        paymentPriceKind: checkoutPriceKind,
      });
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
      const priceInfo = calculateProductPrice(product, 1, {
        paymentPriceKind: checkoutPriceKind,
      });
      return priceInfo.currentPriceValue;
    }
    // Fallback: parsear el precio guardado
    if (!item.price) return 0;
    if (typeof item.price === 'number') return item.price;
    const cleaned = item.price.replace(/[$\s]/g, '').replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const buildCouponPreviewItems = () =>
    cart.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
      price: getItemUnitPrice(item),
    }));

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) {
      setCouponError("Ingresá un código");
      return;
    }
    if (!isAuthenticated) {
      setCouponError("Tenés que iniciar sesión para usar un cupón");
      return;
    }
    setCouponLoading(true);
    setCouponError("");
    try {
      const data = await previewCouponCheckout({
        code: code.toUpperCase(),
        items: buildCouponPreviewItems(),
      });
      setAppliedCoupon({
        code: data.code,
        discountAmount: data.discount_amount,
        clubBeneficiosOnly: data.club_beneficios_only,
      });
      setCouponInput(data.code);
    } catch (e: unknown) {
      setAppliedCoupon(null);
      setCouponError(e instanceof Error ? e.message : "Cupón inválido");
    } finally {
      setCouponLoading(false);
    }
  };

  // Recalcular descuento del cupón si cambia el método de pago (tarjeta vs efectivo/transferencia)
  useEffect(() => {
    if (!appliedCoupon?.code || !isAuthenticated || cart.length === 0) return;
    if (Object.keys(productsWithPrices).length === 0) return;

    let cancelled = false;
    (async () => {
      try {
        const data = await previewCouponCheckout({
          code: appliedCoupon.code,
          items: buildCouponPreviewItems(),
        });
        if (!cancelled) {
          setAppliedCoupon((prev) =>
            prev
              ? {
                  ...prev,
                  discountAmount: data.discount_amount,
                  clubBeneficiosOnly: data.club_beneficios_only,
                }
              : null,
          );
          setCouponError("");
        }
      } catch {
        if (!cancelled) {
          setAppliedCoupon(null);
          setCouponError("El cupón ya no aplica con este método de pago");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMethods, productsWithPrices, cart]);

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + getItemPrice(item), 0);
  };

  const subtotal = calculateTotal();
  const couponDiscount = appliedCoupon?.discountAmount ?? 0;
  const subtotalAfterCoupon = Math.max(0, subtotal - couponDiscount);
  const totalAmount = subtotalAfterCoupon;
  const canPayWithWallet =
    walletBalance >= subtotalAfterCoupon && !walletIsBlocked;
  const walletCreditApplied =
    useWalletCredit &&
    !isThirdPartyTransport &&
    !walletIsBlocked &&
    walletBalance > 0
      ? Math.min(walletBalance, subtotalAfterCoupon)
      : 0;
  const payableSubtotal = Math.max(0, subtotalAfterCoupon - walletCreditApplied);

  useEffect(() => {
    if (payableSubtotal <= 0.01 && subtotalAfterCoupon > 0.01) {
      setSelectedMethods([]);
      setMethodAmounts({});
      setEnableMultiPayment(false);
    }
  }, [payableSubtotal, subtotalAfterCoupon]);

  // Catálogo País: cotización Vía Cargo (Busplus) según CP destino, bultos y medidas en DB
  // Debounce: evita dos POST seguidos con CP distintos (p. ej. 5000 y luego 1499) por estado aún inestable.
  useEffect(() => {
    if (!isPaisCatalog || isThirdPartyTransport) {
      setViacargoQuoteTotal(null);
      setViacargoQuoteError(null);
      setViacargoCotizarLoading(false);
      return;
    }
    if (!locality?.id) {
      setViacargoQuoteTotal(null);
      setViacargoQuoteError(null);
      setViacargoCotizarLoading(false);
      return;
    }
    // When using the address form, shippingLocalityError reflects IP vs saved-address mismatch — irrelevant here
    if (!showAddressForm && shippingLocalityError) {
      setViacargoQuoteTotal(null);
      setViacargoQuoteError(null);
      setViacargoCotizarLoading(false);
      return;
    }
    const cp = showAddressForm
      ? normalizeArPostalCode(addressForm.postal_code)
      : normalizeArPostalCode(addresses.find((a) => a.id === selectedAddressId)?.postal_code);
    if (!cp) {
      setViacargoQuoteTotal(null);
      setViacargoQuoteError(null);
      return;
    }
    if (cart.length === 0) {
      setViacargoQuoteTotal(null);
      return;
    }

    const ac = new AbortController();
    const debounceMs = 450;
    const timeoutId = setTimeout(() => {
      (async () => {
        setViacargoCotizarLoading(true);
        setViacargoQuoteError(null);
        const requestBody = {
          codigo_postal_destinatario: cp,
          importe_valor_declarado: Math.max(0, Math.round(subtotalAfterCoupon)),
          items: cart.map((c) => ({ product_id: c.id, quantity: c.quantity })),
        };
        try {
          const res = await fetch("/api/public/viacargo-cotizar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
            signal: ac.signal,
          });
          if (ac.signal.aborted) return;
          let data: any = null;
          try {
            data = await res.json();
          } catch {
            // nginx devolvió HTML (504/502 de gateway) — no es JSON
          }
          if (!res.ok || !data?.success) {
            setViacargoQuoteTotal(null);
            setViacargoQuoteError(
              typeof data?.error === "string"
                ? data.error
                : "Este código postal no tiene envío disponible.",
            );
            return;
          }
          setViacargoQuoteTotal(
            data.data && typeof data.data.total === "number" ? data.data.total : null,
          );
        } catch (e) {
          if (ac.signal.aborted) return;
          setViacargoQuoteTotal(null);
          setViacargoQuoteError(
            e instanceof Error ? e.message : "Error al cotizar el envío",
          );
        } finally {
          if (!ac.signal.aborted) setViacargoCotizarLoading(false);
        }
      })();
    }, debounceMs);

    return () => {
      clearTimeout(timeoutId);
      ac.abort();
    };
  }, [
    isPaisCatalog,
    isThirdPartyTransport,
    locality?.id,
    shippingLocalityError,
    selectedAddressId,
    addresses,
    cart,
    subtotalAfterCoupon,
    showAddressForm,
    addressForm.postal_code,
  ]);

  // Calcular costo de envío: tercerizado fijo, catálogo País = cotización Vía Cargo
  const selectedAddressForShipping = addresses.find((addr) => addr.id === selectedAddressId);
  const paisPostalOk = normalizeArPostalCode(
    showAddressForm
      ? addressForm.postal_code
      : selectedAddressForShipping?.postal_code,
  );
  const localityShippingProblem =
    !localityLoading &&
    (!locality?.id ||
      shippingLocalityError ||
      (isPaisCatalog &&
        !isThirdPartyTransport &&
        (showAddressForm
          ? !normalizeArPostalCode(addressForm.postal_code)
          : !selectedAddressForShipping || !paisPostalOk)));
  let shippingCost = 0;
  if (isThirdPartyTransport && configuredShippingPrice !== null) {
    shippingCost = configuredShippingPrice;
  } else if (isPaisCatalog && !isThirdPartyTransport && viacargoQuoteTotal !== null) {
    shippingCost = viacargoQuoteTotal;
  }

  /** Vía Cargo obligatorio: sin cotización OK (error, carga, o sin monto) no se puede finalizar. */
  const paisViacargoBloqueaFinalizar =
    isPaisCatalog &&
    !isThirdPartyTransport &&
    cart.length > 0 &&
    !(
      Boolean(locality?.id) &&
      !localityLoading &&
      !shippingLocalityError &&
      (showAddressForm
        ? Boolean(normalizeArPostalCode(addressForm.postal_code))
        : Boolean(selectedAddressForShipping) && Boolean(paisPostalOk)) &&
      !viacargoCotizarLoading &&
      !viacargoQuoteError &&
      viacargoQuoteTotal !== null
    );

  useEffect(() => {
    setSelectedMethods((prev) => prev.filter((m) => m !== "wallet"));
    setMethodAmounts((prev) => {
      const { wallet: _w, ...rest } = prev;
      return rest;
    });
  }, []);

  useEffect(() => {
    if (isThirdPartyTransport) {
      setUseWalletCredit(false);
    }
  }, [isThirdPartyTransport]);

  // Limpiar métodos de pago no permitidos cuando cambia el transporte tercerizado
  useEffect(() => {
    if (isThirdPartyTransport) {
      // Si es transporte tercerizado, solo permitir efectivo y tarjeta
      const allowedMethods: PaymentMethodType[] = ["cash", "card"];
      const currentMethods = selectedMethods.filter(m => allowedMethods.includes(m)) as PaymentMethodType[];
      
      if (currentMethods.length !== selectedMethods.length || selectedMethods.length === 0) {
        // Si no hay métodos permitidos seleccionados, seleccionar efectivo por defecto
        const methodsToSet: PaymentMethodType[] = currentMethods.length > 0 ? currentMethods : ["cash"];
        setSelectedMethods(methodsToSet);
        
        // Limpiar montos de métodos no permitidos y asignar el total al método seleccionado
        const newMethodAmounts: Record<string, number> = {};
        if (methodsToSet.length === 1 && !enableMultiPayment) {
          // Si solo hay un método y no es multi-pago, asignar el total completo
          const method = methodsToSet[0];
          newMethodAmounts[method] = subtotalAfterCoupon;
        } else {
          methodsToSet.forEach(method => {
            if (methodAmounts[method]) {
              newMethodAmounts[method] = methodAmounts[method];
            }
          });
        }
        setMethodAmounts(newMethodAmounts);
      }
    }
  }, [isThirdPartyTransport, enableMultiPayment, selectedMethods, methodAmounts, subtotalAfterCoupon]);

  // Multi-payment derived values (métodos = solo tarjeta / efectivo / transferencia; billetera va aparte)
  const isMultiPayment = enableMultiPayment && selectedMethods.length > 1;
  const hasCardPayment = selectedMethods.includes("card");
  const hasWalletPayment = walletCreditApplied > 0.01;
  const getMethodAmount = (method: PaymentMethodType): number => methodAmounts[method] || 0;
  const cardPaymentAmount = getMethodAmount("card");
  const walletPaymentAmount = walletCreditApplied;
  const getEffectiveMethodAmount = (method: PaymentMethodType): number =>
    paymentMethodAmountWithInstallment(
      method,
      getMethodAmount(method),
      selectedInstallment,
    );
  const totalAssigned = selectedMethods.reduce(
    (sum, m) => sum + getEffectiveMethodAmount(m),
    0,
  );
  const payableTotal = computePayableWithInstallmentSurcharge(payableSubtotal, {
    hasCardPayment,
    cardPaymentAmount,
    isMultiPayment,
    installment: selectedInstallment,
  });
  const remainingToAssign = Math.max(0, payableTotal - totalAssigned);
  const walletDiscount = walletCreditApplied;
  const remainingAfterWallet = payableTotal;
  const finalTotal = Math.max(0, payableTotal + shippingCost);

  const cardFinancingBaseAmount = isMultiPayment
    ? cardPaymentAmount
    : payableSubtotal;
  const selectedInstallmentAmounts =
    hasCardPayment && selectedInstallment
      ? calculateInstallmentAmounts(cardFinancingBaseAmount, selectedInstallment)
      : null;

  // Auto-fill montos respecto a lo que falta pagar (subtotal − billetera)
  useEffect(() => {
    if (payableSubtotal <= 0.01) {
      return;
    }
    if (!enableMultiPayment && selectedMethods.length === 1) {
      const method = selectedMethods[0];
      setMethodAmounts({ [method]: payableSubtotal });
    } else if (enableMultiPayment && selectedMethods.length > 1) {
      const currentTotal = selectedMethods.reduce((sum, m) => sum + (methodAmounts[m] || 0), 0);
      if (currentTotal === 0 || Math.abs(currentTotal - payableSubtotal) > 0.01) {
        const minPerMethod = 1;
        const totalMin = selectedMethods.length * minPerMethod;

        if (payableSubtotal < totalMin) {
          selectedMethods.forEach((m) => {
            setMethodAmounts((prev) => ({
              ...prev,
              [m]: payableSubtotal / selectedMethods.length,
            }));
          });
        } else {
          const distribution: Record<string, number> = {};
          const availableForDistribution = payableSubtotal - totalMin;

          selectedMethods.forEach((m) => {
            distribution[m] = minPerMethod;
          });

          if (availableForDistribution > 0) {
            selectedMethods.forEach((m) => {
              const additional = availableForDistribution / selectedMethods.length;
              distribution[m] = Math.min(distribution[m] + additional, payableSubtotal);
            });

            const total = Object.values(distribution).reduce((sum, v) => sum + v, 0);
            if (total > 0 && Math.abs(total - payableSubtotal) > 0.01) {
              const factor = payableSubtotal / total;
              Object.keys(distribution).forEach((m) => {
                distribution[m] = Math.max(minPerMethod, distribution[m] * factor);
              });
            }
          }

          setMethodAmounts(distribution);
        }
      }
    }
  }, [
    enableMultiPayment,
    selectedMethods.length,
    payableSubtotal,
    useWalletCredit,
    walletBalance,
    isThirdPartyTransport,
    walletIsBlocked,
  ]);

  // Helper: toggle tarjeta / efectivo / transferencia (billetera es otro control)
  const togglePaymentMethod = (method: PaymentMethodType) => {
    if (method === "wallet") return;
    setSelectedMethods((prev) => {
      if (prev.includes(method)) {
        const next = prev.filter((m) => m !== method);
        setMethodAmounts((a) => {
          const { [method]: _, ...rest } = a;
          if (next.length === 1 && !enableMultiPayment && payableSubtotal > 0.01) {
            const remainingMethod = next[0];
            return { [remainingMethod]: payableSubtotal };
          }
          return rest;
        });
        return next;
      }
      if (!enableMultiPayment && prev.length > 0) {
        setMethodAmounts({});
        if (payableSubtotal > 0.01) {
          setMethodAmounts({ [method]: payableSubtotal });
        }
        return [method];
      }
      const next = [...prev, method];
      const minPerMethod = enableMultiPayment && next.length > 1 ? 1 : 0;
      if (enableMultiPayment) {
        const currentTotal = next.reduce((sum, m) => sum + (methodAmounts[m] || 0), 0);
        const remaining = payableSubtotal - currentTotal;
        const newMethodAmount = Math.max(minPerMethod, remaining);
        setMethodAmounts((prevAmt) => {
          const updated = { ...prevAmt, [method]: newMethodAmount };
          if (remaining < minPerMethod) {
            const excess = minPerMethod - remaining;
            const otherMethods = next.filter((m) => m !== method);
            const otherTotal = otherMethods.reduce(
              (sum, m) => sum + Math.max(0, (updated[m] || 0) - minPerMethod),
              0,
            );
            if (otherTotal > 0) {
              otherMethods.forEach((m) => {
                const current = updated[m] || 0;
                const reducible = current - minPerMethod;
                if (reducible > 0) {
                  const proportion = reducible / otherTotal;
                  updated[m] = Math.max(minPerMethod, current - excess * proportion);
                }
              });
            }
          }
          next.forEach((m) => {
            if ((updated[m] || 0) < minPerMethod) {
              updated[m] = minPerMethod;
            }
          });
          return updated;
        });
      }
      return next;
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
    if (method === "wallet") return;
    const numValue = parseFloat(value) || 0;
    const minPerMethod = enableMultiPayment && selectedMethods.length > 1 ? 1 : 0;
    const maxValue = Math.min(numValue, payableSubtotal);

    setMethodAmounts((prev) => {
      const updated = { ...prev, [method]: maxValue };

      if (enableMultiPayment && selectedMethods.length > 1) {
        const otherMethods = selectedMethods.filter((m) => m !== method);
        const currentTotal =
          otherMethods.reduce((sum, m) => sum + (updated[m] || 0), 0) + maxValue;
        const remaining = payableSubtotal - currentTotal;

        if (maxValue < minPerMethod && otherMethods.length > 0) {
          updated[method] = minPerMethod;
          const newRemaining =
            payableSubtotal -
            (otherMethods.reduce((sum, m) => sum + (updated[m] || 0), 0) + minPerMethod);
          if (newRemaining > 0.01 && otherMethods.length > 0) {
            const otherTotal = otherMethods.reduce((sum, m) => {
              return sum + Math.max(0, payableSubtotal - Math.max(minPerMethod, updated[m] || 0));
            }, 0);

            if (otherTotal > 0) {
              otherMethods.forEach((m) => {
                const available = Math.max(
                  0,
                  payableSubtotal - Math.max(minPerMethod, updated[m] || 0),
                );
                if (available > 0) {
                  const proportion = available / otherTotal;
                  updated[m] = Math.max(
                    minPerMethod,
                    (updated[m] || 0) + newRemaining * proportion,
                  );
                  updated[m] = Math.min(updated[m], payableSubtotal);
                } else {
                  updated[m] = Math.max(minPerMethod, updated[m] || 0);
                }
              });
            }
          }
        } else if (remaining > 0.01 && otherMethods.length > 0) {
          const otherTotal = otherMethods.reduce((sum, m) => {
            return sum + Math.max(0, payableSubtotal - Math.max(minPerMethod, updated[m] || 0));
          }, 0);

          if (otherTotal > 0) {
            otherMethods.forEach((m) => {
              const available = Math.max(
                0,
                payableSubtotal - Math.max(minPerMethod, updated[m] || 0),
              );
              if (available > 0) {
                const proportion = available / otherTotal;
                updated[m] = Math.max(minPerMethod, (updated[m] || 0) + remaining * proportion);
                updated[m] = Math.min(updated[m], payableSubtotal);
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


  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00C1A7]" />
      </div>
    );
  }

  const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId);
  const couponFields = (
    <>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Código de descuento
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={couponInput}
          onChange={(e) => {
            setCouponInput(e.target.value.toUpperCase());
            setCouponError("");
          }}
          placeholder="Ej: VERANO2026"
          disabled={couponLoading || !isAuthenticated}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-[#00C1A7] focus:border-[#00C1A7] bg-white disabled:bg-gray-100"
        />
        <button
          type="button"
          onClick={() => void handleApplyCoupon()}
          disabled={couponLoading || !isAuthenticated}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[#00C1A7] text-white hover:opacity-90 disabled:opacity-50"
        >
          {couponLoading ? (
            <Loader2 className="w-4 h-4 animate-spin inline" />
          ) : (
            "Aplicar"
          )}
        </button>
      </div>
      {!isAuthenticated && (
        <p className="text-xs text-gray-500 mt-1">
          Iniciá sesión para validar un cupón.
        </p>
      )}
      {couponError && (
        <p className="text-sm text-red-600 mt-2">{couponError}</p>
      )}
      {appliedCoupon && appliedCoupon.discountAmount > 0.01 && (
        <div className="mt-2 flex items-center justify-between text-sm text-[#00A896]">
          <span>
            Cupón {appliedCoupon.code}
            {appliedCoupon.clubBeneficiosOnly
              ? " (Club Beneficios)"
              : ""}{" "}
            −{formatPrice(appliedCoupon.discountAmount)}
          </span>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-800 text-xs underline"
            onClick={() => {
              setAppliedCoupon(null);
              setCouponInput("");
              setCouponError("");
            }}
          >
            Quitar
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 lg:py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">Checkout</h1>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6 order-2 lg:order-1">
              {/* Products */}
              <div className="bg-white border border-gray-200 rounded-[14px] p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">
                  Productos
                </h2>
                <div className="space-y-3 md:space-y-4">
                  {cart.map((item) => {
                    const unitPrice = getItemUnitPrice(item);
                    return (
                      <div key={item.id} className="flex gap-3 md:gap-4 pb-3 md:pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm md:text-base font-medium text-gray-900 truncate pt-0.5">
                              {item.name}
                            </p>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors -mt-1"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-4 flex-wrap">
                            <span className="text-xs md:text-sm text-gray-500">
                              Precio unitario: <span className="font-medium text-gray-700">{formatPrice(unitPrice)}</span>
                            </span>
                            <div className="flex items-center gap-2 ml-auto">
                              <span className="text-xs md:text-sm text-gray-500">Cantidad:</span>
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                                title="Disminuir cantidad"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-sm font-medium text-gray-900 min-w-[1.5rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                                title="Aumentar cantidad"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

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
                      onChange={(e) => !isAuthenticated && handleInputChange("email", e.target.value)}
                      readOnly={isAuthenticated}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900 ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      } ${isAuthenticated ? "bg-gray-50 cursor-default" : ""}`}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                    {!isAuthenticated && !errors.email && (
                      <p className="text-xs text-gray-500 mt-1">
                        Al completar la compra crearemos una cuenta con este email y recibirás tu contraseña por correo.
                      </p>
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
                      onClick={openNewAddressForm}
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
                {(localityLoading || loadingPrices) && !showAddressForm && (
                  <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                    Actualizando precios según tu dirección…
                  </p>
                )}

                {showAddressForm ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        {editingAddressId ? "Editar dirección" : "Nueva dirección"}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Información del destinatario
                      </p>
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
                          inputMode="numeric"
                          autoComplete="postal-code"
                          maxLength={8}
                          value={addressForm.postal_code}
                          onChange={(e) => handleAddressInputChange("postal_code", e.target.value)}
                          placeholder="Ej: 5000 (solo números)"
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
                          autoComplete="off"
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
                        onClick={closeAddressForm}
                        disabled={savingCheckoutAddress}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void handleSaveAddress();
                        }}
                        disabled={savingCheckoutAddress}
                        className="inline-flex items-center justify-center gap-2 min-w-[180px] px-4 py-2 bg-[#00C1A7] text-white rounded-lg hover:bg-[#00A892] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {savingCheckoutAddress && (
                          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
                        )}
                        {savingCheckoutAddress
                          ? "Guardando…"
                          : editingAddressId
                            ? "Guardar cambios"
                            : "Guardar dirección"}
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
                          onClick={openNewAddressForm}
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
                            onChange={(e) => handleCheckoutAddressSelect(e.target.value)}
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
                            <button
                              type="button"
                              className="mt-2 text-sm font-medium text-[#00C1A7] hover:text-[#00A892]"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openEditAddressForm(address);
                              }}
                            >
                              Editar
                            </button>
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

              {/* Cupón de descuento */}
              <div className="bg-white border border-gray-200 rounded-[14px] p-4 md:p-6">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
                  Cupón de descuento
                </h2>
                {couponFields}
              </div>

              {/* Payment Method - Multi-payment support */}
              <div className="bg-white border border-gray-200 rounded-[14px] p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                    Medios de pago
                  </h2>
                </div>

                {!isThirdPartyTransport && walletBalance > 0.01 && !walletIsBlocked && (
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3 md:p-4 mb-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span className="text-sm font-medium text-gray-900">
                            Usar saldo de billetera como descuento
                          </span>
                        </div>
                        {walletLoading ? (
                          <p className="text-xs text-gray-500 mt-1">Cargando saldo...</p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-1">
                            Saldo disponible: {formatPrice(walletBalance)}
                          </p>
                        )}
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          role="switch"
                          checked={useWalletCredit}
                          onChange={(e) => {
                            setUseWalletCredit(e.target.checked);
                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next.payment_method;
                              return next;
                            });
                          }}
                          disabled={walletLoading}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#00C1A7] peer-focus:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00C1A7]" />
                      </label>
                    </div>
                  </div>
                )}
                
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
                            const firstMethod = selectedMethods[0];
                            setSelectedMethods([firstMethod]);
                            if (payableSubtotal > 0.01) {
                              setMethodAmounts({ [firstMethod]: payableSubtotal });
                            } else {
                              setMethodAmounts({});
                            }
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#00C1A7] peer-focus:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00C1A7]"></div>
                    </label>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mb-4 md:mb-6">
                  {payableSubtotal <= 0.01 && walletCreditApplied > 0.01 ? (
                    <>El saldo de billetera cubre el subtotal de productos. Solo pagás el envío al finalizar.</>
                  ) : enableMultiPayment ? (
                    "Seleccioná los métodos para el monto a abonar y distribuí los importes"
                  ) : (
                    "Seleccioná cómo vas a abonar el monto pendiente (después del descuento de billetera, si lo usás)"
                  )}
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
                    <label
                      className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 ${payableSubtotal <= 0.01 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <input
                        type="checkbox"
                        disabled={payableSubtotal <= 0.01}
                        checked={selectedMethods.includes("card")}
                        onChange={() => togglePaymentMethod("card")}
                        className="w-4 h-4 rounded border-gray-300 text-[#00C1A7] focus:ring-[#00C1A7] disabled:opacity-50"
                      />
                      <CreditCard className="w-5 h-5 text-gray-600" />
                      <div className="flex-1">
                        <span className="font-medium text-gray-900 text-sm md:text-base">Tarjeta</span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {isThirdPartyTransport 
                            ? "Completarás la venta por WhatsApp" 
                            : isPaisCatalog 
                            ? "Completarás la venta por WhatsApp" 
                            : "Abonás al recibir"}
                        </p>
                      </div>
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
                            max={payableSubtotal}
                            value={methodAmounts["card"] || ""}
                            onChange={(e) => updateMethodAmount("card", e.target.value)}
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-[#00C1A7] focus:border-[#00C1A7] placeholder:text-gray-400"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    )}
                    {/* Mensaje de abonar al recibir cuando se selecciona tarjeta */}
                    {selectedMethods.includes("card") && (
                      <div className="px-3 md:px-4 pb-3 md:pb-4">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs md:text-sm text-blue-800">
                              {isThirdPartyTransport ? (
                                <span className="font-semibold">Completarás la venta por WhatsApp</span>
                              ) : isPaisCatalog ? (
                                <span className="font-semibold">Completarás la venta por WhatsApp</span>
                              ) : (
                                <>
                                  <span className="font-semibold">Abonarás al recibir</span> - Pagarás con tarjeta cuando recibas tu pedido
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Efectivo - Siempre visible, pero con mensaje diferente si es transporte tercerizado */}
                  <div
                    className={`border rounded-lg transition-colors ${
                      selectedMethods.includes("cash")
                        ? "border-[#00C1A7] bg-[#00C1A7]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <label
                      className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 ${payableSubtotal <= 0.01 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <input
                        type="checkbox"
                        disabled={payableSubtotal <= 0.01}
                        checked={selectedMethods.includes("cash")}
                        onChange={() => togglePaymentMethod("cash")}
                        className="w-4 h-4 rounded border-gray-300 text-[#00C1A7] focus:ring-[#00C1A7] disabled:opacity-50"
                      />
                      <Wallet className="w-5 h-5 text-gray-600" />
                      <div className="flex-1">
                        <span className="font-medium text-gray-900 text-sm md:text-base">Efectivo</span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {isThirdPartyTransport 
                            ? "Abonás al recibir" 
                            : isPaisCatalog 
                            ? "Completarás la venta por WhatsApp" 
                            : "Abonás al recibir"}
                        </p>
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
                            max={payableSubtotal}
                            value={methodAmounts["cash"] || ""}
                            onChange={(e) => updateMethodAmount("cash", e.target.value)}
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-[#00C1A7] focus:border-[#00C1A7] placeholder:text-gray-400"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    )}
                    {/* Mensaje de abonar al recibir cuando se selecciona efectivo */}
                    {selectedMethods.includes("cash") && (
                      <div className="px-3 md:px-4 pb-3 md:pb-4">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs md:text-sm text-blue-800">
                              {isThirdPartyTransport ? (
                                <>
                                  <span className="font-semibold">Abonarás al recibir</span> - La orden se generará normalmente
                                </>
                              ) : isPaisCatalog ? (
                                <span className="font-semibold">Completarás la venta por WhatsApp</span>
                              ) : (
                                <>
                                  <span className="font-semibold">Abonarás al recibir</span> - Pagarás con efectivo cuando recibas tu pedido
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Transferencia — con transporte tercerizado se completa la venta por WhatsApp */}
                  <div
                    className={`border rounded-lg transition-colors ${
                      selectedMethods.includes("transfer")
                        ? "border-[#00C1A7] bg-[#00C1A7]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <label
                      className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 ${payableSubtotal <= 0.01 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <input
                        type="checkbox"
                        disabled={payableSubtotal <= 0.01}
                        checked={selectedMethods.includes("transfer")}
                        onChange={() => togglePaymentMethod("transfer")}
                        className="w-4 h-4 rounded border-gray-300 text-[#00C1A7] focus:ring-[#00C1A7] disabled:opacity-50"
                      />
                      <ArrowRightLeft className="w-5 h-5 text-gray-600" />
                      <div className="flex-1">
                        <span className="font-medium text-gray-900 text-sm md:text-base">Transferencia</span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {isThirdPartyTransport || isPaisCatalog
                            ? "Completarás la venta por WhatsApp"
                            : "Abonás al recibir"}
                        </p>
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
                            max={payableSubtotal}
                            value={methodAmounts["transfer"] || ""}
                            onChange={(e) => updateMethodAmount("transfer", e.target.value)}
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-[#00C1A7] focus:border-[#00C1A7] placeholder:text-gray-400"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    )}
                    {/* Mensaje de abonar al recibir cuando se selecciona transferencia */}
                    {selectedMethods.includes("transfer") && (
                      <div className="px-3 md:px-4 pb-3 md:pb-4">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs md:text-sm text-blue-800">
                              {isThirdPartyTransport || isPaisCatalog ? (
                                <span className="font-semibold">Completarás la venta por WhatsApp</span>
                              ) : (
                                <>
                                  <span className="font-semibold">Abonarás al recibir</span> - Pagarás con
                                  transferencia cuando recibas tu pedido
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Multi-payment summary */}
                {isMultiPayment && (
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Total asignado:</span>
                      <span className={`font-semibold ${Math.abs(totalAssigned - payableTotal) < 0.01 ? 'text-green-600' : 'text-amber-600'}`}>
                        {formatPrice(totalAssigned)} / {formatPrice(payableTotal)}
                      </span>
                    </div>
                    {remainingToAssign > 0.01 && (
                      <p className="text-xs text-amber-600 mt-1">
                        Falta asignar {formatPrice(remainingToAssign)} para cubrir lo pendiente
                      </p>
                    )}
                    {totalAssigned > payableTotal + 0.01 && (
                      <p className="text-xs text-red-600 mt-1">
                        El monto asignado excede lo pendiente en {formatPrice(totalAssigned - payableTotal)}
                      </p>
                    )}
                    {Math.abs(totalAssigned - payableTotal) <= 0.01 && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ El monto a abonar está cubierto correctamente
                      </p>
                    )}
                  </div>
                )}

                {/* Cuotas y Bancos - Solo cuando se selecciona tarjeta */}
                {hasCardPayment && (
                  <div className="mt-6 pt-5 border-t border-gray-200 space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-800">Tarjeta, banco y cuotas</h3>
                    {errors.card_installment && (
                      <p className="text-red-500 text-sm">{errors.card_installment}</p>
                    )}
                    {(() => {
                      const cardData = cardBankData;
                      const cardTypesOptions = cardTypes.map((ct: CardType) => ({
                        value: ct.code,
                        label: ct.name,
                      }));

                      const getBanks = (cardType: string) => {
                        if (!cardType || !cardData[cardType]) return [];
                        return Object.keys(cardData[cardType]);
                      };

                      const getInstallments = (cardType: string, bank: string) => {
                        if (!cardType || !bank || !cardData[cardType]?.[bank]) return [];
                        return sortInstallmentOptions(cardData[cardType][bank]);
                      };

                      const banks = getBanks(selectedCardType);
                      const installments = getInstallments(selectedCardType, selectedBank);
                      const baseAmount = isMultiPayment
                        ? methodAmounts["card"] || 0
                        : payableSubtotal;

                      const clearCardError = () => {
                        if (errors.card_installment) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.card_installment;
                            return next;
                          });
                        }
                      };

                      return (
                        <div className="space-y-4">
                          {/* Tipo de tarjeta */}
                          <div>
                            <label className="block text-sm text-gray-600 mb-2">
                              Tipo de tarjeta <span className="text-red-400">*</span>
                            </label>
                            {cardTypesOptions.length > 0 && cardTypesOptions.length <= 6 ? (
                              <div className="flex flex-wrap gap-2">
                                {cardTypesOptions.map((type) => (
                                  <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCardType(type.value);
                                      setSelectedBank("");
                                      setSelectedInstallmentKey("");
                                      clearCardError();
                                    }}
                                    className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                                      selectedCardType === type.value
                                        ? "border-[#00C1A7] bg-[#00C1A7]/10 text-[#00C1A7] font-medium"
                                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                                    }`}
                                  >
                                    {type.label}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <select
                                value={selectedCardType}
                                onChange={(e) => {
                                  setSelectedCardType(e.target.value);
                                  setSelectedBank("");
                                  setSelectedInstallmentKey("");
                                  clearCardError();
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-[#00C1A7] focus:border-[#00C1A7] bg-white"
                              >
                                <option value="">Seleccioná un tipo de tarjeta</option>
                                {cardTypesOptions.map((type) => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          {/* Banco */}
                          {selectedCardType && (
                            <div>
                              <label className="block text-sm text-gray-600 mb-2">
                                Banco <span className="text-red-400">*</span>
                              </label>
                              <select
                                value={selectedBank}
                                onChange={(e) => {
                                  setSelectedBank(e.target.value);
                                  setSelectedInstallmentKey("");
                                  clearCardError();
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-[#00C1A7] focus:border-[#00C1A7] bg-white"
                              >
                                <option value="">Seleccioná tu banco</option>
                                {banks.map((bank) => (
                                  <option key={bank} value={bank}>
                                    {bank}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Cuotas */}
                          {selectedCardType && selectedBank && installments.length > 0 && (
                            <div>
                              <label className="block text-sm text-gray-600 mb-2">
                                Cuotas <span className="text-red-400">*</span>
                              </label>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {installments.map((inst, index) => {
                                  const { totalAmount, cuotaAmount } =
                                    calculateInstallmentAmounts(baseAmount, inst);
                                  const optionKey = installmentOptionKey(inst);
                                  const isSelected = selectedInstallmentKey === optionKey;

                                  return (
                                    <button
                                      key={optionKey || index}
                                      type="button"
                                      onClick={() => {
                                        setSelectedInstallmentKey(optionKey);
                                        clearCardError();
                                      }}
                                      className={`p-3 rounded-lg border text-center transition-colors ${
                                        isSelected
                                          ? "border-[#00C1A7] bg-[#00C1A7]/10 shadow-sm"
                                          : "border-gray-200 bg-white hover:border-gray-300"
                                      }`}
                                    >
                                      <p className={`text-sm font-semibold tabular-nums ${isSelected ? "text-[#00C1A7]" : "text-gray-900"}`}>
                                        {inst.cuotas === 1
                                          ? `1 cuota de ${formatPrice(cuotaAmount)}`
                                          : `${inst.cuotas} x ${formatPrice(cuotaAmount)}`}
                                      </p>
                                      <p className="text-xs text-gray-400 mt-0.5 tabular-nums">
                                        Total {formatPrice(totalAmount)}
                                      </p>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    </div>
                  </div>
                )}

                {/* Pay on delivery info for cash and transfer */}
                {(selectedMethods.includes("cash") || selectedMethods.includes("transfer")) && !hasCardPayment && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-[#00C1A7]" />
                      <div>
                        <span className="font-medium text-gray-900">
                          {isPaisCatalog ? "Completar por WhatsApp" : "Pagar al recibir"}
                        </span>
                        <p className="text-sm text-gray-500">
                          {isPaisCatalog ? "Completarás la venta por WhatsApp" : "Pagas cuando recibas tu pedido"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Código de Referido */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de referido (opcional)
                  </label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                      setReferralCode(value);
                      if (errors.referral_code) {
                        setErrors((prev) => ({ ...prev, referral_code: "" }));
                      }
                    }}
                    placeholder="BAUSING-XXXXXX"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900 placeholder:text-gray-400"
                  />
                  {errors.referral_code && (
                    <p className="text-xs text-red-500 mt-1">{errors.referral_code}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Si alguien te refirió, ingresa su código aquí
                  </p>
                </div>

                {/* Botón Finalizar compra: solo en responsive (móvil/tablet), al final del formulario */}
                <div className="lg:hidden mt-6 pt-6 border-t border-gray-200">
                  {/* Aviso de que se abonará al recibir */}
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-800">
                        <span className="font-semibold">Importante:</span>{" "}
                        {isPaisCatalog ? "Completarás la venta por WhatsApp." : "Abonarás cuando recibas tu pedido."}
                      </p>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || paisViacargoBloqueaFinalizar || loadingPrices || shippingQuoteLoading}
                    className="w-full bg-[#00C1A7] text-white py-3 px-6 rounded-lg font-semibold text-base hover:bg-[#00A892] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1 order-1 lg:order-2">
              <div className="bg-white border border-gray-200 rounded-[14px] p-4 md:p-6 lg:sticky lg:top-42 lg:max-h-[calc(100vh-1rem)] lg:overflow-y-auto">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">
                  Resumen del pedido
                </h2>
                <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                  {cart.map((item) => {
                    const unitPrice = getItemUnitPrice(item);
                    return (
                      <div key={item.id} className="flex gap-2 md:gap-3 pb-3 md:pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs md:text-sm font-medium text-gray-900 truncate mb-1.5">
                            {item.name}
                          </p>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs text-gray-500">Cantidad:</span>
                            <span className="text-xs font-medium text-gray-700">{item.quantity}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-gray-500">Precio unitario:</span>
                            <span className="text-xs font-medium text-gray-700">
                              {formatPrice(unitPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Subtotal</span>
                    {loadingPrices ? (
                      <span className="inline-block h-4 w-20 rounded-md bg-gray-200 animate-pulse" />
                    ) : (
                      <span className="text-sm font-semibold text-gray-900">
                        {formatPrice(subtotal)}
                      </span>
                    )}
                  </div>
                  {couponDiscount > 0.01 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-[#00A896]">
                        Cupón{appliedCoupon?.clubBeneficiosOnly ? " (Club Beneficios)" : ""}
                      </span>
                      <span className="text-sm font-semibold text-[#00A896]">
                        −{formatPrice(couponDiscount)}
                      </span>
                    </div>
                  )}

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
                  {isMultiPayment && selectedMethods.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {selectedMethods.map((method) => (
                        <div key={method} className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-500">
                            {method === "card"
                              ? selectedInstallment
                                ? `Tarjeta (${formatInstallmentCuotasLabel(selectedInstallment.cuotas)})`
                                : "Tarjeta"
                              : method === "cash"
                                ? "Efectivo"
                                : "Transferencia"}
                          </span>
                          <span className="text-xs font-semibold text-gray-600">
                            {formatPrice(getEffectiveMethodAmount(method))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {hasCardPayment && selectedInstallment && (
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-sm font-medium text-gray-700">Cuotas</span>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatInstallmentCuotasLabel(selectedInstallment.cuotas)}
                        </span>
                        {selectedInstallmentAmounts && (
                          <p className="text-xs text-gray-500 mt-0.5 tabular-nums">
                            {selectedInstallment.cuotas === 1 ? "Cuota de" : "Cuotas de"}{" "}
                            {formatPrice(selectedInstallmentAmounts.cuotaAmount)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Shipping */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Envío</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {loadingPrices ? (
                        <span
                          className="inline-block align-middle h-5 min-w-[5rem] rounded-md bg-gray-200 animate-pulse ml-auto"
                          aria-busy="true"
                          aria-label="Calculando costo de envío"
                        />
                      ) : isThirdPartyTransport ? (
                        configuredShippingPrice !== null ? (
                          formatPrice(configuredShippingPrice)
                        ) : localityShippingProblem ? (
                          <span className="text-red-600 text-xs font-medium text-right block max-w-[200px] ml-auto leading-snug">
                            Ingresá una localidad correcta
                          </span>
                        ) : shippingQuoteLoading ? (
                          <span
                            className="inline-block align-middle h-5 min-w-[5rem] rounded-md bg-gray-200 animate-pulse ml-auto"
                            aria-busy="true"
                            aria-label="Calculando costo de envío"
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">Calculando...</span>
                        )
                      ) : isPaisCatalog ? (
                        localityShippingProblem ? (
                          <span className="text-red-600 text-xs font-medium text-right block max-w-[200px] ml-auto leading-snug">
                            Ingresá un código postal válido en la dirección de envío
                          </span>
                        ) : viacargoQuoteError ? (
                          <span className="text-red-600 text-xs font-medium text-right block max-w-[200px] ml-auto leading-snug">
                            {viacargoQuoteError}
                          </span>
                        ) : shippingQuoteLoading || viacargoCotizarLoading ? (
                          <span
                            className="inline-block align-middle h-5 min-w-[5rem] rounded-md bg-gray-200 animate-pulse ml-auto"
                            aria-busy="true"
                            aria-label="Calculando costo de envío"
                          />
                        ) : viacargoQuoteTotal !== null ? (
                          formatPrice(viacargoQuoteTotal)
                        ) : (
                          <span className="text-gray-400 text-xs">Calculando...</span>
                        )
                      ) : shippingQuoteLoading ? (
                        <span
                          className="inline-block align-middle h-5 min-w-[5rem] rounded-md bg-gray-200 animate-pulse ml-auto"
                          aria-busy="true"
                          aria-label="Calculando costo de envío"
                        />
                      ) : (
                        <span className="text-green-600 text-xs">Envío gratis</span>
                      )}
                    </span>
                  </div>
                  {isPaisCatalog && viacargoQuoteTotal !== null && (
                    <p className="text-xs text-gray-500 mt-1">
                      * Precio estimado. Modalidad de entrega: retiro en sucursal Viacargo.
                    </p>
                  )}
                  {!shippingQuoteLoading && (() => {
                    const estimatedDeliveryText = formatEstimatedDelivery({
                      estimated_delivery_days_min: estimatedDeliveryDaysMin,
                      estimated_delivery_days_max: estimatedDeliveryDaysMax,
                    });
                    if (!estimatedDeliveryText) return null;
                    return (
                      <p className="text-xs text-gray-500 mt-1">
                        Entrega estimada: {estimatedDeliveryText}
                      </p>
                    );
                  })()}

                  {/* Total */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-base md:text-lg font-semibold text-gray-900">Total</span>
                      {loadingPrices ? (
                        <span className="inline-block h-6 w-24 rounded-md bg-gray-200 animate-pulse" />
                      ) : (
                        <span className="text-lg md:text-xl font-bold text-gray-900">
                          {formatPrice(finalTotal)}
                        </span>
                      )}
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
                
                {/* Aviso de que se abonará al recibir - Desktop */}
                <div className="hidden lg:block mt-4 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">Importante:</span>{" "}
                      {isPaisCatalog ? "Completarás la venta por WhatsApp." : "Abonarás cuando recibas tu pedido."}
                    </p>
                  </div>
                </div>
                {/* Botón Finalizar compra: solo en desktop (lg+) */}
                <button
                  type="submit"
                  disabled={submitting || paisViacargoBloqueaFinalizar || loadingPrices || shippingQuoteLoading}
                  className="hidden lg:flex w-full mt-4 md:mt-6 bg-[#00C1A7] text-white py-2.5 md:py-3 px-4 md:px-6 rounded-lg font-semibold text-sm md:text-base hover:bg-[#00A892] transition-colors disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
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

