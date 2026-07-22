import { randomUUID } from "node:crypto";
import type {
  AnalyzeResult,
  ClientMetaAttribution,
  Lead,
  ServerMetaConversion,
} from "./types";
import { BUCKET_META } from "./constants";

export const META_DATASET_ID = "1849043682301992" as const;
export const META_EVENT_NAME = "Lead" as const;
export const PRODUCTION_ORIGIN =
  "https://pigmentation.harleystreetaesthetic.co.uk";

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
  metaTrackingConsent: boolean;
  reportStorageConsent: boolean;
  submittedAt?: string;
  // Flat, allow-listed fields for the conditional GHL -> Meta CAPI action.
  metaDatasetId?: string;
  metaPixelId?: string;
  metaEventName?: string;
  metaEventId?: string;
  metaEventTime?: number;
  metaActionSource?: string;
  metaEventSourceUrl?: string;
  metaFbp?: string;
  metaFbc?: string;
  metaFirstName?: string;
  metaLastName?: string;
  metaEmail?: string;
  metaPhone?: string;
  metaClientUserAgent?: string;
  metaClientIpAddress?: string;
}

export interface BuildGhlPayloadOptions {
  submittedAt?: string;
  metaTrackingConsent: boolean;
  reportStorageConsent: boolean;
  meta?: ServerMetaConversion;
}

/** Force an untrusted browser URL onto the production origin and drop query/hash. */
export function canonicalEventSourceUrl(raw?: string | null): string {
  let pathname = "/";
  if (raw) {
    try {
      pathname = new URL(raw, PRODUCTION_ORIGIN).pathname || "/";
    } catch {
      pathname = "/";
    }
  }

  const canonical = new URL(PRODUCTION_ORIGIN);
  canonical.pathname = pathname.replace(/\/{2,}/g, "/");
  canonical.search = "";
  canonical.hash = "";
  return canonical.toString();
}

function optionalValue(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Create the server-controlled Meta event after consent has been validated. */
export function createServerMetaConversion(options: {
  lead: Lead;
  attribution?: ClientMetaAttribution;
  clientUserAgent?: string | null;
  clientIpAddress?: string | null;
  eventId?: string;
  eventTime?: number;
}): ServerMetaConversion {
  return {
    datasetId: META_DATASET_ID,
    pixelId: META_DATASET_ID,
    eventName: META_EVENT_NAME,
    eventId: options.eventId ?? randomUUID(),
    eventTime: options.eventTime ?? Math.floor(Date.now() / 1000),
    actionSource: "website",
    eventSourceUrl: canonicalEventSourceUrl(
      options.attribution?.eventSourceUrl,
    ),
    fbp: optionalValue(options.attribution?.fbp),
    fbc: optionalValue(options.attribution?.fbc),
    firstName: options.lead.firstName,
    lastName: options.lead.lastName,
    email: options.lead.email,
    phone: options.lead.phone,
    clientUserAgent: optionalValue(options.clientUserAgent),
    clientIpAddress: optionalValue(options.clientIpAddress),
  };
}

/** Build the GoHighLevel inbound-webhook body. This helper performs no I/O. */
export function buildGhlPayload(
  lead: Lead,
  result: AnalyzeResult,
  options: BuildGhlPayloadOptions,
): GhlPayload {
  const meta = options.metaTrackingConsent ? options.meta : undefined;
  const metaFields: Partial<GhlPayload> = meta
    ? {
        metaDatasetId: meta.datasetId,
        metaPixelId: meta.pixelId,
        metaEventName: meta.eventName,
        metaEventId: meta.eventId,
        metaEventTime: meta.eventTime,
        metaActionSource: meta.actionSource,
        metaEventSourceUrl: meta.eventSourceUrl,
        metaFbp: meta.fbp,
        metaFbc: meta.fbc,
        metaFirstName: meta.firstName,
        metaLastName: meta.lastName,
        metaEmail: meta.email,
        metaPhone: meta.phone,
        metaClientUserAgent: meta.clientUserAgent,
        metaClientIpAddress: meta.clientIpAddress,
      }
    : {};

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
    metaTrackingConsent: options.metaTrackingConsent,
    reportStorageConsent: options.reportStorageConsent,
    submittedAt: options.submittedAt,
    ...metaFields,
  };
}
