import type { LeadRequest } from "@/lib/types";
import { buildGhlPayload } from "@/lib/ghl";
import { serverEnv } from "@/lib/env";

export const runtime = "nodejs";

const RETRIES = 3;

/** First hop in `x-forwarded-for` is the real client on Vercel. */
function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim() || null;
  return request.headers.get("x-real-ip");
}

async function deliver(url: string, payload: unknown): Promise<boolean> {
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) return true;
    } catch {
      /* network error — retry */
    }
    // simple linear backoff: 250ms, 500ms
    await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
  }
  return false;
}

// POST /api/lead — forward the qualified lead to GoHighLevel. Never blocks the
// user: delivery failures are logged server-side, and we still return 200 so the
// result screen unlocks regardless.
export async function POST(request: Request): Promise<Response> {
  let body: LeadRequest;
  try {
    body = (await request.json()) as LeadRequest;
  } catch {
    return Response.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  if (!body?.lead || !body?.result) {
    return Response.json({ ok: false, error: "missing fields" }, { status: 400 });
  }

  // Meta's server-side match quality leans on the client's UA and IP, neither of
  // which the browser can report about itself — read them off this request. The
  // event id itself is the browser's, so the CRM's Conversions API copy dedupes
  // against the pixel event instead of double-counting the conversion.
  const meta = body.meta
    ? {
        ...body.meta,
        clientUserAgent: request.headers.get("user-agent"),
        clientIpAddress: clientIp(request),
      }
    : undefined;

  const payload = buildGhlPayload(
    body.lead,
    body.result,
    new Date().toISOString(),
    meta,
  );

  let webhook: string | undefined;
  try {
    webhook = serverEnv().GHL_WEBHOOK_URL;
  } catch {
    webhook = undefined;
  }

  let delivered = false;
  if (webhook) {
    delivered = await deliver(webhook, payload);
    if (!delivered) console.error("[lead] GHL delivery failed", body.lead.email);
  } else {
    console.warn("[lead] GHL_WEBHOOK_URL not set; lead not forwarded");
  }

  return Response.json({ ok: true, delivered });
}
