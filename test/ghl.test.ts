import { describe, it, expect } from "vitest";
import { buildGhlPayload } from "@/lib/ghl";
import type { AnalyzeResult, Lead, MetaTracking } from "@/lib/types";

const lead: Lead = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  phone: "07700900123",
  marketingConsent: true,
};

const result: AnalyzeResult = {
  bucket: "great",
  score: 88,
  hardFlags: [],
  softFlagged: false,
  routedReason: "ideal",
  usedPhoto: true,
  zonesObscured: [],
  makeupDetected: false,
  zoneSeverity: {},
  zoneImprovement: {},
  framingAdequate: true,
  narrativeSource: "claude",
  narrative: {
    headline: "Your skin shows exactly what this treatment targets",
    narrative: "…",
    observedAreas: ["cheeks", "forehead"],
    encouragement: "…",
  },
};

describe("buildGhlPayload", () => {
  it("maps contact fields", () => {
    const p = buildGhlPayload(lead, result, "2026-06-04T10:00:00.000Z");
    expect(p.firstName).toBe("Jane");
    expect(p.lastName).toBe("Doe");
    expect(p.name).toBe("Jane Doe");
    expect(p.email).toBe("jane@example.com");
    expect(p.phone).toBe("07700900123");
  });

  it("tags the lead with the bucket for AI-agent routing", () => {
    const p = buildGhlPayload(lead, result, "2026-06-04T10:00:00.000Z");
    expect(p.tags).toContain("pigmentation-analyzer");
    expect(p.tags).toContain("pigmentation-great");
  });

  it("carries the suitability fields", () => {
    const p = buildGhlPayload(lead, result, "2026-06-04T10:00:00.000Z");
    expect(p.suitabilityBucket).toBe("great");
    expect(p.suitabilityScore).toBe(88);
    expect(p.suitabilityLabel).toBe("Strong candidate");
    expect(p.usedPhoto).toBe(true);
    expect(p.observedAreas).toEqual(["cheeks", "forehead"]);
    expect(p.submittedAt).toBe("2026-06-04T10:00:00.000Z");
  });

  it("records marketing consent as its own boolean, separate from the lead", () => {
    const granted = buildGhlPayload(lead, result, "t");
    expect(granted.marketingConsent).toBe(true);

    const declined = buildGhlPayload(
      { ...lead, marketingConsent: false },
      result,
      "t",
    );
    expect(declined.marketingConsent).toBe(false);
  });

  it("forwards the Meta conversion envelope for CRM-side dedup", () => {
    const meta: MetaTracking = {
      pixelId: "823507040655170",
      eventName: "Lead",
      eventId: "b3f1c2d4-0000-4000-8000-abcdefabcdef",
      eventTime: 1780000000,
      actionSource: "website",
      fbp: "fb.1.1780000000000.1234567890",
      fbc: "fb.1.1780000000000.IwAR0abc",
      fbclid: "IwAR0abc",
      eventSourceUrl: "https://pigmentation.harleystreetaesthetic.co.uk/",
      clientUserAgent: "Mozilla/5.0",
      clientIpAddress: "203.0.113.7",
    };
    const p = buildGhlPayload(lead, result, "t", meta);
    expect(p.metaPixelId).toBe("823507040655170");
    expect(p.metaEventName).toBe("Lead");
    expect(p.metaEventId).toBe("b3f1c2d4-0000-4000-8000-abcdefabcdef");
    expect(p.metaEventTime).toBe(1780000000);
    expect(p.metaFbp).toBe("fb.1.1780000000000.1234567890");
    expect(p.metaFbc).toBe("fb.1.1780000000000.IwAR0abc");
    expect(p.metaClientIpAddress).toBe("203.0.113.7");
  });

  it("omits Meta keys entirely when no envelope is supplied", () => {
    const p = buildGhlPayload(lead, result, "t");
    expect(p.metaEventId).toBeUndefined();
    // Absent — not null — so a re-delivery can't blank a stored CRM field.
    expect(JSON.parse(JSON.stringify(p))).not.toHaveProperty("metaEventId");
  });

  it("serializes hard flags for consultation-routed leads", () => {
    const p = buildGhlPayload(lead, {
      ...result,
      bucket: "consultation",
      hardFlags: ["pregnancy"],
    });
    expect(p.suitabilityBucket).toBe("consultation");
    expect(p.hardFlags).toContain("pregnancy");
    expect(p.tags).toContain("pigmentation-consultation");
  });
});
