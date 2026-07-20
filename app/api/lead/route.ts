import type { LeadRequest } from "@/lib/types";
import { buildGhlPayload } from "@/lib/ghl";
import { serverEnv } from "@/lib/env";

export const runtime = "nodejs";

const RETRIES = 3;

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

  const payload = buildGhlPayload(
    body.lead,
    body.result,
    new Date().toISOString(),
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
