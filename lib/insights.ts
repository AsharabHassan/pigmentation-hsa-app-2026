import { z } from "zod";
import type { AnalyzeResult, ClinicLocationKey, Lead } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers for the insights database: what a visit looked like when it
// arrived, and how a later GoHighLevel booking is matched back to an analysis.
// Kept free of `pg` so they are unit-testable and safe to import anywhere.
// ─────────────────────────────────────────────────────────────────────────────

const label = z.string().trim().max(200);

/** First-party visit context sent with the analysis. No cookies, no ad ids. */
export const visitContextSchema = z
  .object({
    clinicLocation: z.enum(["london", "glasgow"]).default("london"),
    utmSource: label.nullish(),
    utmMedium: label.nullish(),
    utmCampaign: label.nullish(),
    utmContent: label.nullish(),
    utmTerm: label.nullish(),
    fromMetaAd: z.boolean().default(false),
    landingPath: label.nullish(),
    referrerHost: label.nullish(),
  })
  .strip();

export type VisitContext = z.infer<typeof visitContextSchema>;

export const EVENT_TYPES = [
  "result_viewed",
  "calendar_viewed",
  "cta_click",
  "call_click",
  "report_download",
  "finance_used",
] as const;
export type InsightEventType = (typeof EVENT_TYPES)[number];

/** Coarse device class — enough to compare booking rates, not to fingerprint. */
export function deviceFromUserAgent(userAgent: string | null): string {
  if (!userAgent) return "unknown";
  if (/ipad|tablet/i.test(userAgent)) return "tablet";
  if (/mobi|iphone|android/i.test(userAgent)) return "mobile";
  return "desktop";
}

export function normalizeEmail(email: string | null | undefined): string | null {
  const value = email?.trim().toLowerCase();
  return value ? value : null;
}

/**
 * Last 10 digits, so "07700 900123", "+44 7700 900123" and "447700900123" all
 * match the same person whichever format GoHighLevel reports.
 */
export function phoneKey(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 7 ? digits.slice(-10) : null;
}

/** The zone with the highest visible-pigmentation read: the main concern. */
export function topZone(
  result: Pick<AnalyzeResult, "zoneSeverity" | "zonesObscured">,
): { zone: string; severity: number } | null {
  let best: { zone: string; severity: number } | null = null;
  for (const [zone, severity] of Object.entries(result.zoneSeverity ?? {})) {
    if ((result.zonesObscured as string[]).includes(zone)) continue;
    if (!best || severity > best.severity) best = { zone, severity };
  }
  return best;
}

export interface AnalysisRecord {
  id: string;
  clinicLocation: ClinicLocationKey;
  result: AnalyzeResult;
  context: VisitContext;
  device: string;
}

export type LeadRecord = Lead;

/** GoHighLevel workflow → Custom Webhook body. Field names are ours to define. */
export const bookingWebhookSchema = z
  .object({
    email: z.string().trim().max(320).nullish(),
    phone: z.string().trim().max(40).nullish(),
    name: z.string().trim().max(400).nullish(),
    appointmentId: z.string().trim().max(200).nullish(),
    status: z.string().trim().max(60).nullish(),
    startTime: z.string().trim().max(80).nullish(),
    calendar: z.string().trim().max(200).nullish(),
  })
  .strip();

export type BookingWebhook = z.infer<typeof bookingWebhookSchema>;

/** Collapse GHL appointment statuses into the four the dashboard reports. */
export function bookingStatus(
  raw: string | null | undefined,
): "booked" | "cancelled" | "showed" | "noshow" {
  const value = (raw ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (value.includes("cancel") || value.includes("invalid")) return "cancelled";
  if (value.includes("noshow")) return "noshow";
  if (value.includes("show")) return "showed";
  return "booked";
}

export function parseStartTime(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const time = new Date(raw);
  return Number.isNaN(time.getTime()) ? null : time.toISOString();
}
