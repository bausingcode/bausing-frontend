export type WhatsAppClickType = "contact" | "checkout";

/**
 * Registra un click en un botón/flujo de WhatsApp para las métricas del admin.
 * "contact" = botón de contacto genérico. "checkout" = intento de finalizar la venta por WhatsApp.
 * Best-effort: usa sendBeacon porque se dispara justo antes de navegar fuera de la página.
 */
export function trackWhatsAppClick(type: WhatsAppClickType): void {
  if (typeof window === "undefined") return;

  try {
    const body = JSON.stringify({ type, page: window.location.pathname });

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
      const ok = navigator.sendBeacon("/api/track/whatsapp-click", blob);
      if (ok) return;
    }

    void fetch("/api/track/whatsapp-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      cache: "no-store",
    });
  } catch (error) {
    console.error("[WhatsApp tracking] failed", error);
  }
}
