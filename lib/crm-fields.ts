import type { GhlPayload } from "./ghl";

// ─────────────────────────────────────────────────────────────────────────────
// Where this app's data lands in the clinic CRM (Harley Street Aesthetics
// sub-account). The CRM holds the GoHighLevel custom fields, imported with a
// map from each GHL field id to its CRM key (ghl_import_map, read 19 Nov 2026).
// Keys here are CRM keys. Values sent to a dropdown/multiselect must be one of
// its options, so they are checked against the snapshot below before sending.
// ─────────────────────────────────────────────────────────────────────────────

/** X-Source on every CRM call (shown in the CRM's logs). */
export const CRM_APP_SOURCE = "hsa-pigmentation-app";

export interface CrmFieldDef {
  label: string;
  type: "text" | "textarea" | "dropdown" | "multiselect";
  options?: readonly string[];
}

/** The CRM contact fields this app writes (snapshot of custom_fields). */
export const CRM_CONTACT_FIELDS = {
  facial_app_report_pdf: { label: "Facial APP Report PDF", type: "text" },
  suitability_score: { label: "Suitability Score", type: "text" },
  assessment_label: { label: "Assessment Label", type: "text" },
  assessment_zones: { label: "Assessment Zones", type: "text" },
  hsa_pigmentation_summary: { label: "HSA Pigmentation Summary", type: "textarea" },
  hsa_meta_fbclid: { label: "HSA Meta FBCLID", type: "text" },
  hsa_meta_event_id: { label: "HSA Meta Event ID", type: "text" },
  hsa_meta_tracking_consent: { label: "HSA Meta Tracking Consent", type: "multiselect", options: ["Yes", "true", "false"] },
  primary_concern: { label: "Primary Concern", type: "text" },
  time_of_form_submission: { label: "Time of Form Submission", type: "text" },
  form_submitted_treatment: { label: "Form Submitted Treatment", type: "text" },
} as const satisfies Record<string, CrmFieldDef>;

export type CrmFieldKey = keyof typeof CRM_CONTACT_FIELDS;

/** The field that holds the report's link (GHL_REPORT_FIELD_KEY on the GHL path). */
export const CRM_REPORT_FIELD_KEY: CrmFieldKey = "facial_app_report_pdf";

/**
 * Every field the GoHighLevel path writes today, with its GHL id and key and
 * the CRM key it maps to: the report link (lib/ghl-report.ts) and the fields
 * GHL's "Pigmentation Application Form Connection" workflow filled from the
 * inbound-webhook payload (`from`). Retired payload fields (marketingConsent,
 * reportStorageConsent) are no longer sent, so they are not mapped.
 */
export const GHL_TO_CRM_FIELDS = [
  { ghlId: "yq2y7oeNIBsBsjU2xCzn", ghlKey: "facial_app_report_pdf", crmKey: "facial_app_report_pdf", from: "report link" },
  { ghlId: "IFlY1GWor8XNLhVDKV7i", ghlKey: "suitability_score", crmKey: "suitability_score", from: "suitabilityScore" },
  { ghlId: "1UkvDrl5uvY4Ek2FrBh9", ghlKey: "assessment_label", crmKey: "assessment_label", from: "suitabilityLabel" },
  { ghlId: "SgMOHauwI3H4SIygSWIe", ghlKey: "assessment_zones", crmKey: "assessment_zones", from: "observedAreas" },
  { ghlId: "MedGXzb8msu37474WKVv", ghlKey: "hsa_pigmentation_summary", crmKey: "hsa_pigmentation_summary", from: "headline" },
  { ghlId: "5u9XTVjBwUc0zFis4GEs", ghlKey: "hsa_meta_fbclid", crmKey: "hsa_meta_fbclid", from: "metaFbclid" },
  { ghlId: "ywZtBA2Qh6JSnocTlT99", ghlKey: "hsa_meta_event_id", crmKey: "hsa_meta_event_id", from: "metaEventId" },
  { ghlId: "iRalDAM26D8x8tAO2fFV", ghlKey: "hsa_meta_tracking_consent", crmKey: "hsa_meta_tracking_consent", from: "metaTrackingConsent" },
] as const satisfies readonly { ghlId: string; ghlKey: string; crmKey: CrmFieldKey; from: string }[];

/**
 * Collected by the app (payload fields) with no CRM field to hold them. They
 * still reach the CRM as tags where noted; no field is created for them.
 */
export const UNMAPPED_PAYLOAD_FIELDS = [
  "suitabilityBucket (tag pigmentation-<bucket>)",
  "hardFlags",
  "usedPhoto",
  "narrativeSource",
  "secondaryPigmentationType",
  "clinicLocation / clinicLocationLabel / clinicAddress (tag hsa-clinic-<city>; the CRM's Clinic Address dropdown has other addresses)",
  "imageProcessingConsent / imageProcessingConsentAt / imageProcessingConsentRecordedAt / privacyNoticeVersion",
  "consultationContactConsent / At / Statement / Version (tag hsa-consultation-call-requested)",
  "preferredCallTime (tag hsa-call-<time>)",
  "other Meta CAPI fields (dataset, event time, fbp, fbc, hashed identity)",
] as const;

const MAX_TEXT = 5_000;

/** Drop empty values and values a dropdown/multiselect would refuse. */
export function cleanCrmCustom(values: Partial<Record<CrmFieldKey, string | undefined>>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(values)) {
    const field = (CRM_CONTACT_FIELDS as Record<string, CrmFieldDef>)[key];
    const value = (raw ?? "").trim();
    if (!field || !value) continue;
    if (field.options) {
      const picked = value.split(/\s*[,;]\s*/).filter(Boolean);
      const ok = picked.every((p) => field.options!.some((o) => o.toLowerCase() === p.toLowerCase()));
      if (!ok) continue;
    }
    out[key] = value.slice(0, MAX_TEXT);
  }
  return out;
}

/** The lead's answers and results as CRM custom fields. */
export function crmLeadCustomFields(payload: GhlPayload): Record<string, string> {
  return cleanCrmCustom({
    suitability_score: String(payload.suitabilityScore),
    assessment_label: payload.suitabilityLabel,
    assessment_zones: payload.observedAreas.join(", "),
    hsa_pigmentation_summary: payload.headline,
    hsa_meta_fbclid: payload.metaFbclid,
    hsa_meta_event_id: payload.metaEventId,
    hsa_meta_tracking_consent: payload.metaTrackingConsent ? "true" : "false",
    primary_concern: payload.pigmentationType,
    time_of_form_submission: payload.submittedAt,
    form_submitted_treatment: "Pigmentation Analysis",
  });
}
