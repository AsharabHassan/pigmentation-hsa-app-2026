import "server-only";
import { query } from "./db";

// ─────────────────────────────────────────────────────────────────────────────
// Read side of the insights database: the funnel, booking rate by segment (the
// "why"), and the people behind it. Used only by the password-protected /admin.
// ─────────────────────────────────────────────────────────────────────────────

/** One analysis per row with its lead and booking outcome resolved. */
const BASE = `
  SELECT a.*,
         (a.lead_at IS NOT NULL) AS is_lead,
         b.status AS booking_status,
         b.start_time AS booking_start,
         b.received_at AS booked_at,
         (b.analysis_id IS NOT NULL) AS is_booked,
         EXISTS (SELECT 1 FROM events e
                  WHERE e.analysis_id = a.id AND e.type = 'finance_used') AS used_finance
    FROM analyses a
    LEFT JOIN LATERAL (
      SELECT * FROM bookings
       WHERE analysis_id = a.id AND status <> 'cancelled'
       ORDER BY received_at DESC LIMIT 1
    ) b ON true
   WHERE a.created_at >= now() - make_interval(days => $1)
`;

// Dimension label → SQL expression. Keys are fixed here, never user input.
export const SEGMENTS = {
  "Verdict": "bucket",
  "Suitability score": `CASE WHEN score >= 85 THEN '85–100' WHEN score >= 70 THEN '70–84'
     WHEN score >= 55 THEN '55–69' ELSE 'under 55' END`,
  "Main concern zone": "COALESCE(top_zone, 'none read')",
  "Severity of main zone": `CASE WHEN top_severity IS NULL THEN 'none read'
     WHEN top_severity >= 70 THEN 'high (70+)' WHEN top_severity >= 40 THEN 'medium (40–69)'
     ELSE 'low (under 40)' END`,
  "Clinic": "clinic_location",
  "Campaign": "COALESCE(utm_campaign, CASE WHEN from_meta_ad THEN '(meta ad, untagged)' WHEN from_google_ad THEN '(google ad, untagged)' ELSE '(none)' END)",
  "Ad platform": "CASE WHEN from_google_ad THEN 'Google Ads' WHEN from_meta_ad THEN 'Meta Ads' ELSE 'other / organic' END",
  "Landing page": "COALESCE(landing_path, '(unknown)')",
  "Ad / creative": "COALESCE(utm_content, '(none)')",
  "Source": "COALESCE(utm_source, referrer_host, '(direct)')",
  "Device": "device",
  "Used the payment calculator": "CASE WHEN used_finance THEN 'yes' ELSE 'no' END",
  "Makeup detected": "CASE WHEN makeup_detected THEN 'yes' ELSE 'no' END",
  "AI read": "CASE WHEN narrative_source = 'claude' THEN 'AI analysis' ELSE 'fallback result' END",
  "Time of day (UK)": `CASE WHEN EXTRACT(hour FROM created_at AT TIME ZONE 'Europe/London') < 12 THEN 'morning'
     WHEN EXTRACT(hour FROM created_at AT TIME ZONE 'Europe/London') < 18 THEN 'afternoon'
     ELSE 'evening' END`,
} as const;

export interface Funnel {
  analyses: number;
  leads: number;
  calendarViewed: number;
  ctaClicked: number;
  booked: number;
  unmatchedBookings: number;
  medianHoursToBook: number | null;
}

export interface SegmentRow {
  value: string;
  analyses: number;
  leads: number;
  booked: number;
}

export interface PersonRow {
  created_at: string;
  name: string;
  email: string | null;
  phone: string | null;
  clinic_location: string;
  bucket: string;
  score: number;
  top_zone: string | null;
  campaign: string | null;
  cta_clicks: number;
  booking_status: string | null;
  booking_start: string | null;
}

export async function loadFunnel(days: number): Promise<Funnel> {
  const [row] = await query<Record<string, string | null>>(
    `WITH base AS (${BASE})
     SELECT count(*) AS analyses,
            count(*) FILTER (WHERE is_lead) AS leads,
            count(*) FILTER (WHERE is_booked) AS booked,
            (SELECT count(DISTINCT e.analysis_id) FROM events e
              WHERE e.type = 'calendar_viewed' AND e.analysis_id IN (SELECT id FROM base)) AS calendar_viewed,
            (SELECT count(DISTINCT e.analysis_id) FROM events e
              WHERE e.type = 'cta_click' AND e.analysis_id IN (SELECT id FROM base)) AS cta_clicked,
            (SELECT count(*) FROM bookings
              WHERE analysis_id IS NULL AND status <> 'cancelled'
                AND received_at >= now() - make_interval(days => $1)) AS unmatched,
            percentile_cont(0.5) WITHIN GROUP (
              ORDER BY EXTRACT(epoch FROM booked_at - lead_at) / 3600
            ) FILTER (WHERE is_booked AND is_lead) AS median_hours
       FROM base`,
    [days],
  );
  const n = (v: string | null | undefined) => Number(v ?? 0);
  return {
    analyses: n(row?.analyses),
    leads: n(row?.leads),
    calendarViewed: n(row?.calendar_viewed),
    ctaClicked: n(row?.cta_clicked),
    booked: n(row?.booked),
    unmatchedBookings: n(row?.unmatched),
    medianHoursToBook:
      row?.median_hours == null ? null : Number(row.median_hours),
  };
}

export async function loadSegment(
  expression: string,
  days: number,
): Promise<SegmentRow[]> {
  const rows = await query<Record<string, string>>(
    `WITH base AS (${BASE})
     SELECT (${expression})::text AS value,
            count(*) AS analyses,
            count(*) FILTER (WHERE is_lead) AS leads,
            count(*) FILTER (WHERE is_booked) AS booked
       FROM base GROUP BY 1 ORDER BY count(*) DESC LIMIT 12`,
    [days],
  );
  return rows.map((r) => ({
    value: r.value,
    analyses: Number(r.analyses),
    leads: Number(r.leads),
    booked: Number(r.booked),
  }));
}

export async function loadPeople(days: number): Promise<PersonRow[]> {
  return query<PersonRow & Record<string, unknown>>(
    `WITH base AS (${BASE})
     SELECT created_at, trim(coalesce(first_name,'') || ' ' || coalesce(last_name,'')) AS name,
            email, phone, clinic_location, bucket, score, top_zone,
            COALESCE(utm_campaign, utm_source) AS campaign,
            (SELECT count(*)::int FROM events e
              WHERE e.analysis_id = base.id AND e.type = 'cta_click') AS cta_clicks,
            booking_status, booking_start
       FROM base WHERE is_lead
      ORDER BY is_booked DESC, created_at DESC LIMIT 200`,
    [days],
  );
}
