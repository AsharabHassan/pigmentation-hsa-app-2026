import { describe, it, expect } from "vitest";
import { PRICE_GUIDE, PROGRAMME_MECHANISM, PROTOCOL_STEPS, PROTOCOL_SUPPORT, SESSIONS_GUIDE } from "@/lib/constants";
import { REGION_COPY } from "@/lib/face-regions";
import { GENERIC_PITCH, PITCH, TREATMENT_TAGLINE, WHY_HSA } from "@/lib/protocol-pitch";
import { RESULT_SCHEMA } from "@/lib/prompts/result-schema";
import { SYSTEM_PIGMENTATION } from "@/lib/prompts/system-pigmentation";
import { REPORT_DISCLAIMER, SPOT_TYPES, SPOT_TYPE_KEYS, isSpotTypeKey } from "@/lib/spot-types";
import { buildGhlPayload } from "@/lib/ghl";
import { genericFallbackResult } from "@/lib/assessment";

describe("pigmentation types", () => {
  it("explains every protocol step, how and why, for every type", () => {
    for (const key of SPOT_TYPE_KEYS) {
      const t = SPOT_TYPES[key];
      expect(t.key).toBe(key);
      expect(t.steps).toHaveLength(PROTOCOL_STEPS.length);
      for (const s of t.steps) {
        expect(s.how.length).toBeGreaterThan(30);
        expect(s.why.length).toBeGreaterThan(30);
      }
      for (const text of [t.what, t.cause, t.outlook]) expect(text.length).toBeGreaterThan(30);
    }
  });

  it("offers the model exactly the known types plus an honest 'none'", () => {
    for (const field of ["primarySpotType", "secondarySpotType"] as const) {
      expect([...RESULT_SCHEMA.properties[field].enum]).toEqual([...SPOT_TYPE_KEYS, "none"]);
      expect(RESULT_SCHEMA.required).toContain(field);
    }
    expect(isSpotTypeKey("none")).toBe(false);
    expect(isSpotTypeKey("melanoma")).toBe(false);
  });

  it("keeps individual lesions out of the classification", () => {
    expect(SYSTEM_PIGMENTATION).toContain("PIGMENTATION ONLY — IGNORE EVERYTHING ELSE");
    expect(SYSTEM_PIGMENTATION).toMatch(/ignore any other skin feature — moles/);
  });

  it("never promises a cure or a guaranteed result", () => {
    const copy = JSON.stringify(SPOT_TYPES).toLowerCase();
    for (const term of ["guarantee", "permanently remove", "100%"]) expect(copy).not.toContain(term);
  });

  it("presents the treatment as the 3R Programme: Reduce, Regulate, Reverse", () => {
    expect(PROTOCOL_STEPS.map((s) => s.title.split(" ")[0])).toEqual(["Reduce", "Regulate", "Reverse"]);
    expect(PROTOCOL_STEPS[2].title).toMatch(/optional/);
    expect(PROTOCOL_STEPS[2].blurb).toMatch(/discussed with your consultant/);
    expect(PRICE_GUIDE.line).toBe("£299 per session, or £999 for a course of 4 sessions");
    expect(SESSIONS_GUIDE.note).toMatch(/course of 4 sessions, two weeks apart/);
    expect(SESSIONS_GUIDE.note).toMatch(/6 or 8/);
    expect(PROGRAMME_MECHANISM).toMatch(/junction between the two top layers/);
  });

  it("keeps all treatment copy inside the wording rules", () => {
    const copy = JSON.stringify([
      PROTOCOL_STEPS, PROTOCOL_SUPPORT, SESSIONS_GUIDE, PRICE_GUIDE, PROGRAMME_MECHANISM,
      Object.values(SPOT_TYPES).map((t) => [t.steps, t.outlook]),
      PITCH, GENERIC_PITCH, TREATMENT_TAGLINE, WHY_HSA, REGION_COPY,
    ]).toLowerCase();
    // No product or brand names, no "peel" for our treatment, no forbidden claims.
    expect(copy).not.toMatch(/amiko|cmca|perfecta|auric/);
    expect(copy).not.toMatch(/peel|brighten|brightening|lighten|whiten/);
    expect(copy).not.toMatch(/needle|painless|pain-free/);
    expect(copy).not.toMatch(/guarantee|permanent|\bcure|repairs dna|reverses the disease/);
    expect(copy).not.toMatch(/three-phase|2–3 sessions|—/);
    expect(SYSTEM_PIGMENTATION).toContain("3R Programme");
    expect(SYSTEM_PIGMENTATION).not.toMatch(/three-phase|2–3 sessions|33% stabilised/);
  });

  it("closes the report with the not-a-diagnosis statement", () => {
    expect(REPORT_DISCLAIMER).toMatch(/informational purposes only/);
    expect(REPORT_DISCLAIMER).toMatch(/not a diagnosis/);
    expect(REPORT_DISCLAIMER).toMatch(/free online consultation/);
  });

  it("sends the type to GoHighLevel as a field and a tag", () => {
    const base = { ...genericFallbackResult(true), spotType: "solar_lentigines" as const, secondarySpotType: null };
    const lead = { firstName: "A", lastName: "B", email: "a@example.com", phone: "07000000000" };
    const options = { clinicLocation: "london", imageProcessingConsent: true, metaTrackingConsent: false } as Parameters<typeof buildGhlPayload>[2];
    const payload = buildGhlPayload(lead, base, options);
    expect(payload.pigmentationType).toBe("Solar lentigo");
    expect(payload.tags).toContain("hsa-spot-solar-lentigines");
    const none = buildGhlPayload(lead, genericFallbackResult(true), options);
    expect(none.pigmentationType).toBe("");
    expect(none.tags.some((t) => t.startsWith("hsa-spot-"))).toBe(false);
  });
});
