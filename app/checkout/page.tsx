"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import wsrvLoader from "@/lib/wsrvLoader";
import CheckoutSelect from "@/components/CheckoutSelect";
import CheckoutChoice from "@/components/CheckoutChoice";
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
  validateReferralCode,
  fetchCardTypes,
  fetchCardBankData,
  formatEstimatedDelivery,
  fetchAccessoriesShippingQuote,
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
  ChevronDown,
  MessageCircle,
} from "lucide-react";
import {
  formatPrice,
  calculateProductPrice,
  checkoutPaymentPriceKind,
  productFromCheckoutPricesApi,
  PRICE_UI_CARD_CAPTION,
  PRICE_UI_TRANSFER_CAPTION,
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
import {
  trackContact,
  trackInitiateCheckout,
} from "@/lib/meta/track";
import { META_CURRENCY, parseArsPrice } from "@/lib/meta/parsePrice";
import { trackWhatsAppClick } from "@/lib/whatsappTrack";

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

type CheckoutStep = 1 | 2 | 3;

const CHECKOUT_STEPS: { id: CheckoutStep; label: string }[] = [
  { id: 1, label: "Contacto y entrega" },
  { id: 2, label: "Pago" },
  { id: 3, label: "Revisión" },
];

// Claves de error que pertenecen al paso de pago; el resto pertenece al paso 1.
const PAYMENT_STEP_ERROR_KEYS = ["payment_method", "card_installment", "referral_code"];

const CHECKOUT_DRAFT_KEY = "bausing_checkout_draft";

// Etiquetas legibles para el aviso "Falta completar" del botón Continuar
const FIELD_ERROR_LABELS: Record<string, string> = {
  first_name: "Nombre",
  last_name: "Apellido",
  document_type: "Tipo de documento",
  dni: "Documento",
  phone: "Celular",
  email: "Email",
  address: "Dirección",
  address_full_name: "Nombre del destinatario",
  address_phone: "Teléfono del destinatario",
  address_street: "Calle",
  address_number: "Número",
  address_postal_code: "Código postal",
  address_city: "Ciudad",
  address_province: "Provincia",
  payment_method: "Método de pago",
  card_installment: "Tarjeta y cuotas",
  referral_code: "Código de referido",
};

const roundMoney = (n: number): number => Math.round(n * 100) / 100;

/** Redondea a centavos y vuelca la diferencia residual en un método para que la suma cierre */
const normalizeAmounts = (
  amounts: Record<string, number>,
  methods: string[],
  total: number,
  keepMethod?: string,
): Record<string, number> => {
  const out = { ...amounts };
  methods.forEach((m) => {
    if (out[m] !== undefined) out[m] = roundMoney(out[m]);
  });
  if (methods.length < 2) return out;
  const sum = methods.reduce((acc, m) => acc + (out[m] || 0), 0);
  const diff = roundMoney(total - sum);
  if (Math.abs(diff) >= 0.01 && Math.abs(diff) < 0.1) {
    const target = [...methods].reverse().find((m) => m !== keepMethod) ?? methods[methods.length - 1];
    out[target] = Math.max(1, roundMoney((out[target] || 0) + diff));
  }
  return out;
};

/** Input de monto: se confirma al salir del campo o con Enter (no redistribuye en cada tecla) */
function MethodAmountInput({
  id,
  label,
  value,
  onCommit,
}: {
  id: string;
  label: string;
  value: number;
  onCommit: (raw: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft ?? (value ? String(roundMoney(value)) : "");

  const commit = () => {
    if (draft === null) return;
    // "1.500,50" -> "1500.50"
    const normalized = draft.includes(",") ? draft.replace(/\./g, "").replace(",", ".") : draft;
    onCommit(normalized);
    setDraft(null);
  };

  return (
    <div className="px-3 md:px-4 pb-3 md:pb-4">
      <label htmlFor={id} className="text-xs text-gray-500 mb-1 block">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={display}
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9.,]/g, ""))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00C1A7] placeholder:text-gray-400"
          placeholder="0,00"
        />
      </div>
    </div>
  );
}

const isValidPhone = (value: string): boolean => {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
};

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
  /** Envío acordado para carritos 100% "Almohadas y accesorios" en zona local (no tercerizada, no Catálogo País) */
  const [accessoriesShippingPrice, setAccessoriesShippingPrice] = useState<number | null>(null);
  const [accessoriesShippingLoading, setAccessoriesShippingLoading] = useState(false);
  const [currentCatalogId, setCurrentCatalogId] = useState<string | null>(null);
  const initiateCheckoutTrackedRef = useRef(false);


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
  const [step, setStep] = useState<CheckoutStep>(1);
  /** Se llegó a editar un paso desde la revisión: al terminar se vuelve directo al paso 3 */
  const [returnToReview, setReturnToReview] = useState(false);
  /** El invitado ya tiene cuenta creada (se registra al guardar la dirección) */
  const [accountCreated, setAccountCreated] = useState(false);
  /** Acción sugerida para corregir un error devuelto por el servidor al confirmar */
  const [submitFix, setSubmitFix] = useState<{ step: CheckoutStep; label: string } | null>(null);
  /** El destinatario es quien compra: copia nombre/teléfono del contacto a la dirección nueva */
  const [recipientIsSelf, setRecipientIsSelf] = useState(true);
  const stepperRef = useRef<HTMLElement | null>(null);
  const selfRecipientActive = showAddressForm && recipientIsSelf && !editingAddressId;
  const draftRestoredRef = useRef(false);
  const [isPaisCatalog, setIsPaisCatalog] = useState<boolean>(false);
  const PAIS_CATALOG_ID = "8335e521-f25a-4f92-8f59-c4439671ef26";
  const [estimatedDeliveryDaysMin, setEstimatedDeliveryDaysMin] = useState<number | null>(null);
  const [estimatedDeliveryDaysMax, setEstimatedDeliveryDaysMax] = useState<number | null>(null);
  const [referralCode, setReferralCode] = useState<string>("");
  const [referralCodeValidating, setReferralCodeValidating] = useState<boolean>(false);
  const [referralStatus, setReferralStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [referralMessage, setReferralMessage] = useState("");
  const [showCodes, setShowCodes] = useState(false);
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

  // Meta InitiateCheckout: al comenzar el proceso de compra
  useEffect(() => {
    if (initiateCheckoutTrackedRef.current) return;
    if (cart.length === 0) return;

    initiateCheckoutTrackedRef.current = true;
    const content_ids = cart.map((item) => item.id);
    const contents = cart.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      item_price: parseArsPrice(item.price),
    }));
    const value = contents.reduce(
      (sum, item) => sum + (item.item_price || 0) * item.quantity,
      0,
    );
    const num_items = cart.reduce((sum, item) => sum + item.quantity, 0);

    trackInitiateCheckout({
      content_ids,
      contents,
      value,
      currency: META_CURRENCY,
      num_items,
    });
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

  // Al elegir tipo y banco, dejar preseleccionado el pago en 1 cuota (si existe)
  useEffect(() => {
    if (!selectedCardType || !selectedBank) return;
    const options = cardBankData[selectedCardType]?.[selectedBank] ?? [];
    const oneShot = sortInstallmentOptions(options).find((o) => o.cuotas === 1);
    if (oneShot) setSelectedInstallmentKey(installmentOptionKey(oneShot));
  }, [selectedCardType, selectedBank, cardBankData]);

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

  // Restaurar borrador del invitado (sobrevive a recargas de la pestaña)
  useEffect(() => {
    try {
      if (localStorage.getItem("user_token")) return;
      const raw = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft?.formData) {
          setFormData((prev) => ({ ...prev, ...draft.formData }));
        }
        if (draft?.addressForm) {
          setAddressForm((prev) => ({ ...prev, ...draft.addressForm }));
        }
        if (typeof draft?.recipientIsSelf === "boolean") {
          setRecipientIsSelf(draft.recipientIsSelf);
        }
      }
    } catch {
      /* sessionStorage no disponible o borrador inválido */
    } finally {
      draftRestoredRef.current = true;
    }
  }, []);

  // Guardar borrador solo para invitados
  useEffect(() => {
    if (!draftRestoredRef.current || isAuthenticated || orderCompleted) return;
    try {
      sessionStorage.setItem(
        CHECKOUT_DRAFT_KEY,
        JSON.stringify({ formData, addressForm, recipientIsSelf }),
      );
    } catch {
      /* sessionStorage no disponible */
    }
  }, [formData, addressForm, recipientIsSelf, isAuthenticated, orderCompleted]);

  useEffect(() => {
    if (!orderCompleted) return;
    try {
      sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
    } catch {
      /* sessionStorage no disponible */
    }
  }, [orderCompleted]);

  // Tipo de documento por defecto: DNI
  useEffect(() => {
    if (docTypes.length === 0) return;
    setFormData((prev) => {
      if (prev.document_type) return prev;
      const dniType = docTypes.find((d) => {
        const name = d.name.trim().toLowerCase();
        return name === "dni" || name.includes("documento nacional");
      });
      return dniType ? { ...prev, document_type: dniType.id } : prev;
    });
  }, [docTypes]);

  // Destinatario = comprador: mantener nombre y teléfono de la dirección sincronizados con el contacto
  useEffect(() => {
    if (!selfRecipientActive) return;
    const fullName = `${formData.first_name} ${formData.last_name}`.trim();
    setAddressForm((prev) =>
      prev.full_name === fullName && prev.phone === formData.phone
        ? prev
        : { ...prev, full_name: fullName, phone: formData.phone },
    );
  }, [selfRecipientActive, formData.first_name, formData.last_name, formData.phone]);

  // Historial: el botón "atrás" del navegador vuelve al paso anterior en vez de salir del checkout
  useEffect(() => {
    try {
      window.history.replaceState({ ...(window.history.state ?? {}), checkoutStep: 1 }, "");
    } catch {
      /* history no disponible */
    }
    const onPopState = (event: PopStateEvent) => {
      const target = event.state?.checkoutStep;
      setStep(target === 2 || target === 3 ? target : 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Al fallar la confirmación, llevar la vista al mensaje
  useEffect(() => {
    if (step === 3 && errors.submit) scrollToFirstError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors.submit, step]);

  // Foco accesible al cambiar de paso
  const firstStepRenderRef = useRef(true);
  useEffect(() => {
    if (firstStepRenderRef.current) {
      firstStepRenderRef.current = false;
      return;
    }
    stepperRef.current?.focus({ preventScroll: true });
  }, [step]);

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
      // Completa solo lo vacío: no pisar lo que el usuario ya tipeó (p. ej. invitado recién registrado)
      setFormData((prev) => ({
        first_name: prev.first_name || user.first_name || "",
        last_name: prev.last_name || user.last_name || "",
        document_type: prev.document_type,
        dni: prev.dni || user.dni || "",
        phone: prev.phone || user.phone || "",
        alternate_phone: prev.alternate_phone,
        email: user.email || prev.email,
      }));
      try {
        sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
      } catch {
        /* sessionStorage no disponible */
      }
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
      setCurrentCatalogId(null);
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
                  setCurrentCatalogId(catalogData.data.catalog_id);
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

  const handleAddressInputChange = (field: string, value: string) => {
    const v = field === "postal_code" ? postalCodeDigitsOnly(value) : value;
    setAddressForm((prev) => ({ ...prev, [field]: v }));
    const errorKey = field === "province_id" ? "address_province" : `address_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: "" }));
    }
  };

  // Validación al salir de un campo (solo ese campo, sin tocar el resto de errores)
  const handleFieldBlur = (key: string) => {
    const all = {
      ...computeFormErrors(1),
    };
    const message = all[key] ?? "";
    setErrors((prev) => (prev[key] === message ? prev : { ...prev, [key]: message }));
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
    setRecipientIsSelf(true);
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
    // No se cambia la dirección seleccionada al abrir la edición: se selecciona y sincroniza al guardar
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
    } else if (!isValidPhone(addressForm.phone)) {
      addressErrors.address_phone = "Ingresá un teléfono válido (entre 8 y 15 dígitos)";
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

  const computeFormErrors = (scope: "all" | 1 | 2 = "all"): Record<string, string> => {
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
    } else if (!isValidPhone(formData.phone)) {
      newErrors.phone = "Ingresá un celular válido (entre 8 y 15 dígitos)";
    }
    if (!formData.email.trim()) {
      newErrors.email = "El email es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El email no es válido";
    }
    if (!selectedAddressId && !showAddressForm) {
      newErrors.address = "Seleccioná o agregá una dirección de entrega";
    }
    if (showAddressForm) {
      const addressFormErrors = collectAddressFormErrors();
      if (selfRecipientActive) {
        // Nombre y teléfono del destinatario se toman del contacto, que ya se valida arriba
        delete addressFormErrors.address_full_name;
        delete addressFormErrors.address_phone;
      }
      Object.assign(newErrors, addressFormErrors);
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

    if (referralCode.trim() && referralStatus === "invalid") {
      newErrors.referral_code = referralMessage || "El código de referido no es válido";
    }

    if (payableSubtotalVal > 0.01) {
      if (selectedMethods.length === 0) {
        newErrors.payment_method = "Seleccioná al menos un método de pago para el monto a abonar";
      }
      if (!enableMultiPayment && selectedMethods.length > 1) {
        newErrors.payment_method =
          "Solo podés seleccionar un método de pago. Tocá «Pagar con más de un método» para usar varios.";
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

    if (scope !== "all") {
      for (const key of Object.keys(newErrors)) {
        const belongsToPayment = PAYMENT_STEP_ERROR_KEYS.includes(key);
        if (belongsToPayment !== (scope === 2)) {
          delete newErrors[key];
        }
      }
    }

    return newErrors;
  };

  const validateForm = (scope: "all" | 1 | 2 = "all"): boolean => {
    const newErrors = computeFormErrors(scope);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToStep = (target: CheckoutStep) => {
    if (target === step) return;
    if (target === 3) setReturnToReview(false);
    setSubmitFix(null);
    setErrors((prev) => (prev.submit ? { ...prev, submit: "" } : prev));
    if (typeof window !== "undefined") {
      const historyStep = window.history.state?.checkoutStep;
      if (target > step) {
        window.history.pushState({ ...(window.history.state ?? {}), checkoutStep: target }, "");
        setStep(target);
      } else if (historyStep === step) {
        // popstate actualiza el paso y mantiene el historial consistente
        window.history.go(target - step);
        return;
      } else {
        setStep(target);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setStep(target);
    }
  };

  /** Editar desde la revisión: al terminar el paso se vuelve directo a la revisión */
  const editFromReview = (target: CheckoutStep) => {
    setReturnToReview(true);
    goToStep(target);
  };

  /** Lleva la vista al primer campo con error (tras renderizar los mensajes) */
  const scrollToFirstError = () => {
    if (typeof window === "undefined") return;
    window.setTimeout(() => {
      const el = document.querySelector<HTMLElement>(".border-red-500, [data-form-error]");
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) {
        el.focus({ preventScroll: true });
      }
    }, 60);
  };

  const validateReferral = async (): Promise<boolean> => {
    const code = referralCode.trim().toUpperCase();
    if (!code) {
      setReferralStatus("idle");
      setReferralMessage("");
      return true;
    }
    if (referralStatus === "valid") return true;
    setReferralCodeValidating(true);
    try {
      const result = await validateReferralCode(code);
      if (result.valid) {
        setReferralStatus("valid");
        setReferralMessage(result.message || "Código de referido válido");
        setErrors((prev) => ({ ...prev, referral_code: "" }));
        return true;
      }
      const message = result.message || "El código de referido no es válido";
      setReferralStatus("invalid");
      setReferralMessage(message);
      setErrors((prev) => ({ ...prev, referral_code: message }));
      return false;
    } catch {
      // No bloquear la compra por un fallo de red/servidor: el backend vuelve a validar al crear la orden
      setReferralStatus("idle");
      setReferralMessage("No pudimos validar el código ahora; lo verificaremos al confirmar.");
      return true;
    } finally {
      setReferralCodeValidating(false);
    }
  };

  const handleNextStep = async () => {
    if (isSubmittingRef.current || saveAddressInFlightRef.current) return;
    if (loadingPrices || shippingQuoteLoading) return;
    setErrors({});

    if (step === 1) {
      if (!validateForm(1)) {
        scrollToFirstError();
        return;
      }
      // Dirección nueva sin guardar: se guarda (y se registra al invitado) antes de cotizar el envío
      if (showAddressForm) {
        const saved = await handleSaveAddress();
        if (!saved) {
          scrollToFirstError();
          return;
        }
      }
      // Si se editó desde la revisión y el pago sigue siendo válido, se vuelve directo al paso 3
      const paymentStillValid = Object.keys(computeFormErrors(2)).length === 0;
      goToStep(returnToReview && paymentStillValid ? 3 : 2);
      return;
    }

    if (step === 2) {
      if (!(await validateReferral())) {
        setShowCodes(true);
        scrollToFirstError();
        return;
      }
      if (!validateForm(2)) {
        scrollToFirstError();
        return;
      }
      goToStep(3);
    }
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
            setErrors({ email: "Ya tenés una cuenta con este email. Iniciá sesión para continuar." });
          } else {
            setErrors({ address: autoRegResult.error || "Error al crear la cuenta" });
          }
          return false;
        }
        const { user: newUser, token: newToken } = autoRegResult.data;
        setAccountCreated(true);
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

    // Enter dentro de un input en los pasos 1-2 avanza el wizard en vez de enviar la orden
    if (step < 3) {
      void handleNextStep();
      return;
    }

    // Limpiar errores previos
    setErrors({});
    setSubmitFix(null);

    // Validar por paso; si algo falla, volver al paso correspondiente
    if (!validateForm(1)) {
      goToStep(1);
      scrollToFirstError();
      return;
    }
    if (!validateForm(2)) {
      goToStep(2);
      scrollToFirstError();
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
        setErrors({ address: "Seleccioná una dirección de entrega" });
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
              trackContact();
              trackWhatsAppClick("checkout");
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
              trackContact();
              trackWhatsAppClick("checkout");
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
              trackContact();
              trackWhatsAppClick("checkout");
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
        // Costo de envío tercerizado: no está incluido en payment_methods[].amount,
        // se manda aparte para que el backend lo agregue como renglón propio en el CRM.
        ...(isThirdPartyTransport && shippingCost > 0 && {
          shipping_cost: shippingCost,
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
      let fix: { step: CheckoutStep; label: string } | null = null;
      let fieldErrors: Record<string, string> = {};
      
      if (errorMessage.includes("Tipo de documento DNI no es compatible con tipo de venta mayor a 1") ||
          errorMessage.includes("Tipo de documento DNI no es compatible")) {
        errorMessage = "Para este tipo de venta tenés que usar CUIT o CUIL en lugar de DNI.";
        fix = { step: 1, label: "Cambiar el tipo de documento" };
        fieldErrors = { document_type: "Para este tipo de venta usá CUIT o CUIL" };
      }
      
      // Detectar error de precio de compra / stock
      if (errorMessage.includes("No se pudo obtener el precio de compra") ||
          errorMessage.includes("compras previas registradas") ||
          errorMessage.includes("este artículo no tiene stock")) {
        errorMessage = "Lo sentimos, pero uno de los artículos no tiene stock.";
        fix = { step: 1, label: "Revisar los productos del pedido" };
      }
      
      // Detectar error de localidad no encontrada
      if (errorMessage.includes("No se pudo obtener crm_zone_id para la localidad") ||
          (errorMessage.includes("no se encontró") && errorMessage.includes("localidad")) ||
          errorMessage.includes("zona de entrega para")) {
        errorMessage = "No encontramos la localidad ingresada. Revisá que la dirección sea correcta.";
        fix = { step: 1, label: "Revisar la dirección" };
      }
      
      // Detectar error de teléfono inválido para WhatsApp (validación CRM)
      if (errorMessage.toLowerCase().includes("mensajer") && errorMessage.toLowerCase().includes("whatsapp") ||
          errorMessage.toLowerCase().includes("cliente_telefono") ||
          errorMessage.toLowerCase().includes("formato inv") && errorMessage.toLowerCase().includes("tel")) {
        errorMessage = "Ingresá un teléfono válido";
        fix = { step: 1, label: "Corregir el teléfono" };
        fieldErrors = { phone: "Ingresá un teléfono válido" };
      }

      // Detectar errores de pago rechazado (pero no tratar in_process como error)
      if (errorMessage.includes("rejected") || (errorMessage.includes("El pago fue") && !errorMessage.includes("in_process") && !errorMessage.includes("pending_contingency"))) {
        errorMessage = "No pudimos procesar el pago. Probá con otro método de pago.";
        fix = { step: 2, label: "Cambiar el método de pago" };
      }
      
      setErrors({ submit: errorMessage, ...fieldErrors });
      setSubmitFix(fix);
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
      if (!(data.discount_amount > 0.01)) {
        setAppliedCoupon(null);
        setCouponError(
          "El cupón es válido, pero no aplica a los productos ni al método de pago elegidos.",
        );
        return;
      }
      setAppliedCoupon({
        code: data.code,
        discountAmount: data.discount_amount,
        clubBeneficiosOnly: data.club_beneficios_only,
      });
      setCouponInput(data.code);
      setShowCodes(true);
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
          if (!(data.discount_amount > 0.01)) {
            setAppliedCoupon(null);
            setCouponError("El cupón dejó de aplicar con los productos o el método de pago actuales.");
            return;
          }
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
      } catch (e) {
        // Fallo de red: conservar el cupón y el último descuento conocido
        if (e instanceof TypeError) return;
        if (!cancelled) {
          setAppliedCoupon(null);
          setCouponError("El cupón ya no aplica con este método de pago o estos productos");
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

  // Envío acordado para accesorios: solo zona local (no tercerizada, no Catálogo País), por catálogo
  useEffect(() => {
    if (isThirdPartyTransport || isPaisCatalog || !currentCatalogId || cart.length === 0) {
      setAccessoriesShippingPrice(null);
      setAccessoriesShippingLoading(false);
      return;
    }

    const ac = new AbortController();
    setAccessoriesShippingLoading(true);
    (async () => {
      try {
        const result = await fetchAccessoriesShippingQuote(
          cart.map((item) => item.id),
          currentCatalogId,
          ac.signal,
        );
        if (ac.signal.aborted) return;
        setAccessoriesShippingPrice(result.applies ? result.price : null);
      } catch (e) {
        if (ac.signal.aborted) return;
        setAccessoriesShippingPrice(null);
      } finally {
        if (!ac.signal.aborted) setAccessoriesShippingLoading(false);
      }
    })();

    return () => ac.abort();
  }, [isThirdPartyTransport, isPaisCatalog, currentCatalogId, cart]);

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
  } else if (!isThirdPartyTransport && !isPaisCatalog && accessoriesShippingPrice !== null) {
    shippingCost = accessoriesShippingPrice;
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

  // La venta se completa por WhatsApp (no se crea orden en el sitio)
  const willCompleteViaWhatsApp =
    isPaisCatalog ||
    (isThirdPartyTransport && (selectedMethods.includes("card") || selectedMethods.includes("transfer")));
  const finalizeLabel = willCompleteViaWhatsApp ? "Continuar por WhatsApp" : "Confirmar pedido";
  const finalizeBusyLabel = willCompleteViaWhatsApp ? "Redirigiendo a WhatsApp…" : "Confirmando tu pedido…";
  const nextButtonLabel = returnToReview ? "Guardar y volver a la revisión" : "Continuar";
  const shippingPending =
    loadingPrices ||
    shippingQuoteLoading ||
    (isPaisCatalog && !isThirdPartyTransport && viacargoCotizarLoading) ||
    (!isPaisCatalog && !isThirdPartyTransport && accessoriesShippingLoading);
  const shippingSummaryLabel = shippingPending
    ? "Calculando…"
    : shippingCost > 0
      ? formatPrice(shippingCost)
      : "Gratis";
  const estimatedDeliveryText = shippingQuoteLoading
    ? null
    : formatEstimatedDelivery({
        estimated_delivery_days_min: estimatedDeliveryDaysMin,
        estimated_delivery_days_max: estimatedDeliveryDaysMax,
      });

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
              [m]: roundMoney(payableSubtotal / selectedMethods.length),
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

          setMethodAmounts(normalizeAmounts(distribution, selectedMethods, payableSubtotal));
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

  const handleToggleMultiPayment = (enabled: boolean) => {
    setEnableMultiPayment(enabled);
    if (!enabled && selectedMethods.length > 1) {
      const firstMethod = selectedMethods[0];
      setSelectedMethods([firstMethod]);
      if (payableSubtotal > 0.01) {
        setMethodAmounts({ [firstMethod]: payableSubtotal });
      } else {
        setMethodAmounts({});
      }
    }
  };

  // Subtotal de productos según el tipo de precio de cada método (tarjeta = lista, resto = transferencia)
  const subtotalForKind = (kind: "card" | "transfer"): number =>
    cart.reduce((sum, item) => {
      const product = productsWithPrices[item.id];
      if (!product) return sum + getItemPrice(item);
      return (
        sum +
        calculateProductPrice(product, item.quantity, { paymentPriceKind: kind }).currentPriceValue
      );
    }, 0);

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
          return normalizeAmounts(updated, next, payableSubtotal, method);
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
        return normalizeAmounts(updated, selectedMethods, payableSubtotal, method);
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
  // Sin efectos secundarios: habilita/deshabilita el botón Continuar
  const isCurrentStepComplete =
    step === 1
      ? Object.keys(computeFormErrors(1)).length === 0 &&
        !savingCheckoutAddress &&
        !loadingPrices &&
        !shippingQuoteLoading
      : step === 2
        ? Object.keys(computeFormErrors(2)).length === 0
        : true;

  const continueButtonClass = `w-full py-3 px-6 rounded-lg font-semibold text-sm md:text-base transition-colors items-center justify-center gap-2 ${
    isCurrentStepComplete
      ? "bg-[#00C1A7] text-white hover:bg-[#00A892]"
      : "bg-gray-200 text-gray-500 cursor-pointer hover:bg-gray-300"
  }`;

  // Qué falta para habilitar Continuar (sin repetir etiquetas)
  const missingFieldsHint = (() => {
    if (step === 3 || isCurrentStepComplete) return "";
    const labels = Object.keys(computeFormErrors(step === 1 ? 1 : 2))
      .map((key) => FIELD_ERROR_LABELS[key])
      .filter(Boolean);
    const unique = Array.from(new Set(labels));
    return unique.length > 0 ? `Falta completar: ${unique.join(", ")}` : "";
  })();

  const finalizeDisabled =
    submitting || paisViacargoBloqueaFinalizar || loadingPrices || shippingQuoteLoading;
  const finalizeBlockedReason = submitting
    ? ""
    : loadingPrices
      ? "Actualizando precios…"
      : shippingQuoteLoading || viacargoCotizarLoading
        ? "Calculando el costo de envío…"
        : paisViacargoBloqueaFinalizar
          ? viacargoQuoteError ||
            (localityShippingProblem
              ? "Revisá el código postal de la dirección de envío"
              : "No pudimos calcular el envío; revisá la dirección")
          : "";

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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleApplyCoupon();
            }
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
          <div className="flex items-center justify-between gap-4 mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Tu compra</h1>
            {step > 1 && (
              <button
                type="button"
                onClick={() => goToStep((step - 1) as CheckoutStep)}
                disabled={submitting}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Paso anterior
              </button>
            )}
          </div>

          {/* Stepper */}
          <nav
            ref={stepperRef}
            tabIndex={-1}
            aria-label="Pasos del checkout"
            className="mb-6 md:mb-8 outline-none"
          >
            {/* Mobile: 3 columnas iguales, conector entre centros de círculos */}
            <ol className="grid grid-cols-3 md:hidden">
              {CHECKOUT_STEPS.map((s, idx) => {
                const isCurrent = step === s.id;
                const isDone = step > s.id;
                return (
                  <li key={s.id} className="relative flex justify-center">
                    {idx > 0 && (
                      <div
                        aria-hidden
                        className={`absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2 ${
                          step >= s.id ? "bg-[#00C1A7]" : "bg-gray-200"
                        }`}
                      />
                    )}
                    <button
                      type="button"
                      disabled={!isDone}
                      onClick={() => isDone && goToStep(s.id)}
                      aria-current={isCurrent ? "step" : undefined}
                      className="relative z-10 flex flex-col items-center gap-1.5 px-1 disabled:cursor-default"
                    >
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                          isDone
                            ? "bg-[#00C1A7] text-white"
                            : isCurrent
                              ? "bg-white border-2 border-[#00C1A7] text-[#00C1A7]"
                              : "bg-white border-2 border-gray-300 text-gray-400"
                        }`}
                      >
                        {isDone ? <Check className="w-4 h-4" /> : s.id}
                      </span>
                      <span
                        className={`text-[11px] leading-tight font-medium text-center max-w-[5.5rem] ${
                          isCurrent ? "text-gray-900" : isDone ? "text-[#00A892]" : "text-gray-400"
                        }`}
                      >
                        {s.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            {/* Desktop */}
            <ol className="hidden md:flex items-start">
              {CHECKOUT_STEPS.map((s, idx) => {
                const isCurrent = step === s.id;
                const isDone = step > s.id;
                return (
                  <li key={s.id} className="flex-1 flex items-start last:flex-none">
                    <button
                      type="button"
                      disabled={!isDone}
                      onClick={() => isDone && goToStep(s.id)}
                      aria-current={isCurrent ? "step" : undefined}
                      className="flex flex-col items-center gap-1.5 md:flex-row md:gap-3 disabled:cursor-default"
                    >
                      <span
                        className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-colors ${
                          isDone
                            ? "bg-[#00C1A7] text-white"
                            : isCurrent
                              ? "bg-white border-2 border-[#00C1A7] text-[#00C1A7]"
                              : "bg-white border-2 border-gray-300 text-gray-400"
                        }`}
                      >
                        {isDone ? <Check className="w-4 h-4" /> : s.id}
                      </span>
                      <span
                        className={`text-xs md:text-sm font-medium text-center md:text-left ${
                          isCurrent ? "text-gray-900" : isDone ? "text-[#00A892]" : "text-gray-400"
                        }`}
                      >
                        {s.label}
                      </span>
                    </button>
                    {idx < CHECKOUT_STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mt-4 md:mt-[18px] mx-2 md:mx-4 rounded ${
                          isDone ? "bg-[#00C1A7]" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6 order-2 lg:order-1">
              {step === 1 && (
              <>
              {/* Personal Information */}
              <div className="bg-white border border-gray-200 rounded-[14px] p-4 md:p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-4 md:mb-6">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                    Información personal
                  </h2>
                  {!isAuthenticated && (
                    <p className="text-sm text-gray-600">
                      ¿Ya tenés cuenta?{" "}
                      <Link href="/login" className="font-medium text-[#00C1A7] hover:text-[#00A892] underline">
                        Iniciá sesión
                      </Link>
                    </p>
                  )}
                </div>
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
                        autoComplete="given-name"
                        onChange={(e) => handleInputChange("first_name", e.target.value)}
                        onBlur={() => handleFieldBlur("first_name")}
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
                        autoComplete="family-name"
                        onChange={(e) => handleInputChange("last_name", e.target.value)}
                        onBlur={() => handleFieldBlur("last_name")}
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
                    <div className={`flex border rounded-lg ${
                      errors.document_type || errors.dni ? "border-red-500" : "border-gray-300"
                    } focus-within:ring-2 focus-within:ring-[#00C1A7] focus-within:border-transparent`}>
                      <CheckoutSelect
                        value={formData.document_type}
                        options={docTypes.map((docType) => ({ value: docType.id, label: docType.name }))}
                        onChange={(value) => handleInputChange("document_type", value)}
                        onBlur={() => handleFieldBlur("document_type")}
                        placeholder="Tipo"
                        ariaLabel="Tipo de documento"
                        disabled={loadingDocTypes}
                        className="min-w-[140px] shrink-0"
                        triggerClassName="px-4 py-2.5 border-r border-gray-300 rounded-l-lg"
                      />
                      <input
                        type="text"
                        value={formData.dni}
                        inputMode={isCuitOrCuil(formData.document_type) ? "text" : "numeric"}
                        autoComplete="off"
                        onChange={(e) => handleInputChange("dni", e.target.value)}
                        onBlur={() => handleFieldBlur("dni")}
                        placeholder="Número de documento"
                        className="flex-1 min-w-0 px-4 py-2.5 border-0 rounded-r-lg focus:outline-none text-gray-900 placeholder:text-gray-400"
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
                      autoComplete="email"
                      inputMode="email"
                      onChange={(e) => !isAuthenticated && handleInputChange("email", e.target.value)}
                      onBlur={() => handleFieldBlur("email")}
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
                        autoComplete="tel"
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        onBlur={() => handleFieldBlur("phone")}
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
                        autoComplete="off"
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

                {!showAddressForm && addresses.length > 0 && (
                  <p className="text-sm text-gray-600 mb-4">
                    Confirmá a qué dirección enviamos tu pedido.
                  </p>
                )}
                {errors.address && (
                  <p data-form-error className="text-red-500 text-sm mb-4">{errors.address}</p>
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
                      <p className="text-sm text-gray-600 mb-3">
                        Información del destinatario
                      </p>
                      {!editingAddressId && (
                        <label className="flex items-center gap-2 mb-4 text-sm text-gray-700 cursor-pointer">
                          <CheckoutChoice
                            type="checkbox"
                            checked={recipientIsSelf}
                            onChange={(e) => setRecipientIsSelf(e.target.checked)}
                          />
                          El pedido lo recibo yo
                        </label>
                      )}
                      {!selfRecipientActive && (
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre completo <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={addressForm.full_name}
                            autoComplete="name"
                            onChange={(e) => handleAddressInputChange("full_name", e.target.value)}
                            onBlur={() => handleFieldBlur("address_full_name")}
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
                            autoComplete="tel"
                            onChange={(e) => handleAddressInputChange("phone", e.target.value)}
                            onBlur={() => handleFieldBlur("address_phone")}
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
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Calle <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={addressForm.street}
                          autoComplete="address-line1"
                          onChange={(e) => handleAddressInputChange("street", e.target.value)}
                          onBlur={() => handleFieldBlur("address_street")}
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
                          autoComplete="off"
                          onChange={(e) => handleAddressInputChange("number", e.target.value)}
                          onBlur={() => handleFieldBlur("address_number")}
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
                          onBlur={() => handleFieldBlur("address_postal_code")}
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
                          autoComplete="address-line2"
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
                          autoComplete="address-level2"
                          onChange={(e) => handleAddressInputChange("city", e.target.value)}
                          onBlur={() => handleFieldBlur("address_city")}
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
                          onBlur={() => handleFieldBlur("address_province")}
                          autoComplete="address-level1"
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
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={closeAddressForm}
                          disabled={savingCheckoutAddress}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancelar
                        </button>
                      )}
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
                        <p className="text-gray-500 mb-4">No tenés direcciones guardadas</p>
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
              </>
              )}

              {step === 2 && (
              <>
              {/* Medios de pago */}
              <div className="bg-white border border-gray-200 rounded-[14px] p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                    Medios de pago
                  </h2>
                </div>

                {/* Aviso único sobre cómo se abona */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                      {isPaisCatalog ? (
                        <>
                          <span className="font-semibold">Completarás la venta por WhatsApp.</span>{" "}
                          No se cobra nada online.
                        </>
                      ) : isThirdPartyTransport ? (
                        <>
                          <span className="font-semibold">Efectivo:</span> abonás al recibir y la orden se genera
                          normalmente. <span className="font-semibold">Tarjeta:</span> completarás la venta por
                          WhatsApp.
                        </>
                      ) : (
                        <>
                          <span className="font-semibold">Abonás al recibir tu pedido</span>, no se cobra nada
                          online. Si elegís tarjeta, definís banco y cuotas acá.
                        </>
                      )}
                    </p>
                  </div>
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
                {isThirdPartyTransport && walletBalance > 0.01 && !walletIsBlocked && (
                  <p className="mb-4 text-xs text-gray-500">
                    El saldo de tu billetera no se puede usar con este tipo de envío.
                  </p>
                )}

                <p className="text-xs text-gray-500 mb-4 md:mb-6">
                  {payableSubtotal <= 0.01 && walletCreditApplied > 0.01 ? (
                    <>El saldo de billetera cubre el subtotal de productos. Solo pagás el envío al finalizar.</>
                  ) : enableMultiPayment ? (
                    "Seleccioná los métodos para el monto a abonar y distribuí los importes"
                  ) : (
                    "Elegí cómo vas a abonar el monto pendiente (después del descuento de billetera, si lo usás)"
                  )}
                </p>
                {errors.payment_method && (
                  <p data-form-error className="text-red-500 text-sm mb-4">{errors.payment_method}</p>
                )}

                <div
                  className="space-y-2 md:space-y-3"
                  role={enableMultiPayment ? "group" : "radiogroup"}
                  aria-label="Método de pago"
                >
                  {(() => {
                    const cardPrice = subtotalForKind("card");
                    const transferPrice = subtotalForKind("transfer");
                    const showPrices =
                      !loadingPrices &&
                      Object.keys(productsWithPrices).length > 0 &&
                      Math.abs(cardPrice - transferPrice) > 0.01;
                    const methods: {
                      id: "card" | "cash" | "transfer";
                      label: string;
                      Icon: typeof CreditCard;
                      amountLabel: string;
                      description: string;
                    }[] = [
                      {
                        id: "card",
                        label: "Tarjeta",
                        Icon: CreditCard,
                        amountLabel: "Monto con tarjeta",
                        description:
                          isThirdPartyTransport || isPaisCatalog
                            ? "Completarás la venta por WhatsApp"
                            : "Abonás al recibir",
                      },
                      {
                        id: "cash",
                        label: "Efectivo",
                        Icon: Wallet,
                        amountLabel: "Monto en efectivo",
                        description: isThirdPartyTransport
                          ? "Abonás al recibir"
                          : isPaisCatalog
                            ? "Completarás la venta por WhatsApp"
                            : "Abonás al recibir",
                      },
                      {
                        id: "transfer",
                        label: "Transferencia",
                        Icon: ArrowRightLeft,
                        amountLabel: "Monto con transferencia",
                        description:
                          isThirdPartyTransport || isPaisCatalog
                            ? "Completarás la venta por WhatsApp"
                            : "Abonás al recibir",
                      },
                    ];

                    return methods.map(({ id, label, Icon, amountLabel, description }) => {
                      const isSelected = selectedMethods.includes(id);
                      const unavailable = id === "transfer" && isThirdPartyTransport;
                      const isDisabled = payableSubtotal <= 0.01 || unavailable;
                      const price = id === "card" ? cardPrice : transferPrice;
                      const saving = id !== "card" ? cardPrice - transferPrice : 0;
                      return (
                        <div
                          key={id}
                          className={`border rounded-lg transition-colors ${
                            isSelected
                              ? "border-[#00C1A7] bg-[#00C1A7]/5"
                              : "border-gray-200 hover:border-gray-300"
                          } ${isDisabled ? "opacity-50" : ""}`}
                        >
                          <label
                            className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 ${
                              isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                            }`}
                          >
                            <CheckoutChoice
                              type={enableMultiPayment ? "checkbox" : "radio"}
                              name="payment_method"
                              disabled={isDisabled}
                              checked={isSelected}
                              onChange={() => togglePaymentMethod(id)}
                            />
                            <Icon className="w-5 h-5 text-gray-600 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-gray-900 text-sm md:text-base">{label}</span>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {unavailable ? "No disponible con este tipo de envío" : description}
                              </p>
                            </div>
                            {showPrices && !unavailable && (
                              <div className="text-right shrink-0">
                                <p className="text-sm font-semibold text-gray-900 tabular-nums">
                                  {formatPrice(price)}
                                </p>
                                <p className="text-[11px] text-gray-500">
                                  {id === "card" ? PRICE_UI_CARD_CAPTION : PRICE_UI_TRANSFER_CAPTION}
                                </p>
                                {saving > 0.01 && (
                                  <p className="text-[11px] font-medium text-[#00A892]">
                                    Ahorrás {formatPrice(saving)}
                                  </p>
                                )}
                              </div>
                            )}
                          </label>
                          {isSelected && isMultiPayment && (
                            <MethodAmountInput
                              id={`amount-${id}`}
                              label={amountLabel}
                              value={methodAmounts[id] || 0}
                              onCommit={(raw) => updateMethodAmount(id, raw)}
                            />
                          )}
                        </div>
                      );
                    });
                  })()}
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

                <button
                  type="button"
                  onClick={() => handleToggleMultiPayment(!enableMultiPayment)}
                  disabled={payableSubtotal <= 0.01}
                  className="mt-4 text-sm font-medium text-[#00C1A7] hover:text-[#00A892] hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {enableMultiPayment ? "Usar un solo método de pago" : "Pagar con más de un método"}
                </button>

                {/* Cuotas y Bancos - Solo cuando se selecciona tarjeta */}
                {hasCardPayment && (
                  <div className="mt-6 pt-5 border-t border-gray-200 space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-800">Tarjeta, banco y cuotas</h3>
                    {errors.card_installment && (
                      <p data-form-error className="text-red-500 text-sm">{errors.card_installment}</p>
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
                              <CheckoutSelect
                                value={selectedCardType}
                                options={cardTypesOptions}
                                onChange={(value) => {
                                  setSelectedCardType(value);
                                  setSelectedBank("");
                                  setSelectedInstallmentKey("");
                                  clearCardError();
                                }}
                                placeholder="Seleccioná un tipo de tarjeta"
                                ariaLabel="Tipo de tarjeta"
                                triggerClassName="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C1A7]"
                              />
                            )}
                          </div>

                          {/* Banco */}
                          {selectedCardType && (
                            <div>
                              <label className="block text-sm text-gray-600 mb-2">
                                Banco <span className="text-red-400">*</span>
                              </label>
                              <CheckoutSelect
                                value={selectedBank}
                                options={banks.map((bank) => ({ value: bank, label: bank }))}
                                onChange={(value) => {
                                  setSelectedBank(value);
                                  setSelectedInstallmentKey("");
                                  clearCardError();
                                }}
                                placeholder="Seleccioná tu banco"
                                ariaLabel="Banco"
                                triggerClassName="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00C1A7]"
                              />
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
                                      <p className="text-xs text-gray-500 mt-0.5 tabular-nums">
                                        Total {formatPrice(totalAmount)}
                                      </p>
                                      <p
                                        className={`text-[11px] mt-0.5 ${
                                          totalAmount - baseAmount < 0.01 ? "text-[#00A892] font-medium" : "text-amber-700"
                                        }`}
                                      >
                                        {totalAmount - baseAmount < 0.01
                                          ? "Sin recargo"
                                          : `Recargo ${formatPrice(totalAmount - baseAmount)}`}
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
              </div>

              {/* Cupón y código de referido (plegable) */}
              <div className="bg-white border border-gray-200 rounded-[14px] p-4 md:p-6">
                <button
                  type="button"
                  onClick={() => setShowCodes((v) => !v)}
                  aria-expanded={showCodes}
                  className="w-full flex items-center justify-between gap-3 text-left"
                >
                  <span className="text-lg md:text-xl font-semibold text-gray-900">
                    ¿Tenés un cupón o código de referido?
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 text-gray-500 transition-transform ${showCodes ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {!showCodes && (appliedCoupon || referralStatus === "valid") && (
                  <p className="mt-2 text-sm text-[#00A896]">
                    {appliedCoupon ? `Cupón ${appliedCoupon.code} aplicado` : ""}
                    {appliedCoupon && referralStatus === "valid" ? " · " : ""}
                    {referralStatus === "valid" ? "Código de referido válido" : ""}
                  </p>
                )}
                {showCodes && (
                  <div className="mt-4 space-y-5">
                    <div>{couponFields}</div>
                    <div className="pt-5 border-t border-gray-200">
                      <label htmlFor="referral-code" className="block text-sm font-medium text-gray-700 mb-2">
                        Código de referido (opcional)
                      </label>
                      <div className="relative">
                        <input
                          id="referral-code"
                          type="text"
                          autoComplete="off"
                          value={referralCode}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
                            setReferralCode(value);
                            setReferralStatus("idle");
                            setReferralMessage("");
                            if (errors.referral_code) {
                              setErrors((prev) => ({ ...prev, referral_code: "" }));
                            }
                          }}
                          onBlur={() => void validateReferral()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void validateReferral();
                            }
                          }}
                          placeholder="BAUSING-XXXXXX"
                          className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00C1A7] text-gray-900 placeholder:text-gray-400 ${
                            errors.referral_code
                              ? "border-red-500"
                              : referralStatus === "valid"
                                ? "border-[#00C1A7]"
                                : "border-gray-300"
                          }`}
                        />
                        {referralCodeValidating && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                        )}
                        {!referralCodeValidating && referralStatus === "valid" && (
                          <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00C1A7]" />
                        )}
                      </div>
                      {errors.referral_code && (
                        <p className="text-xs text-red-500 mt-1">{errors.referral_code}</p>
                      )}
                      {!errors.referral_code && referralStatus === "valid" && (
                        <p className="text-xs text-[#00A896] mt-1">{referralMessage}</p>
                      )}
                      {!errors.referral_code && referralStatus === "idle" && referralMessage && (
                        <p className="text-xs text-amber-700 mt-1">{referralMessage}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Si alguien te refirió, ingresá su código acá.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              </>
              )}

              {step === 3 && (() => {
                const reviewAddress = addresses.find((a) => a.id === selectedAddressId);
                const reviewDocType = docTypes.find((d) => String(d.id) === String(formData.document_type));
                const cardTypeLabel = cardTypes.find((ct) => ct.code === selectedCardType)?.name ?? "";
                const methodLabel = (method: PaymentMethodType) =>
                  method === "card" ? "Tarjeta" : method === "cash" ? "Efectivo" : "Transferencia";
                const surcharge = Math.max(0, payableTotal - payableSubtotal);
                const cardClass = "bg-white border border-gray-200 rounded-[14px] p-4 md:p-6";
                const editButton = (target: CheckoutStep, what: string) => (
                  <button
                    type="button"
                    onClick={() => editFromReview(target)}
                    aria-label={`Editar ${what}`}
                    className="-my-2 -mr-2 px-3 py-2 rounded-lg text-sm font-medium text-[#00C1A7] hover:text-[#00A892] hover:bg-[#00C1A7]/10 transition-colors"
                  >
                    Editar
                  </button>
                );
                return (
                  <>
                    {/* Pedido */}
                    <div className={cardClass}>
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg md:text-xl font-semibold text-gray-900">Tu pedido</h2>
                        {editButton(1, "productos")}
                      </div>
                      <ul className="divide-y divide-gray-100">
                        {cart.map((item) => (
                          <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                              {item.image && (
                                <img
                                  loading="lazy"
                                  src={wsrvLoader({ src: item.image, width: 112 })}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                              <p className="text-xs text-gray-500">
                                {item.quantity} × {formatPrice(getItemUnitPrice(item))}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-gray-900 tabular-nums shrink-0">
                              {formatPrice(getItemPrice(item))}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Contacto */}
                    <div className={cardClass}>
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg md:text-xl font-semibold text-gray-900">Contacto</h2>
                        {editButton(1, "contacto")}
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {formData.first_name} {formData.last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {reviewDocType?.name ? `${reviewDocType.name} ` : ""}
                        {formData.dni}
                      </p>
                      <p className="text-sm text-gray-600">{formData.email}</p>
                      <p className="text-sm text-gray-600">
                        Cel: {formData.phone}
                        {formData.alternate_phone ? ` · Alt: ${formData.alternate_phone}` : ""}
                      </p>
                      {accountCreated && (
                        <p className="mt-3 text-xs text-gray-500">
                          Creamos tu cuenta con este email. Revisá tu correo para ver tu contraseña.
                        </p>
                      )}
                    </div>

                    {/* Entrega */}
                    <div className={cardClass}>
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg md:text-xl font-semibold text-gray-900">Entrega</h2>
                        {editButton(1, "dirección de entrega")}
                      </div>
                      {reviewAddress ? (
                        <>
                          <p className="text-sm font-medium text-gray-900">{reviewAddress.full_name}</p>
                          <p className="text-sm text-gray-600">
                            {reviewAddress.street} {reviewAddress.number}
                            {reviewAddress.additional_info && `, ${reviewAddress.additional_info}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {reviewAddress.city}, {reviewAddress.province} {reviewAddress.postal_code}
                          </p>
                          <p className="text-sm text-gray-500">Tel: {reviewAddress.phone}</p>
                        </>
                      ) : (
                        <p className="text-sm text-red-600">No hay una dirección seleccionada.</p>
                      )}
                      {isPaisCatalog && !isThirdPartyTransport && (
                        <p className="mt-3 text-xs text-gray-500">
                          Modalidad de entrega: retiro en sucursal Viacargo. El costo de envío es un precio estimado.
                        </p>
                      )}
                      {estimatedDeliveryText && (
                        <p className="mt-2 text-sm text-gray-700">
                          <span className="text-gray-500">Entrega estimada:</span> {estimatedDeliveryText}
                        </p>
                      )}
                    </div>

                    {/* Pago */}
                    <div className={cardClass}>
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg md:text-xl font-semibold text-gray-900">Pago</h2>
                        {editButton(2, "forma de pago")}
                      </div>
                      <div className="space-y-3">
                        {selectedMethods.length === 0 ? (
                          <p className="text-sm text-gray-600">
                            {hasWalletPayment && remainingAfterWallet === 0
                              ? "Cubierto con tu billetera"
                              : "Sin método seleccionado"}
                          </p>
                        ) : (
                          selectedMethods.map((method) => (
                            <div key={method}>
                              <div className="flex justify-between gap-3 text-sm text-gray-900">
                                <span className="font-medium">{methodLabel(method)}</span>
                                <span className="font-medium tabular-nums">
                                  {formatPrice(getEffectiveMethodAmount(method))}
                                </span>
                              </div>
                              {method === "card" && (cardTypeLabel || selectedBank) && (
                                <p className="text-xs text-gray-500">
                                  {[cardTypeLabel, selectedBank].filter(Boolean).join(" · ")}
                                </p>
                              )}
                              {method === "card" && selectedInstallment && selectedInstallmentAmounts && (
                                <p className="text-xs text-gray-500">
                                  {selectedInstallment.cuotas === 1
                                    ? "1 cuota de"
                                    : `${selectedInstallment.cuotas} cuotas de`}{" "}
                                  {formatPrice(selectedInstallmentAmounts.cuotaAmount)} · Total{" "}
                                  {formatPrice(selectedInstallmentAmounts.totalAmount)}{" "}
                                  {selectedInstallmentAmounts.totalAmount - cardFinancingBaseAmount < 0.01
                                    ? "(sin recargo)"
                                    : "(con recargo)"}
                                </p>
                              )}
                            </div>
                          ))
                        )}
                        {hasWalletPayment && walletDiscount > 0 && (
                          <div className="flex justify-between text-sm text-green-700">
                            <span>Billetera Bausing</span>
                            <span className="font-medium tabular-nums">−{formatPrice(walletDiscount)}</span>
                          </div>
                        )}
                        {referralCode && (
                          <p className="text-sm text-gray-600">Código de referido: {referralCode}</p>
                        )}
                      </div>
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-blue-800">
                            <span className="font-semibold">Importante:</span>{" "}
                            {willCompleteViaWhatsApp
                              ? "Al continuar te llevamos a WhatsApp con el detalle de tu pedido. La compra se confirma allá."
                              : "Abonarás cuando recibas tu pedido."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Total */}
                    <div className={cardClass}>
                      <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">Total a pagar</h2>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between gap-3">
                          <dt className="text-gray-600">Productos</dt>
                          <dd className="font-medium text-gray-900 tabular-nums">{formatPrice(subtotal)}</dd>
                        </div>
                        {appliedCoupon && couponDiscount > 0.01 && (
                          <div className="flex justify-between gap-3 text-[#00A896]">
                            <dt>Cupón {appliedCoupon.code}</dt>
                            <dd className="font-medium tabular-nums">−{formatPrice(couponDiscount)}</dd>
                          </div>
                        )}
                        {hasWalletPayment && walletDiscount > 0 && (
                          <div className="flex justify-between gap-3 text-green-700">
                            <dt>Billetera Bausing</dt>
                            <dd className="font-medium tabular-nums">−{formatPrice(walletDiscount)}</dd>
                          </div>
                        )}
                        {surcharge > 0.01 && (
                          <div className="flex justify-between gap-3">
                            <dt className="text-gray-600">Recargo por cuotas</dt>
                            <dd className="font-medium text-gray-900 tabular-nums">+{formatPrice(surcharge)}</dd>
                          </div>
                        )}
                        <div className="flex justify-between gap-3">
                          <dt className="text-gray-600">Envío</dt>
                          <dd className="font-medium text-gray-900 tabular-nums">{shippingSummaryLabel}</dd>
                        </div>
                      </dl>
                      <div className="mt-4 pt-4 border-t border-gray-200 flex items-baseline justify-between gap-3">
                        <span className="text-base md:text-lg font-semibold text-gray-900">Total</span>
                        <span className="text-xl md:text-2xl font-bold text-gray-900 tabular-nums">
                          {loadingPrices ? "…" : formatPrice(finalTotal)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {willCompleteViaWhatsApp
                          ? "El pago se coordina por WhatsApp."
                          : "Pagás al recibir tu pedido."}
                      </p>
                    </div>
                  </>
                );
              })()}

              {step === 3 && errors.submit && (
                <div
                  data-form-error
                  role="alert"
                  className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
                >
                  <p>{errors.submit}</p>
                  {submitFix && (
                    <button
                      type="button"
                      onClick={() => {
                        editFromReview(submitFix.step);
                        scrollToFirstError();
                      }}
                      className="mt-2 font-semibold underline underline-offset-2 hover:text-red-900"
                    >
                      {submitFix.label}
                    </button>
                  )}
                </div>
              )}

              {step === 3 && (
                <p className="text-xs text-gray-500">
                  Al continuar aceptás los{" "}
                  <Link href="/terminos-y-condiciones" target="_blank" className="underline hover:text-gray-700">
                    Términos y Condiciones
                  </Link>{" "}
                  y la{" "}
                  <Link href="/politica-de-privacidad" target="_blank" className="underline hover:text-gray-700">
                    Política de Privacidad
                  </Link>
                  .
                </p>
              )}

              {/* Navegación del wizard */}
              <div className="flex items-center gap-3">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => goToStep((step - 1) as CheckoutStep)}
                    disabled={submitting}
                    className="px-5 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm md:text-base hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Volver
                  </button>
                )}
                {step < 3 ? (
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => void handleNextStep()}
                      aria-disabled={!isCurrentStepComplete}
                      disabled={savingCheckoutAddress || loadingPrices || shippingQuoteLoading}
                      className={`flex ${continueButtonClass}`}
                    >
                      {savingCheckoutAddress ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Guardando dirección…
                        </>
                      ) : (
                        nextButtonLabel
                      )}
                    </button>
                    {missingFieldsHint && (
                      <p className="mt-2 text-xs text-gray-500 text-center">{missingFieldsHint}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex-1">
                    <button
                      type="submit"
                      disabled={finalizeDisabled}
                      className="w-full bg-[#00C1A7] text-white py-3 px-6 rounded-lg font-semibold text-base hover:bg-[#00A892] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {finalizeBusyLabel}
                        </>
                      ) : (
                        <>
                          {willCompleteViaWhatsApp && <MessageCircle className="w-5 h-5" />}
                          {finalizeLabel}
                        </>
                      )}
                    </button>
                    {finalizeBlockedReason && (
                      <p className="mt-2 text-xs text-gray-500 text-center">{finalizeBlockedReason}</p>
                    )}
                  </div>
                )}
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
                              loading="lazy"
                              src={wsrvLoader({ src: item.image, width: 112 })}
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
                            {step === 3 ? (
                              <span className="text-xs font-medium text-gray-700">{item.quantity}</span>
                            ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1 || submitting}
                                className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                aria-label="Disminuir cantidad"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-medium text-gray-700 min-w-[1.25rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                disabled={submitting}
                                className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                                aria-label="Aumentar cantidad"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`¿Quitar "${item.name}" del pedido?`)) {
                                    removeFromCart(item.id);
                                  }
                                }}
                                disabled={submitting}
                                className="ml-1 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md disabled:opacity-40"
                                aria-label="Quitar producto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            )}
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
                      ) : shippingQuoteLoading || accessoriesShippingLoading ? (
                        <span
                          className="inline-block align-middle h-5 min-w-[5rem] rounded-md bg-gray-200 animate-pulse ml-auto"
                          aria-busy="true"
                          aria-label="Calculando costo de envío"
                        />
                      ) : accessoriesShippingPrice !== null ? (
                        formatPrice(accessoriesShippingPrice)
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
                    errors.submit,
                  ].filter(Boolean);
                  
                  return visibleErrors.length > 0 && step !== 1 ? (
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
                        {errors.submit && <li>• {errors.submit}</li>}
                      </ul>
                    </div>
                  ) : null;
                })()}
                
                {step < 3 && (
                  <button
                    type="button"
                    onClick={() => void handleNextStep()}
                    aria-disabled={!isCurrentStepComplete}
                      disabled={savingCheckoutAddress || loadingPrices || shippingQuoteLoading}
                    className={`hidden lg:flex mt-4 md:mt-6 ${continueButtonClass}`}
                  >
                    {savingCheckoutAddress ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Guardando dirección…
                      </>
                    ) : (
                      nextButtonLabel
                    )}
                  </button>
                )}
                {step < 3 && missingFieldsHint && (
                  <p className="hidden lg:block mt-2 text-xs text-gray-500 text-center">{missingFieldsHint}</p>
                )}
                {step === 3 && (
                <>
                {/* Botón de confirmación: solo desktop (lg+) */}
                <button
                  type="submit"
                  disabled={finalizeDisabled}
                  className="hidden lg:flex w-full mt-4 md:mt-6 bg-[#00C1A7] text-white py-2.5 md:py-3 px-4 md:px-6 rounded-lg font-semibold text-sm md:text-base hover:bg-[#00A892] transition-colors disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                      {finalizeBusyLabel}
                    </>
                  ) : (
                    <>
                      {willCompleteViaWhatsApp && <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />}
                      {finalizeLabel}
                    </>
                  )}
                </button>
                {finalizeBlockedReason && (
                  <p className="hidden lg:block mt-2 text-xs text-gray-500 text-center">{finalizeBlockedReason}</p>
                )}
                </>
                )}
              </div>
            </div>
          </form>
        </div>
      </main>

      {submitting && step === 3 && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-sm"
        >
          <Loader2 className="w-8 h-8 animate-spin text-[#00C1A7]" />
          <p className="text-sm font-medium text-gray-800">{finalizeBusyLabel}</p>
        </div>
      )}

      <Footer />
    </div>
  );
}

