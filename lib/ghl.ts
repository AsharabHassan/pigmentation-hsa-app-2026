import type { AnalyzeResult, Lead, MetaTracking } from "./types";
import { BUCKET_META } from "./constants";

// ─────────────────────────────────────────────────────────────────────────────
// Pure builder for the GoHighLevel inbound-webhook payload. No network here —
// the route owns delivery/retry. Marketing consent is carried as its own field,
// deliberately separate from the lead's intent to see their result (PECR).
// ─────────────────────────────────────────────────────────────────────────────

export interface GhlPayload {
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  tags: string[];
  suitabilityBucket: string;
  suitabilityLabel: string;
  suitabilityScore: number;
  hardFlags: string[];
  observedAreas: string[];
  usedPhoto: boolean;
  narrativeSource: string;
  headline: string;
  marketingConsent: boolean;
  submittedAt?: string;
  // ── Meta conversion tracking (flat, so GHL can map each to a custom field) ──
  /** The pixel this conversion belongs to. */
  metaPixelId?: string;
  metaEventName?: string;
  /** Dedup key: the CRM's server-side event must reuse this id verbatim. */
  metaEventId?: string;
  metaEventTime?: number;
  metaActionSource?: string;
  metaEventSourceUrl?: string;
  metaFbp?: string;
  metaFbc?: string;
  metaFbclid?: string;
  metaClientUserAgent?: string;
  metaClientIpAddress?: string;
}

export function buildGhlPayload(
  lead: Lead,
  result: AnalyzeResult,
  submittedAt?: string,
  meta?: MetaTracking,
): GhlPayload {
  return {
    firstName: lead.firstName,
    lastName: lead.lastName,
    name: `${lead.firstName} ${lead.lastName}`.trim(),
    email: lead.email,
    phone: lead.phone,
    source: "Pigmentation Analyzer",
    tags: ["pigmentation-analyzer", `pigmentation-${result.bucket}`],
    suitabilityBucket: result.bucket,
    suitabilityLabel: BUCKET_META[result.bucket].label,
    suitabilityScore: result.score,
    hardFlags: result.hardFlags,
    observedAreas: result.narrative.observedAreas,
    usedPhoto: result.usedPhoto,
    narrativeSource: result.narrativeSource,
    headline: result.narrative.headline,
    marketingConsent: lead.marketingConsent,
    submittedAt,
    // `?? undefined` rather than null: absent keys are dropped by JSON.stringify,
    // so GHL never overwrites a stored value with an empty one on re-delivery.
    metaPixelId: meta?.pixelId,
    metaEventName: meta?.eventName,
    metaEventId: meta?.eventId,
    metaEventTime: meta?.eventTime,
    metaActionSource: meta?.actionSource,
    metaEventSourceUrl: meta?.eventSourceUrl ?? undefined,
    metaFbp: meta?.fbp ?? undefined,
    metaFbc: meta?.fbc ?? undefined,
    metaFbclid: meta?.fbclid ?? undefined,
    metaClientUserAgent: meta?.clientUserAgent ?? undefined,
    metaClientIpAddress: meta?.clientIpAddress ?? undefined,
  };
}
