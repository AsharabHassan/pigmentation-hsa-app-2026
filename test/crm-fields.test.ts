import { describe, expect, it } from "vitest";

import {
  CRM_CONTACT_FIELDS,
  CRM_REPORT_FIELD_KEY,
  GHL_TO_CRM_FIELDS,
  cleanCrmCustom,
  crmLeadCustomFields,
} from "@/lib/crm-fields";
import { buildGhlPayload, createServerMetaConversion } from "@/lib/ghl";
import type { AnalyzeResult, Lead } from "@/lib/types";

const lead: Lead = { firstName: "Jane", lastName: "Doe", email: "jane@example.com", phone: "07700900123" };
const result: AnalyzeResult = {
  bucket: "good", score: 71, hardFlags: [], softFlagged: false, routedReason: "r",
  usedPhoto: true, zonesObscured: [], makeupDetected: false, zoneSeverity: {}, zoneImprovement: {},
  framingAdequate: true, narrativeSource: "claude", spotType: "solar_lentigines", secondarySpotType: "melasma",
  narrative: { headline: "Sun spots on the cheeks", narrative: "n", observedAreas: ["cheeks"], encouragement: "e" },
};
const payload = buildGhlPayload(lead, result, {
  submittedAt: "2026-11-19T10:00:00.000Z",
  clinicLocation: "london",
  imageProcessingConsent: true,
  metaTrackingConsent: true,
  meta: createServerMetaConversion({
    lead,
    attribution: { fbp: null, fbc: "fb.1.1700000000000.IwAR123", eventSourceUrl: null },
    eventId: "evt-1",
  }),
});

describe("GoHighLevel → CRM field map", () => {
  it("gives every field the GHL path writes a CRM key that exists in the CRM", () => {
    for (const f of GHL_TO_CRM_FIELDS) {
      expect(CRM_CONTACT_FIELDS, `${f.ghlKey} (${f.ghlId})`).toHaveProperty(f.crmKey);
    }
    // ghl-report.ts writes GHL_REPORT_FIELD_KEY (default facial_app_report_pdf)
    const report = GHL_TO_CRM_FIELDS.find((f) => f.ghlKey === "facial_app_report_pdf");
    expect(report?.crmKey).toBe(CRM_REPORT_FIELD_KEY);
  });

  it("maps every webhook field GHL's workflow stored", () => {
    const stored = ["suitabilityScore", "suitabilityLabel", "observedAreas", "headline", "metaFbclid", "metaEventId", "metaTrackingConsent"];
    for (const from of stored) {
      const f = GHL_TO_CRM_FIELDS.find((m) => m.from === from);
      expect(f, from).toBeDefined();
      expect(from in payload, `${from} is in the payload`).toBe(true);
    }
  });

  it("only writes CRM keys that exist, with values their field accepts", () => {
    const custom = crmLeadCustomFields(payload);
    expect(Object.keys(custom).length).toBe(10);
    for (const [key, value] of Object.entries(custom)) {
      const field = (CRM_CONTACT_FIELDS as Record<string, { options?: readonly string[] }>)[key];
      expect(field, key).toBeDefined();
      if (field.options) expect(field.options).toContain(value);
      expect(value).not.toContain("{{");
    }
    expect(custom).toMatchObject({
      hsa_meta_event_id: "evt-1",
      hsa_meta_fbclid: "IwAR123",
      hsa_meta_tracking_consent: "true",
      primary_concern: "Solar lentigo",
    });
  });

  it("drops empty values (they would clear the field) and options the CRM would refuse", () => {
    expect(cleanCrmCustom({ assessment_label: "", hsa_meta_tracking_consent: "maybe", primary_concern: " Melasma " })).toEqual({
      primary_concern: "Melasma",
    });
  });
});
