import { createHash } from "crypto";
import type { MetaCapiRequestBody, MetaUserDataInput } from "./types";

const GRAPH_VERSION = "v21.0";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function hashIfPresent(
  value: string | null | undefined,
  normalizer: (v: string) => string,
): string | undefined {
  if (!value || !String(value).trim()) return undefined;
  return sha256(normalizer(String(value)));
}

function buildUserData(input: MetaUserDataInput | undefined) {
  if (!input) return {};

  const userData: Record<string, string> = {};

  const em = hashIfPresent(input.email, normalizeEmail);
  if (em) userData.em = em;

  const ph = hashIfPresent(input.phone, normalizePhone);
  if (ph) userData.ph = ph;

  const fn = hashIfPresent(input.first_name, (v) => v.trim().toLowerCase());
  if (fn) userData.fn = fn;

  const ln = hashIfPresent(input.last_name, (v) => v.trim().toLowerCase());
  if (ln) userData.ln = ln;

  const externalId = hashIfPresent(input.external_id, (v) => v.trim());
  if (externalId) userData.external_id = externalId;

  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) userData.fbc = input.fbc;
  if (input.client_ip_address) userData.client_ip_address = input.client_ip_address;
  if (input.client_user_agent) userData.client_user_agent = input.client_user_agent;

  return userData;
}

export function getMetaPixelId(): string | undefined {
  return (
    process.env.META_PIXEL_ID?.trim() ||
    process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ||
    undefined
  );
}

export function getMetaCapiAccessToken(): string | undefined {
  return process.env.META_CAPI_ACCESS_TOKEN?.trim() || undefined;
}

export async function sendMetaCapiEvent(
  body: MetaCapiRequestBody,
): Promise<{ ok: boolean; skipped?: boolean; status?: number; error?: string }> {
  const pixelId = getMetaPixelId();
  const accessToken = getMetaCapiAccessToken();

  if (!pixelId || !accessToken) {
    return { ok: true, skipped: true };
  }

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: body.event_name,
        event_time: body.event_time ?? Math.floor(Date.now() / 1000),
        event_id: body.event_id,
        event_source_url: body.event_source_url,
        action_source: "website",
        user_data: buildUserData(body.user_data),
        custom_data: body.custom_data || {},
      },
    ],
  };

  const testCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim();
  if (testCode) {
    payload.test_event_code = testCode;
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[Meta CAPI] error", res.status, text);
      return { ok: false, status: res.status, error: text || res.statusText };
    }

    return { ok: true, status: res.status };
  } catch (error) {
    console.error("[Meta CAPI] request failed", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "CAPI request failed",
    };
  }
}
