import { describe, expect, it, vi } from "vitest";
import {
  buildGhlPayload,
  canonicalEventSourceUrl,
  createServerMetaConversion,
  fbclidFromFbc,
  META_DATASET_ID,
} from "@/lib/ghl";
import {
  clientIp,
  deliverWebhook,
  isProductionMetaRequest,
  leadRequestSchema,
} from "@/app/api/lead/route";
import type { AnalyzeResult, Lead } from "@/lib/types";

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
    narrative: "Personalised result",
    observedAreas: ["cheeks", "forehead"],
    encouragement: "Book a consultation",
  },
};

function buildOptions(overrides: Record<string, unknown> = {}) {
  return {
    submittedAt: "2026-06-04T10:00:00.000Z",
    metaTrackingConsent: false,
    reportStorageConsent: false,
    ...overrides,
  };
}

describe("buildGhlPayload", () => {
  it("maps CRM contact, result and separate consent fields", () => {
    const payload = buildGhlPayload(lead, result, buildOptions());
    expect(payload).toMatchObject({
      firstName: "Jane",
      lastName: "Doe",
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "07700900123",
      suitabilityBucket: "great",
      suitabilityLabel: "Strong candidate",
      suitabilityScore: 88,
      marketingConsent: true,
      metaTrackingConsent: false,
      reportStorageConsent: false,
      submittedAt: "2026-06-04T10:00:00.000Z",
    });
    expect(payload.tags).toEqual(
      expect.arrayContaining(["pigmentation-analyzer", "pigmentation-great"]),
    );
  });

  it("adds only the allow-listed server event when Meta consent is true", () => {
    const meta = createServerMetaConversion({
      lead,
      attribution: {
        fbp: "fb.1.1780000000000.1234567890",
        fbc: "fb.1.1780000000000.IwAR0abc",
        eventSourceUrl:
          "https://evil.example/results?email=jane@example.com#private",
      },
      clientUserAgent: "Mozilla/5.0",
      clientIpAddress: "203.0.113.7",
      eventId: "11111111-1111-4111-8111-111111111111",
      eventTime: 1_780_000_000,
    });
    const payload = buildGhlPayload(
      lead,
      result,
      buildOptions({ metaTrackingConsent: true, meta }),
    );

    expect(payload).toMatchObject({
      metaDatasetId: META_DATASET_ID,
      metaPixelId: META_DATASET_ID,
      metaEventName: "Lead",
      metaEventId: "11111111-1111-4111-8111-111111111111",
      metaEventTime: 1_780_000_000,
      metaActionSource: "website",
      metaEventSourceUrl:
        "https://pigmentation.harleystreetaesthetic.co.uk/results",
      metaFbp: "fb.1.1780000000000.1234567890",
      metaFbc: "fb.1.1780000000000.IwAR0abc",
      metaFbclid: "IwAR0abc",
      metaFirstName: "Jane",
      metaLastName: "Doe",
      metaEmail: "jane@example.com",
      metaPhone: "07700900123",
      metaClientUserAgent: "Mozilla/5.0",
      metaClientIpAddress: "203.0.113.7",
    });
    expect(Object.keys(payload).filter((key) => key.startsWith("meta"))).not.toEqual(
      expect.arrayContaining([
        "metaSuitabilityScore",
        "metaObservedAreas",
        "metaReport",
        "metaMarketingConsent",
      ]),
    );
  });

  it("omits every Meta event field when tracking consent is false", () => {
    const meta = createServerMetaConversion({ lead, eventId: "server-id" });
    const payload = buildGhlPayload(
      lead,
      result,
      buildOptions({ metaTrackingConsent: false, meta }),
    );
    const eventKeys = Object.keys(payload).filter(
      (key) => key.startsWith("meta") && key !== "metaTrackingConsent",
    );
    expect(eventKeys).toEqual([]);
  });
});

describe("Meta server event safety", () => {
  it("derives FBCLID only from Meta's validated _fbc cookie format", () => {
    expect(fbclidFromFbc("fb.1.1780000000000.IwAR0abc_123-xyz")).toBe(
      "IwAR0abc_123-xyz",
    );
    expect(fbclidFromFbc("IwAR0abc_123-xyz")).toBeUndefined();
    expect(fbclidFromFbc("fb.1.not-a-timestamp.IwAR0abc")).toBeUndefined();
    expect(fbclidFromFbc("fb.1.1780000000000.click.id")).toBeUndefined();
  });

  it("does not expose an FBCLID when the consented fbc is malformed", () => {
    const meta = createServerMetaConversion({
      lead,
      attribution: {
        fbp: null,
        fbc: "untrusted-raw-click-id",
        eventSourceUrl: null,
      },
    });
    const payload = buildGhlPayload(
      lead,
      result,
      buildOptions({ metaTrackingConsent: true, meta }),
    );
    expect(payload).not.toHaveProperty("metaFbclid");
  });

  it("pins conversion controls and canonicalises to production origin/path", () => {
    const meta = createServerMetaConversion({
      lead,
      attribution: {
        fbp: null,
        fbc: null,
        eventSourceUrl: "https://attacker.example//report?secret=1#face",
      },
      eventId: "server-generated-id",
      eventTime: 123,
    });
    expect(meta).toMatchObject({
      datasetId: "1849043682301992",
      pixelId: "1849043682301992",
      eventName: "Lead",
      eventId: "server-generated-id",
      eventTime: 123,
      actionSource: "website",
      eventSourceUrl:
        "https://pigmentation.harleystreetaesthetic.co.uk/report",
    });
  });

  it("falls back to the production root for an invalid source URL", () => {
    expect(canonicalEventSourceUrl("http://[")).toBe(
      "https://pigmentation.harleystreetaesthetic.co.uk/",
    );
  });
});

describe("lead request validation", () => {
  const valid = {
    lead,
    result,
    metaTrackingConsent: true,
    reportStorageConsent: false,
    attribution: {
      fbp: null,
      fbc: null,
      eventSourceUrl: "https://pigmentation.harleystreetaesthetic.co.uk/",
    },
  };

  it("accepts the explicit consent and attribution shape", () => {
    expect(leadRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects client-controlled conversion identifiers", () => {
    const parsed = leadRequestSchema.safeParse({
      ...valid,
      attribution: { ...valid.attribution, eventName: "Purchase" },
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a standalone raw fbclid supplied by the browser", () => {
    const parsed = leadRequestSchema.safeParse({
      ...valid,
      attribution: { ...valid.attribution, fbclid: "client-controlled" },
    });
    expect(parsed.success).toBe(false);
  });
});

describe("production Meta request gate", () => {
  it("accepts only the same-origin production lead endpoint", () => {
    const productionRequest = new Request(
      "https://pigmentation.harleystreetaesthetic.co.uk/api/lead",
      {
        method: "POST",
        headers: {
          origin: "https://pigmentation.harleystreetaesthetic.co.uk",
          "sec-fetch-site": "same-origin",
        },
      },
    );
    expect(isProductionMetaRequest(productionRequest)).toBe(true);
  });

  it("rejects previews, cross-site callers and missing browser origins", () => {
    expect(
      isProductionMetaRequest(
        new Request("https://preview-project.vercel.app/api/lead", {
          headers: {
            origin: "https://preview-project.vercel.app",
            "sec-fetch-site": "same-origin",
          },
        }),
      ),
    ).toBe(false);
    expect(
      isProductionMetaRequest(
        new Request(
          "https://pigmentation.harleystreetaesthetic.co.uk/api/lead",
          {
            headers: {
              origin: "https://attacker.example",
              "sec-fetch-site": "cross-site",
            },
          },
        ),
      ),
    ).toBe(false);
    expect(
      isProductionMetaRequest(
        new Request(
          "https://pigmentation.harleystreetaesthetic.co.uk/api/lead",
        ),
      ),
    ).toBe(false);
  });
});

describe("webhook delivery", () => {
  it("uses the first valid forwarded IP and rejects invalid input", () => {
    expect(
      clientIp(
        new Request("https://example.test", {
          headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
        }),
      ),
    ).toBe("203.0.113.7");
    expect(
      clientIp(
        new Request("https://example.test", {
          headers: { "x-forwarded-for": "not-an-ip" },
        }),
      ),
    ).toBeNull();
  });

  it("retries a failed webhook up to three times", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 503 }));
    const wait = vi.fn(async () => undefined);
    const outcome = await deliverWebhook("https://example.test/hook", {}, {
      fetchImpl: fetchImpl as typeof fetch,
      wait,
    });
    expect(outcome).toEqual({ delivered: false, attempts: 3 });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(wait).toHaveBeenCalledTimes(2);
  });

  it("stops retrying after a successful attempt", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 502 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const outcome = await deliverWebhook("https://example.test/hook", {}, {
      fetchImpl: fetchImpl as typeof fetch,
      wait: async () => undefined,
    });
    expect(outcome).toEqual({ delivered: true, attempts: 2 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("aborts timed-out attempts before retrying", async () => {
    const signals: AbortSignal[] = [];
    const fetchImpl = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal;
          if (!signal) return reject(new Error("missing abort signal"));
          signals.push(signal);
          signal.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );
    const outcome = await deliverWebhook("https://example.test/hook", {}, {
      fetchImpl: fetchImpl as typeof fetch,
      timeoutMs: 1,
      wait: async () => undefined,
    });
    expect(outcome).toEqual({ delivered: false, attempts: 3 });
    expect(signals).toHaveLength(3);
    expect(signals.every((signal) => signal.aborted)).toBe(true);
  });
});
