"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";

interface MercadoPagoCardFormProps {
  publicKey: string;
  amount: number;
  onPaymentSuccess: (
    token: string, 
    installments: number, 
    paymentMethodId: string, 
    issuerId?: number,
    cardholderData?: {
      name?: string;
      email?: string;
      identificationType?: string;
      identificationNumber?: string;
    }
  ) => void;
  onPaymentError: (error: string) => void;
  payerEmail: string;
  payerName?: string;
  payerDni?: string;
  onReady?: () => void;
  processPayment?: React.MutableRefObject<(() => Promise<void>) | null>;
}

declare global {
  interface Window {
    MercadoPago: any;
  }
}

export default function MercadoPagoCardForm({
  publicKey,
  amount,
  onPaymentSuccess,
  onPaymentError,
  payerEmail,
  payerName,
  payerDni,
  onReady,
  processPayment,
}: MercadoPagoCardFormProps) {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [mpInitialized, setMpInitialized] = useState(false);
  const brickContainerRef = useRef<HTMLDivElement>(null);
  const mpInstanceRef = useRef<any>(null);
  const cardPaymentBrickControllerRef = useRef<any>(null);
  
  // Usar refs para los callbacks para evitar reinicializaciones
  const onPaymentSuccessRef = useRef(onPaymentSuccess);
  const onPaymentErrorRef = useRef(onPaymentError);
  const onReadyRef = useRef(onReady);
  
  // Actualizar los refs cuando cambien los callbacks
  useEffect(() => {
    onPaymentSuccessRef.current = onPaymentSuccess;
    onPaymentErrorRef.current = onPaymentError;
    onReadyRef.current = onReady;
  }, [onPaymentSuccess, onPaymentError, onReady]);

  // Cargar script de MercadoPago
  useEffect(() => {
    let mounted = true;

    function initializeMercadoPago() {
      try {
        if (!window.MercadoPago) {
          throw new Error("MercadoPago no está disponible");
        }

        if (mpInstanceRef.current) {
          return;
        }

        console.log("Inicializando MercadoPago con publicKey:", publicKey);
        mpInstanceRef.current = new window.MercadoPago(publicKey, {
          locale: "es-AR",
        });
        setMpInitialized(true);
        console.log("✅ MercadoPago inicializado");
      } catch (error: any) {
        console.error("Error al inicializar MercadoPago:", error);
        if (mounted) {
          setLoading(false);
          onPaymentError("Error al inicializar MercadoPago");
        }
      }
    }

    if (window.MercadoPago) {
      initializeMercadoPago();
    } else {
      const existingScript = document.querySelector('script[src="https://sdk.mercadopago.com/js/v2"]');
      if (existingScript) {
        const checkScript = setInterval(() => {
          if (window.MercadoPago) {
            clearInterval(checkScript);
            if (mounted) {
              initializeMercadoPago();
            }
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkScript);
        }, 5000);
      } else {
        const script = document.createElement("script");
        script.src = "https://sdk.mercadopago.com/js/v2";
        script.async = true;
        
        script.onload = () => {
          if (mounted && window.MercadoPago) {
            initializeMercadoPago();
          }
        };

        script.onerror = () => {
          if (mounted) {
            console.error("Error al cargar el script de MercadoPago");
            onPaymentError("Error al cargar el formulario de pago. Por favor, recarga la página.");
            setLoading(false);
          }
        };

        document.body.appendChild(script);
      }
    }

    return () => {
      mounted = false;
    };
  }, [publicKey, onPaymentError]);

  // Inicializar Card Payment Brick
  useEffect(() => {
    if (!mpInitialized || !mpInstanceRef.current || !brickContainerRef.current) return;
    
    // Prevenir reinicialización si ya está montado
    if (cardPaymentBrickControllerRef.current) {
      console.log("✅ Brick ya está inicializado, saltando reinicialización");
      return;
    }

    let mounted = true;

    const initializeBrick = async () => {
      try {
        // Verificar que el contenedor esté en el DOM
        if (!brickContainerRef.current || !brickContainerRef.current.isConnected) {
          console.log("⏳ Esperando a que el contenedor esté en el DOM...");
          return;
        }

        // Verificar que el contenedor tenga dimensiones (está renderizado)
        const rect = brickContainerRef.current.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          console.log("⏳ Esperando a que el contenedor tenga dimensiones...");
          return;
        }

        // Verificar que no se haya inicializado ya
        if (cardPaymentBrickControllerRef.current) {
          console.log("✅ Brick ya está inicializado");
          if (loading) {
            setLoading(false);
            if (onReady) onReady();
          }
          return;
        }

        console.log("🔧 Inicializando Card Payment Brick...");
        console.log("🔍 Estado del contenedor:", {
          exists: !!brickContainerRef.current,
          isConnected: brickContainerRef.current?.isConnected,
          width: rect.width,
          height: rect.height,
          id: brickContainerRef.current?.id
        });

        // Inicializar el Brick según documentación oficial
        const bricksBuilder = mpInstanceRef.current.bricks();

        const settings = {
          initialization: {
            amount: Number(amount), // Asegurar que sea número
            payer: {
              email: payerEmail,
            },
          },
          customization: {
            visual: {
              hidePaymentButton: false, // Mostrar botón pero lo ocultaremos con CSS
              style: {
                theme: 'default' as const, // 'default' | 'dark' | 'bootstrap' | 'flat'
              },
            },
            paymentMethods: {
              maxInstallments: 12, // Máximo de cuotas
            },
          },
          callbacks: {
            onReady: () => {
              console.log("✅ Card Payment Brick listo");
              if (mounted) {
                setLoading(false);
                if (onReadyRef.current) onReadyRef.current();
              }
            },
            onSubmit: (cardFormData: any) => {
              console.log("📝 [Brick] Datos del formulario recibidos (completo):", JSON.stringify(cardFormData, null, 2));
              console.log("📝 [Brick] Tipo de cardFormData:", typeof cardFormData);
              console.log("📝 [Brick] Keys en cardFormData:", Object.keys(cardFormData || {}));
              
              if (mounted) {
                setProcessing(true);
              }

              // IMPORTANTE: onSubmit debe retornar una Promise
              // Según la documentación, el Brick espera que se procese el pago en el backend
              // y luego se resuelva o rechace la Promise
              return new Promise((resolve, reject) => {
                try {
                  // El Brick ya procesa todo y devuelve los datos necesarios
                  const { 
                    token, 
                    installments, 
                    payment_method_id, 
                    issuer_id,
                    cardholderName,
                    cardholderEmail,
                    identificationType,
                    identificationNumber
                  } = cardFormData;

                  if (!token) {
                    throw new Error("No se pudo generar el token de la tarjeta");
                  }

                  console.log("✅ [Brick] Token generado:", token);
                  console.log("✅ [Brick] Cuotas:", installments);
                  console.log("✅ [Brick] Payment Method ID:", payment_method_id);
                  console.log("✅ [Brick] Issuer ID:", issuer_id);
                  console.log("✅ [Brick] Cardholder Name:", cardholderName, "(tipo:", typeof cardholderName, ")");
                  console.log("✅ [Brick] Cardholder Email:", cardholderEmail, "(tipo:", typeof cardholderEmail, ")");
                  console.log("✅ [Brick] Identification Type:", identificationType, "(tipo:", typeof identificationType, ")");
                  console.log("✅ [Brick] Identification Number:", identificationNumber, "(tipo:", typeof identificationNumber, ")");
                  
                  // Verificar si los datos del cardholder están presentes
                  if (!cardholderName && !cardholderEmail && !identificationType && !identificationNumber) {
                    console.warn("⚠️ [Brick] ADVERTENCIA: No se recibieron datos del cardholder del Brick");
                    console.warn("⚠️ [Brick] Esto puede ser normal si el email se pasó en la inicialización");
                  }

                  // Preparar datos del cardholder para enviar al backend
                  const cardholderData = {
                    name: cardholderName,
                    email: cardholderEmail,
                    identificationType: identificationType,
                    identificationNumber: identificationNumber
                  };

                  // Llamar al callback con los datos usando el ref
                  // Esto notifica al componente padre que el token está listo
                  // El padre puede entonces procesar el pago en el backend
                  onPaymentSuccessRef.current(
                    token,
                    installments || 1,
                    payment_method_id || '',
                    issuer_id,
                    cardholderData
                  );

                  // Resolver la Promise inmediatamente para indicar al Brick que el proceso fue exitoso
                  // No usar setTimeout aquí porque puede causar que el Brick se ejecute dos veces
                  resolve();
                  
                  if (mounted) {
                    setProcessing(false);
                  }
                } catch (error: any) {
                  console.error("❌ Error al procesar el pago:", error);
                  const errorMessage = error?.message || "Error al procesar el pago. Por favor, intenta nuevamente.";
                  onPaymentErrorRef.current(errorMessage);
                  
                  // Rechazar la Promise para indicar al Brick que hubo un error
                  reject(error);
                  
                  if (mounted) {
                    setProcessing(false);
                  }
                }
              });
            },
            onError: (error: any) => {
              console.error("❌ Error en el Brick:", error);
              const errorMessage = error?.message || "Error en el formulario de pago. Por favor, verifica los datos.";
              onPaymentErrorRef.current(errorMessage);
              if (mounted) {
                setProcessing(false);
              }
            },
          },
        };

        cardPaymentBrickControllerRef.current = await bricksBuilder.create(
          'cardPayment',
          'cardPaymentBrick_container',
          settings
        );

        console.log("✅ Card Payment Brick inicializado");
      } catch (error: any) {
        console.error("❌ Error al inicializar el Brick:", error);
        if (mounted) {
          setLoading(false);
          onPaymentError("Error al inicializar el formulario de pago. Por favor, recarga la página.");
        }
      }
    };

    // Esperar a que el DOM esté completamente listo antes de inicializar
    // El error "fields_setup_failed_after_3_tries" suele ocurrir si el contenedor no está listo
    const timeoutRefs: NodeJS.Timeout[] = [];
    
    const initializeWithRetry = async (attempt = 1, maxAttempts = 5) => {
      if (!mounted) return;
      
      const container = brickContainerRef.current;
      if (!container || !container.isConnected) {
        if (attempt < maxAttempts) {
          const timeoutId = setTimeout(() => initializeWithRetry(attempt + 1, maxAttempts), 200);
          timeoutRefs.push(timeoutId);
        }
        return;
      }

      // Verificar que el contenedor tenga dimensiones
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        if (attempt < maxAttempts) {
          const timeoutId = setTimeout(() => initializeWithRetry(attempt + 1, maxAttempts), 200);
          timeoutRefs.push(timeoutId);
        }
        return;
      }

      // Intentar inicializar
      try {
        await initializeBrick();
      } catch (error: any) {
        console.error(`❌ Error en intento ${attempt}:`, error);
        if (attempt < maxAttempts && mounted) {
          const timeoutId = setTimeout(() => initializeWithRetry(attempt + 1, maxAttempts), 500);
          timeoutRefs.push(timeoutId);
        } else if (mounted) {
          setLoading(false);
          onPaymentError("Error al inicializar el formulario de pago. Por favor, recarga la página.");
        }
      }
    };

    // Usar requestAnimationFrame para asegurar que el DOM esté completamente renderizado
    const rafId = requestAnimationFrame(() => {
      const timeoutId = setTimeout(() => {
        if (mounted) {
          initializeWithRetry();
        }
      }, 300); // Delay inicial más largo para asegurar que todo esté listo
      timeoutRefs.push(timeoutId);
    });

    return () => {
      mounted = false;
      
      // Limpiar todos los timeouts
      timeoutRefs.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutRefs.length = 0;
      
      // Cancelar requestAnimationFrame si aún no se ejecutó
      cancelAnimationFrame(rafId);
      
      // Limpiar el Brick si existe
      if (cardPaymentBrickControllerRef.current) {
        try {
          cardPaymentBrickControllerRef.current.unmount();
          cardPaymentBrickControllerRef.current = null;
        } catch (e) {
          console.log("⚠️ Error al desmontar el Brick:", e);
        }
      }
    };
  }, [mpInitialized, amount, payerEmail]); // Solo reinicializar si cambian estos valores críticos

  // Exponer función de procesamiento para que el botón "Finalizar compra" pueda disparar el submit del Brick
  useEffect(() => {
    if (processPayment) {
      processPayment.current = async () => {
        // Disparar el submit del Brick manualmente
        if (!cardPaymentBrickControllerRef.current) {
          throw new Error("El formulario de pago no está listo. Por favor, espera un momento e intenta nuevamente.");
        }

        try {
          console.log("🔵 Disparando submit del Brick desde botón Finalizar compra...");
          
          const container = brickContainerRef.current;
          if (!container) {
            throw new Error("El contenedor del Brick no está disponible");
          }

          // El Brick puede tener el formulario en un iframe, necesitamos buscar en todos los iframes
          const iframes = container.querySelectorAll('iframe');
          
          // Buscar el botón de submit del Brick
          // El botón puede estar en diferentes lugares según la versión del SDK
          let submitButton: HTMLButtonElement | null = null;
          
          // Buscar por diferentes selectores
          const selectors = [
            'button[type="submit"]',
            'button.mp-form-submit',
            'button[data-testid="submit-button"]',
            'button[aria-label*="Pagar"]',
            'button[aria-label*="pagar"]',
            'button:has-text("Pagar")',
            '.mp-form-submit-button',
            'button.form-submit'
          ];
          
          for (const selector of selectors) {
            submitButton = container.querySelector(selector) as HTMLButtonElement;
            if (submitButton) break;
          }
          
          // Si no encontramos por selector, buscar por texto
          if (!submitButton) {
            const allButtons = container.querySelectorAll('button');
            for (const button of Array.from(allButtons)) {
              const text = button.textContent?.toLowerCase() || '';
              const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
              if (text.includes('pagar') || ariaLabel.includes('pagar')) {
                submitButton = button as HTMLButtonElement;
                break;
              }
            }
          }
          
          if (submitButton) {
            console.log("✅ Encontrado botón de submit del Brick, haciendo click...");
            // Hacer click en el botón del Brick
            // El Brick procesará el formulario y llamará a onSubmit
            submitButton.click();
            // No esperar aquí, el callback onSubmit manejará el resultado
            // El Brick mostrará su propio estado de carga
          } else {
            console.error("❌ No se encontró el botón de submit del Brick");
            throw new Error("No se pudo encontrar el botón de pago. Por favor, completa todos los campos de la tarjeta.");
          }
        } catch (error: any) {
          console.error("❌ Error al disparar submit del Brick:", error);
          throw error;
        }
      };
    }
  }, [processPayment]);

  return (
    <div className="space-y-4">
      {loading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Inicializando formulario de pago...</span>
          </div>
        </div>
      )}

      {processing && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Procesando pago...</span>
          </div>
        </div>
      )}

      {/* Contenedor para el Card Payment Brick */}
      {/* IMPORTANTE: El contenedor debe tener dimensiones mínimas para que el Brick pueda inicializar los Secure Fields */}
      <div
        id="cardPaymentBrick_container"
        ref={brickContainerRef}
        className="w-full min-h-[400px]"
        style={{ minHeight: '400px' }}
      ></div>
      
      {/* Estilos para que el Brick use las mismas fuentes que el resto de la web */}
      {/* Ocultar el botón del Brick ya que usamos el botón "Finalizar compra" del checkout */}
      <style jsx global>{`
        #cardPaymentBrick_container * {
          font-family: var(--font-dm-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        }
        
        #cardPaymentBrick_container input,
        #cardPaymentBrick_container select,
        #cardPaymentBrick_container textarea,
        #cardPaymentBrick_container button {
          font-family: var(--font-dm-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        }
        
        /* Asegurar que los iframes del Brick también hereden la fuente */
        #cardPaymentBrick_container iframe {
          font-family: var(--font-dm-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        }
        
        /* Ocultar el botón de pago del Brick (lo mantenemos en el DOM para poder hacer click programáticamente) */
        #cardPaymentBrick_container button[type="submit"],
        #cardPaymentBrick_container .mp-form-submit-button,
        #cardPaymentBrick_container button.mp-form-submit {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          position: absolute !important;
          width: 0 !important;
          height: 0 !important;
          overflow: hidden !important;
        }
      `}</style>
    </div>
  );
}
