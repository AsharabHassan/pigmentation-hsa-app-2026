import { isIP } from "node:net";
import { z } from "zod";
import {
  buildGhlPayload,
  createServerMetaConversion,
} from "@/lib/ghl";
import { serverEnv } from "@/lib/env";
import { leadWebhookTarget, type LeadWebhookTarget } from "@/lib/lead-webhook";
import { ensureLeadRoutingInGhl } from "@/lib/ghl-contact";
import { crmConfigured } from "@/lib/crm-api";
import { crmLeadCustomFields } from "@/lib/crm-fields";
import { ensureLeadInCrm } from "@/lib/crm-lead";
import { attachLead } from "@/lib/insights-store";
import { SPOT_TYPE_KEYS } from "@/lib/spot-types";
import { CALL_TIME_KEYS } from "@/lib/consultation-consent";
import type { Lead } from "@/lib/types";

export const runtime = "nodejs";

const DELIVERY_ATTEMPTS = 3;
const WEBHOOK_TIMEOUT_MS = 5_000;
const PRODUCTION_ORIGIN =
  "https://pigmentation.harleystreetaesthetic.co.uk";
const LEGACY_PRIVACY_NOTICE_VERSION = "legacy-checkbox-v1";

const shortText = z.string().trim().min(1).max(200);
const zoneSchema = z.enum([
  "forehead",
  "undereye",
  "nose",
  "cheeks",
  "upperlip",
  "jawline",
]);

const leadSchema = z
  .object({
    firstName: shortText,
    lastName: shortText,
    email: z.string().trim().email().max(320),
    phone: z
      .string()
      .trim()
      .min(7)
      .max(32)
      .refine((value) => value.replace(/\D/g, "").length >= 7),
    // The retired marketing checkbox. A client version still open in a
    // visitor's tab may keep sending it; accepted so a strict-mode rejection
    // never loses an in-flight lead, then dropped by the transform below so no
    // marketing consent signal can reach the CRM.
    marketingConsent: z.boolean().optional(),
  })
  .strict()
  .transform(
    ({ firstName, lastName, email, phone }): Lead => ({
      firstName,
      lastName,
      email,
      phone,
    }),
  );

const resultSchema = z
  .object({
    bucket: z.enum(["great", "good", "consultation", "alternative"]),
    score: z.number().finite().min(0).max(100),
    hardFlags: z.array(z.string().max(200)).max(25),
    softFlagged: z.boolean(),
    routedReason: z.string().max(2_000),
    narrative: z
      .object({
        headline: z.string().max(500),
        narrative: z.string().max(8_000),
        observedAreas: z.array(z.string().max(200)).max(20),
        encouragement: z.string().max(2_000),
      })
      .strict(),
    narrativeSource: z.enum(["claude", "fallback"]),
    usedPhoto: z.boolean(),
    zonesObscured: z.array(zoneSchema).max(6),
    makeupDetected: z.boolean(),
    zoneSeverity: z.record(z.string(), z.number().finite().min(0).max(100)),
    zoneImprovement: z.record(
      z.string(),
      z.number().finite().min(0).max(100),
    ),
    framingAdequate: z.boolean(),
    spotType: z.enum(SPOT_TYPE_KEYS).nullable().optional(),
    secondarySpotType: z.enum(SPOT_TYPE_KEYS).nullable().optional(),
    analysisId: z.string().uuid().optional(),
  })
  .strict();

const attributionSchema = z
  .object({
    fbp: z.string().trim().max(255).nullable(),
    fbc: z.string().trim().max(255).nullable(),
    eventSourceUrl: z.string().trim().max(2_048).nullable(),
  })
  .strict();

export const leadRequestSchema = z
  .object({
    lead: leadSchema,
    result: resultSchema,
    // Defaults preserve leads from browser tabs opened before location routing
    // was deployed. Current clients always send the route's clinic explicitly.
    clinicLocation: z.enum(["london", "glasgow"]).default("london"),
    // Optional only for a short migration window so an already-open version of
    // the previous checkbox-based client does not lose a submitted lead.
    imageProcessingConsent: z.literal(true).optional(),
    imageProcessingConsentAt: z.string().datetime().optional(),
    metaTrackingConsent: z.boolean(),
    // "I'm requesting a free consultation" — ticked before the scan. Optional
    // only so a tab opened before this release doesn't lose its lead.
    consultationContactConsent: z.literal(true).optional(),
    consultationContactConsentAt: z.string().datetime().optional(),
    consultationContactStatement: z.string().trim().max(500).optional(),
    consultationContactConsentVersion: z.string().trim().max(64).optional(),
    preferredCallTime: z.enum(CALL_TIME_KEYS).optional(),
    // Retired alongside the full-report feature. Accepted from an already-open
    // tab for the same reason as `marketingConsent`, and never acted upon.
    reportStorageConsent: z.boolean().optional(),
    attribution: attributionSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const hasConsent = value.imageProcessingConsent !== undefined;
    const hasConsentTime = value.imageProcessingConsentAt !== undefined;
    if (hasConsent !== hasConsentTime) {
      context.addIssue({
        code: "custom",
        path: hasConsent
          ? ["imageProcessingConsentAt"]
          : ["imageProcessingConsent"],
        message:
          "image processing consent and its action time must be supplied together",
      });
    }
  });

/** First x-forwarded-for hop is the client address on Vercel. */
export function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  const candidate =
    forwarded?.split(",")[0].trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "";
  return isIP(candidate) ? candidate : null;
}

function requestUserAgent(request: Request): string | null {
  const userAgent = request.headers.get("user-agent")?.trim();
  return userAgent ? userAgent.slice(0, 1_024) : null;
}

/** Only the real same-origin production app may enqueue a Meta conversion. */
export function isProductionMetaRequest(request: Request): boolean {
  let requestOrigin: string;
  try {
    requestOrigin = new URL(request.url).origin.toLowerCase();
  } catch {
    return false;
  }

  if (requestOrigin !== PRODUCTION_ORIGIN) return false;

  const originHeader = request.headers.get("origin")?.trim().toLowerCase();
  if (originHeader !== PRODUCTION_ORIGIN) return false;

  const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase();
  return !fetchSite || fetchSite === "same-origin";
}

export interface DeliveryResult {
  delivered: boolean;
  attempts: number;
}

export async function deliverWebhook(
  url: string,
  payload: unknown,
  options: {
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
    wait?: (milliseconds: number) => Promise<void>;
  } = {},
): Promise<DeliveryResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? WEBHOOK_TIMEOUT_MS;
  const wait =
    options.wait ??
    ((milliseconds: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));

  for (let attempt = 1; attempt <= DELIVERY_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (response.ok) return { delivered: true, attempts: attempt };
    } catch {
      // Network errors and aborts are retried below.
    } finally {
      clearTimeout(timeout);
    }

    if (attempt < DELIVERY_ATTEMPTS) await wait(250 * attempt);
  }

  return { delivered: false, attempts: DELIVERY_ATTEMPTS };
}

// Forward the lead to the clinic's CRM (or GoHighLevel until its CRM webhook
// is set). Delivery failure never blocks result access.
export async function POST(request: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const parsed = leadRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "invalid request" },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const submittedAt = new Date().toISOString();
  const legacyCheckboxClient = body.imageProcessingConsent === undefined;
  const metaTrackingAllowed =
    body.metaTrackingConsent && isProductionMetaRequest(request);
  const meta = metaTrackingAllowed
    ? createServerMetaConversion({
        lead: body.lead,
        attribution: body.attribution,
        clientUserAgent: requestUserAgent(request),
        clientIpAddress: clientIp(request),
      })
    : undefined;
  const payload = buildGhlPayload(body.lead, body.result, {
    submittedAt,
    clinicLocation: body.clinicLocation,
    imageProcessingConsent: true,
    imageProcessingConsentAt:
      body.imageProcessingConsentAt ?? submittedAt,
    privacyNoticeVersion: legacyCheckboxClient
      ? LEGACY_PRIVACY_NOTICE_VERSION
      : undefined,
    metaTrackingConsent: metaTrackingAllowed,
    meta,
    consultationContact: body.consultationContactConsent
      ? {
          at: body.consultationContactConsentAt ?? submittedAt,
          statement: body.consultationContactStatement ?? "",
          version: body.consultationContactConsentVersion ?? "",
        }
      : undefined,
    preferredCallTime: body.preferredCallTime,
  });

  // The clinic's own CRM webhook when set (CRM_WEBHOOK_URL_LONDON / _GLASGOW),
  // otherwise GoHighLevel's — same payload either way.
  let target: LeadWebhookTarget | undefined;
  let crmWebhook: string | undefined;
  try {
    const env = serverEnv();
    target = leadWebhookTarget(body.clinicLocation, env);
    crmWebhook = env.CRM_LEAD_WEBHOOK_URL;
  } catch {
    target = undefined;
    crmWebhook = undefined;
  }
  // The older extra copy (CRM_LEAD_WEBHOOK_URL) is skipped when it is the same
  // address as the main target, so the CRM never gets the lead twice.
  if (crmWebhook && crmWebhook === target?.url) crmWebhook = undefined;

  const deliveryPromise = target
    ? deliverWebhook(target.url, payload)
    : Promise.resolve<DeliveryResult>({ delivered: false, attempts: 0 });
  const crmPromise = crmWebhook
    ? deliverWebhook(crmWebhook, payload)
    : Promise.resolve<DeliveryResult>({ delivered: false, attempts: 0 });
  // The contact itself, its tags and (CRM) its answers in custom fields: the
  // clinic CRM's API when CRM_API_KEY is set, else GoHighLevel's as before.
  const routingDestination = crmConfigured() ? "crm" : "ghl";
  const routingInput = {
    lead: body.lead,
    source: `Pigmentation Analyzer · ${payload.clinicLocationLabel}`,
    tags: payload.tags,
  };
  const routingPromise =
    routingDestination === "crm"
      ? ensureLeadInCrm({ ...routingInput, custom: crmLeadCustomFields(payload) })
      : ensureLeadRoutingInGhl(routingInput);
  const [delivery, routing, , crmDelivery] = await Promise.all([
    deliveryPromise,
    routingPromise,
    body.result.analysisId
      ? attachLead(body.result.analysisId, body.lead)
      : Promise.resolve(null),
    crmPromise,
  ]);

  const trackingQueued = Boolean(
    meta && (delivery.delivered || crmDelivery.delivered),
  );
  const log = {
    event: "ghl_lead_delivery",
    delivered: delivery.delivered,
    attempts: delivery.attempts,
    trackingQueued,
    routingEnsured: routing.ok && routing.tagged === true,
    routingDestination,
    ...(routing.error ? { routingError: routing.error } : {}),
    webhookConfigured: Boolean(target),
    destination: target?.destination ?? "none",
    crmConfigured: Boolean(crmWebhook),
    crmDelivered: crmDelivery.delivered,
    crmAttempts: crmDelivery.attempts,
  };
  if (delivery.delivered && (!crmWebhook || crmDelivery.delivered))
    console.info("[lead]", log);
  else console.warn("[lead]", log);

  return Response.json({
    ok: true,
    delivered: delivery.delivered || crmDelivery.delivered,
    trackingQueued,
    routingEnsured: routing.ok && routing.tagged === true,
  });
}
