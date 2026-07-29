"use client";

import { createMetaEventId } from "./eventId";
import {
  getMetaProductContext,
  metaProductToCustomData,
} from "./productContext";
import type {
  MetaCapiRequestBody,
  MetaCustomData,
  MetaStandardEvent,
  MetaUserDataInput,
} from "./types";

declare global {
  interface Window {
    fbq?: (
      command: string,
      eventNameOrId: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string },
    ) => void;
    _fbq?: unknown;
  }
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function getClientUserData(extra?: MetaUserDataInput): MetaUserDataInput {
  let fromStorage: MetaUserDataInput = {};
  try {
    const raw = localStorage.getItem("user_data");
    if (raw) {
      const user = JSON.parse(raw) as {
        id?: string;
        email?: string;
        phone?: string;
        first_name?: string;
        last_name?: string;
      };
      fromStorage = {
        external_id: user.id,
        email: user.email,
        phone: user.phone,
        first_name: user.first_name,
        last_name: user.last_name,
      };
    }
  } catch {
    // ignore
  }

  return {
    ...fromStorage,
    ...extra,
    fbp: extra?.fbp || readCookie("_fbp"),
    fbc: extra?.fbc || readCookie("_fbc"),
    client_user_agent:
      extra?.client_user_agent ||
      (typeof navigator !== "undefined" ? navigator.userAgent : undefined),
  };
}

function shouldSkipTracking(): boolean {
  if (typeof window === "undefined") return true;
  const path = window.location.pathname || "";
  return path.startsWith("/admin") || path.startsWith("/login-admin");
}

function sendCapiBeacon(body: MetaCapiRequestBody): void {
  try {
    const json = JSON.stringify(body);
    // text/plain evita problemas de Content-Type con sendBeacon en algunos browsers
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([json], { type: "text/plain;charset=UTF-8" });
      const ok = navigator.sendBeacon("/api/meta/capi", blob);
      if (ok) return;
    }
    void fetch("/api/meta/capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json,
      keepalive: true,
      cache: "no-store",
    });
  } catch (error) {
    console.error("[Meta] CAPI send failed", error);
  }
}

export type TrackMetaOptions = {
  eventId?: string;
  eventSourceUrl?: string;
  userData?: MetaUserDataInput;
  /** Si true, prioriza sendBeacon (navegaciones / WhatsApp). */
  useBeacon?: boolean;
};

/**
 * Dispara el evento en Pixel y en Conversions API con el mismo event_id
 * para deduplicación automática en Meta.
 */
export function trackMetaEvent(
  eventName: MetaStandardEvent,
  customData?: MetaCustomData,
  options?: TrackMetaOptions,
): string {
  const eventId = options?.eventId || createMetaEventId(eventName.toLowerCase());

  if (shouldSkipTracking()) {
    return eventId;
  }

  const eventSourceUrl =
    options?.eventSourceUrl ||
    (typeof window !== "undefined" ? window.location.href : undefined);

  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    try {
      window.fbq(
        "track",
        eventName,
        customData && Object.keys(customData).length > 0
          ? (customData as Record<string, unknown>)
          : undefined,
        { eventID: eventId },
      );
    } catch (error) {
      console.error("[Meta Pixel] track failed", error);
    }
  }

  const capiBody: MetaCapiRequestBody = {
    event_name: eventName,
    event_id: eventId,
    event_source_url: eventSourceUrl,
    event_time: Math.floor(Date.now() / 1000),
    custom_data: customData,
    user_data: getClientUserData(options?.userData),
  };

  if (options?.useBeacon !== false) {
    sendCapiBeacon(capiBody);
  } else {
    void fetch("/api/meta/capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(capiBody),
      keepalive: true,
      cache: "no-store",
    }).catch((error) => console.error("[Meta] CAPI fetch failed", error));
  }

  return eventId;
}

export function trackPageView(eventId?: string): string {
  return trackMetaEvent("PageView", undefined, { eventId });
}

export function trackViewContent(data: {
  content_id: string;
  content_name: string;
  content_category?: string;
  value: number;
  currency?: string;
}): string {
  return trackMetaEvent("ViewContent", {
    content_ids: [data.content_id],
    content_name: data.content_name,
    content_category: data.content_category,
    content_type: "product",
    value: data.value,
    currency: data.currency || "ARS",
  });
}

export function trackSearch(searchString: string): string {
  const q = searchString.trim();
  if (!q) return createMetaEventId("search");
  return trackMetaEvent("Search", { search_string: q });
}

export function trackContact(customData?: MetaCustomData): string {
  const fromProduct =
    customData ||
    metaProductToCustomData(
      typeof window !== "undefined" &&
        window.location.pathname.startsWith("/productos/")
        ? getMetaProductContext()
        : null,
    );
  return trackMetaEvent("Contact", fromProduct, { useBeacon: true });
}

export function trackAddToCart(data: {
  content_id: string;
  content_name: string;
  content_category?: string;
  value: number;
  currency?: string;
  quantity?: number;
}): string {
  const qty = data.quantity && data.quantity > 0 ? data.quantity : 1;
  return trackMetaEvent("AddToCart", {
    content_ids: [data.content_id],
    content_name: data.content_name,
    content_category: data.content_category,
    content_type: "product",
    value: data.value,
    currency: data.currency || "ARS",
    contents: [{ id: data.content_id, quantity: qty, item_price: data.value }],
    num_items: qty,
  });
}

export function trackInitiateCheckout(data: {
  content_ids: string[];
  contents: Array<{ id: string; quantity: number; item_price?: number }>;
  value: number;
  currency?: string;
  num_items: number;
}): string {
  return trackMetaEvent("InitiateCheckout", {
    content_ids: data.content_ids,
    contents: data.contents,
    content_type: "product",
    value: data.value,
    currency: data.currency || "ARS",
    num_items: data.num_items,
  });
}

export function trackPurchase(data: {
  order_id: string;
  content_ids: string[];
  contents: Array<{ id: string; quantity: number; item_price?: number }>;
  value: number;
  currency?: string;
  num_items: number;
}): string {
  const storageKey = `meta_purchase_${data.order_id}`;
  try {
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(storageKey)) {
      return storageKey;
    }
    sessionStorage?.setItem(storageKey, "1");
  } catch {
    // ignore
  }

  return trackMetaEvent(
    "Purchase",
    {
      content_ids: data.content_ids,
      contents: data.contents,
      content_type: "product",
      value: data.value,
      currency: data.currency || "ARS",
      num_items: data.num_items,
      order_id: data.order_id,
    },
    { eventId: `purchase_${data.order_id}` },
  );
}
