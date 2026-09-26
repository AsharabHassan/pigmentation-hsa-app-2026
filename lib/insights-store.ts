import "server-only";
import { query, tryDb } from "./db";
import {
  bookingStatus,
  normalizeEmail,
  parseStartTime,
  phoneKey,
  topZone,
  type AnalysisRecord,
  type BookingWebhook,
  type InsightEventType,
  type LeadRecord,
} from "./insights";

/** Every completed analysis, whether or not the visitor goes on to leave details. */
export function recordAnalysis(record: AnalysisRecord): Promise<unknown> {
  const { result, context } = record;
  const top = topZone(result);
  return tryDb("recordAnalysis", () =>
    query(
      `INSERT INTO analyses (
         id, clinic_location, bucket, score, narrative_source, used_photo,
         makeup_detected, framing_adequate, zones_obscured, zone_severity,
         zone_improvement, top_zone, top_severity, headline, narrative,
         utm_source, utm_medium, utm_campaign, utm_content, utm_term,
         from_meta_ad, landing_path, referrer_host, device, from_google_ad
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
         $20,$21,$22,$23,$24,$25
       ) ON CONFLICT (id) DO NOTHING`,
      [
        record.id,
        record.clinicLocation,
        result.bucket,
        Math.round(result.score),
        result.narrativeSource,
        result.usedPhoto,
        result.makeupDetected,
        result.framingAdequate,
        result.zonesObscured,
        JSON.stringify(result.zoneSeverity ?? {}),
        JSON.stringify(result.zoneImprovement ?? {}),
        top?.zone ?? null,
        top ? Math.round(top.severity) : null,
        result.narrative.headline,
        result.narrative.narrative,
        context.utmSource ?? null,
        context.utmMedium ?? null,
        context.utmCampaign ?? null,
        context.utmContent ?? null,
        context.utmTerm ?? null,
        context.fromMetaAd,
        context.landingPath ?? null,
        context.referrerHost ?? null,
        record.device,
        context.fromGoogleAd,
      ],
    ),
  );
}

/** Attach the submitted contact details to the analysis they belong to. */
export function attachLead(
  analysisId: string,
  lead: LeadRecord,
): Promise<unknown> {
  return tryDb("attachLead", () =>
    query(
      `UPDATE analyses
          SET lead_at = COALESCE(lead_at, now()),
              first_name = $2, last_name = $3, email = $4, phone = $5,
              phone_key = $6
        WHERE id = $1`,
      [
        analysisId,
        lead.firstName,
        lead.lastName,
        normalizeEmail(lead.email),
        lead.phone,
        phoneKey(lead.phone),
      ],
    ),
  );
}

export function recordEvent(
  analysisId: string,
  type: InsightEventType,
  detail: string | null,
): Promise<unknown> {
  return tryDb("recordEvent", () =>
    query(
      `INSERT INTO events (analysis_id, type, detail)
       SELECT $1, $2, $3 WHERE EXISTS (SELECT 1 FROM analyses WHERE id = $1)`,
      [analysisId, type, detail],
    ),
  );
}

/**
 * Store a GoHighLevel appointment and link it to the most recent analysis from
 * the same email or phone. Unmatched bookings are kept (analysis_id NULL) so the
 * dashboard can show how many consultations came from outside the analyzer.
 */
export async function recordBooking(
  booking: BookingWebhook,
): Promise<{ stored: boolean; matched: boolean }> {
  const email = normalizeEmail(booking.email);
  const key = phoneKey(booking.phone);
  const outcome = await tryDb("recordBooking", async () => {
    const match =
      email || key
        ? await query<{ id: string }>(
            `SELECT id FROM analyses
              WHERE lead_at IS NOT NULL
                AND (($1::text IS NOT NULL AND email = $1)
                  OR ($2::text IS NOT NULL AND phone_key = $2))
              ORDER BY lead_at DESC LIMIT 1`,
            [email, key],
          )
        : [];
    const analysisId = match[0]?.id ?? null;
    await query(
      `INSERT INTO bookings (
         analysis_id, appointment_id, status, start_time, calendar, email,
         phone_key, name
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (appointment_id) DO UPDATE
         SET status = EXCLUDED.status,
             start_time = COALESCE(EXCLUDED.start_time, bookings.start_time),
             analysis_id = COALESCE(bookings.analysis_id, EXCLUDED.analysis_id),
             received_at = now()`,
      [
        analysisId,
        booking.appointmentId || null,
        bookingStatus(booking.status),
        parseStartTime(booking.startTime),
        booking.calendar ?? null,
        email,
        key,
        booking.name ?? null,
      ],
    );
    return { matched: analysisId !== null };
  });
  return { stored: outcome !== null, matched: outcome?.matched ?? false };
}
