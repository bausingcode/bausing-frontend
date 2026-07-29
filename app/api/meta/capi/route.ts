import { NextRequest, NextResponse } from "next/server";
import { sendMetaCapiEvent } from "@/lib/meta/capiServer";
import type { MetaCapiRequestBody, MetaStandardEvent } from "@/lib/meta/types";

export const runtime = "nodejs";

const ALLOWED_EVENTS = new Set<MetaStandardEvent>([
  "PageView",
  "ViewContent",
  "Search",
  "Contact",
  "AddToCart",
  "InitiateCheckout",
  "Purchase",
]);

function clientIp(request: NextRequest): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") || undefined;
}

export async function POST(request: NextRequest) {
  let body: MetaCapiRequestBody;
  try {
    body = (await request.json()) as MetaCapiRequestBody;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.event_name || !body?.event_id) {
    return NextResponse.json(
      { success: false, error: "event_name and event_id are required" },
      { status: 400 },
    );
  }

  if (!ALLOWED_EVENTS.has(body.event_name)) {
    return NextResponse.json(
      { success: false, error: "Unsupported event_name" },
      { status: 400 },
    );
  }

  const result = await sendMetaCapiEvent({
    ...body,
    user_data: {
      ...body.user_data,
      client_ip_address: body.user_data?.client_ip_address || clientIp(request),
      client_user_agent:
        body.user_data?.client_user_agent ||
        request.headers.get("user-agent") ||
        undefined,
    },
  });

  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error || "CAPI failed", skipped: result.skipped },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    skipped: Boolean(result.skipped),
  });
}
