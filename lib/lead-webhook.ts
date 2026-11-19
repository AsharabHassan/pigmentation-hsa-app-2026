import type { ClinicLocationKey } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Where a lead is delivered. Since the GoHighLevel → own-CRM cutover each clinic
// has its own CRM inbound webhook; a clinic without one keeps GoHighLevel. The
// payload is the same either way (see lib/ghl.ts buildGhlPayload).
// ─────────────────────────────────────────────────────────────────────────────

export interface LeadWebhookEnv {
  GHL_WEBHOOK_URL?: string;
  CRM_WEBHOOK_URL_LONDON?: string;
  CRM_WEBHOOK_URL_GLASGOW?: string;
}

export interface LeadWebhookTarget {
  url: string;
  destination: "crm" | "ghl";
}

/** The clinic's CRM webhook when set, else GoHighLevel's, else nothing. */
export function leadWebhookTarget(
  clinicLocation: ClinicLocationKey,
  env: LeadWebhookEnv,
): LeadWebhookTarget | undefined {
  const crm =
    clinicLocation === "glasgow"
      ? env.CRM_WEBHOOK_URL_GLASGOW
      : env.CRM_WEBHOOK_URL_LONDON;
  if (crm) return { url: crm, destination: "crm" };
  if (env.GHL_WEBHOOK_URL) return { url: env.GHL_WEBHOOK_URL, destination: "ghl" };
  return undefined;
}
