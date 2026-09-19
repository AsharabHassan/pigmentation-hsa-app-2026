import { timingSafeEqual } from "node:crypto";
import { bookingWebhookSchema } from "@/lib/insights";
import { recordBooking } from "@/lib/insights-store";
import { dbConfigured } from "@/lib/db";

export const runtime = "nodejs";

function secretMatches(provided: string | null): boolean {
  const expected = process.env.BOOKING_WEBHOOK_SECRET?.trim();
  if (!expected || !provided) return false;
  const a = Buffer.from(provided.trim());
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// POST /api/booking — called by a GoHighLevel workflow ("Customer Booked
// Appointment" / "Appointment Status" trigger → Custom Webhook action) so the
// insights database knows which analyses turned into a consultation.
//
// Auth: shared secret in the `x-hsa-secret` header (or `?secret=`), set as
// BOOKING_WEBHOOK_SECRET. Body fields: email, phone, name, appointmentId,
// status, startTime, calendar — see README for the GHL value mapping.
export async function POST(request: Request): Promise<Response> {
  const provided =
    request.headers.get("x-hsa-secret") ??
    new URL(request.url).searchParams.get("secret");
  if (!secretMatches(provided)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const parsed = bookingWebhookSchema.safeParse(raw);
  if (!parsed.success || (!parsed.data.email && !parsed.data.phone)) {
    return Response.json(
      { ok: false, error: "email or phone is required" },
      { status: 400 },
    );
  }

  if (!dbConfigured()) {
    return Response.json(
      { ok: false, error: "database not configured" },
      { status: 503 },
    );
  }

  const outcome = await recordBooking(parsed.data);
  console.info("[booking]", { event: "ghl_booking", ...outcome });
  // A 5xx makes GoHighLevel retry, so a database blip doesn't lose the booking.
  return Response.json(
    { ok: outcome.stored, matched: outcome.matched },
    { status: outcome.stored ? 200 : 503 },
  );
}
