import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { leadWebhookTarget } from "@/lib/lead-webhook";
import type { AnalyzeResult, Lead } from "@/lib/types";

const routing = vi.hoisted(() => ({
  ghl: vi.fn(async (...args: unknown[]) => ({ ok: args.length > 0, tagged: true })),
  crm: vi.fn(async (...args: unknown[]) => ({ ok: args.length > 0, tagged: true, contactId: 4773 })),
}));
vi.mock("@/lib/ghl-contact", () => ({ ensureLeadRoutingInGhl: routing.ghl }));
vi.mock("@/lib/crm-lead", () => ({ ensureLeadInCrm: routing.crm }));
vi.mock("@/lib/insights-store", () => ({ attachLead: vi.fn(async () => null) }));

const GHL = "https://services.leadconnectorhq.com/hooks/ghl-example";
const LONDON = "https://app.crm.example/api/webhooks/inbound/london-example";
const GLASGOW = "https://app.crm.example/api/webhooks/inbound/glasgow-example";

describe("leadWebhookTarget", () => {
  it("sends each clinic's lead to its own CRM webhook", () => {
    const env = { GHL_WEBHOOK_URL: GHL, CRM_WEBHOOK_URL_LONDON: LONDON, CRM_WEBHOOK_URL_GLASGOW: GLASGOW };
    expect(leadWebhookTarget("london", env)).toEqual({ url: LONDON, destination: "crm" });
    expect(leadWebhookTarget("glasgow", env)).toEqual({ url: GLASGOW, destination: "crm" });
  });

  it("keeps GoHighLevel for a clinic without a CRM webhook", () => {
    const env = { GHL_WEBHOOK_URL: GHL, CRM_WEBHOOK_URL_LONDON: LONDON };
    expect(leadWebhookTarget("glasgow", env)).toEqual({ url: GHL, destination: "ghl" });
    expect(leadWebhookTarget("london", { GHL_WEBHOOK_URL: GHL })).toEqual({ url: GHL, destination: "ghl" });
  });

  it("has no target when nothing is configured", () => {
    expect(leadWebhookTarget("london", {})).toBeUndefined();
  });
});

const ENV_KEYS = ["GHL_WEBHOOK_URL", "CRM_WEBHOOK_URL_LONDON", "CRM_WEBHOOK_URL_GLASGOW", "CRM_LEAD_WEBHOOK_URL"] as const;

function stubEnv(values: Partial<Record<(typeof ENV_KEYS)[number], string>>) {
  vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
  // Unset (not blank): the older GHL/CRM_LEAD vars reject a blank value.
  for (const key of ENV_KEYS) vi.stubEnv(key, values[key]);
}

describe("CRM webhook env validation", () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllEnvs());

  it("treats blank CRM webhook values as not set", async () => {
    stubEnv({ GHL_WEBHOOK_URL: GHL });
    vi.stubEnv("CRM_WEBHOOK_URL_LONDON", "");
    vi.stubEnv("CRM_WEBHOOK_URL_GLASGOW", "  ");
    const { serverEnv } = await import("@/lib/env");
    expect(serverEnv().CRM_WEBHOOK_URL_LONDON).toBeUndefined();
    expect(serverEnv().CRM_WEBHOOK_URL_GLASGOW).toBeUndefined();
  });

  it("accepts https CRM webhook URLs", async () => {
    stubEnv({ CRM_WEBHOOK_URL_LONDON: LONDON, CRM_WEBHOOK_URL_GLASGOW: GLASGOW });
    const { serverEnv } = await import("@/lib/env");
    expect(serverEnv().CRM_WEBHOOK_URL_LONDON).toBe(LONDON);
    expect(serverEnv().CRM_WEBHOOK_URL_GLASGOW).toBe(GLASGOW);
  });

  it("rejects a non-URL or plain-http CRM webhook", async () => {
    stubEnv({ CRM_WEBHOOK_URL_LONDON: "not a url" });
    let env = await import("@/lib/env");
    expect(() => env.serverEnv()).toThrow(/CRM_WEBHOOK_URL_LONDON/);
    vi.resetModules();
    stubEnv({ CRM_WEBHOOK_URL_GLASGOW: "http://app.crm.example/hook" });
    env = await import("@/lib/env");
    expect(() => env.serverEnv()).toThrow(/CRM_WEBHOOK_URL_GLASGOW must use https/);
  });
});

const lead: Lead = { firstName: "Jane", lastName: "Doe", email: "jane@example.com", phone: "07700900123" };
const result: AnalyzeResult = {
  bucket: "great", score: 88, hardFlags: [], softFlagged: false, routedReason: "ideal",
  usedPhoto: true, zonesObscured: [], makeupDetected: false, zoneSeverity: {}, zoneImprovement: {},
  framingAdequate: true, narrativeSource: "claude",
  narrative: { headline: "h", narrative: "n", observedAreas: [], encouragement: "e" },
};

describe("lead route delivery target", () => {
  const fetchMock = vi.fn(async (..._args: unknown[]) => new Response("{}", { status: 200 }));
  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockClear();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function post(clinicLocation: "london" | "glasgow") {
    const { POST } = await import("@/app/api/lead/route");
    const response = await POST(new Request("https://pigmentation.harleystreetaesthetic.co.uk/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead, result, clinicLocation, metaTrackingConsent: false,
        imageProcessingConsent: true, imageProcessingConsentAt: "2026-11-20T09:00:00.000Z",
      }),
    }));
    const urls = fetchMock.mock.calls.map((call) => String(call[0]));
    const bodies = fetchMock.mock.calls.map((call) => JSON.parse(String((call[1] as RequestInit).body)));
    return { json: await response.json(), urls, bodies };
  }

  it("posts a London lead only to the London CRM webhook", async () => {
    stubEnv({ GHL_WEBHOOK_URL: GHL, CRM_WEBHOOK_URL_LONDON: LONDON, CRM_WEBHOOK_URL_GLASGOW: GLASGOW });
    const { json, urls, bodies } = await post("london");
    expect(urls).toEqual([LONDON]);
    expect(bodies[0]).toMatchObject({ clinicLocation: "london", email: "jane@example.com" });
    expect(json.delivered).toBe(true);
  });

  it("posts a Glasgow lead only to the Glasgow CRM webhook", async () => {
    stubEnv({ GHL_WEBHOOK_URL: GHL, CRM_WEBHOOK_URL_LONDON: LONDON, CRM_WEBHOOK_URL_GLASGOW: GLASGOW });
    const { urls, bodies } = await post("glasgow");
    expect(urls).toEqual([GLASGOW]);
    expect(bodies[0]).toMatchObject({ clinicLocation: "glasgow" });
  });

  it("keeps posting to GoHighLevel when the clinic has no CRM webhook", async () => {
    stubEnv({ GHL_WEBHOOK_URL: GHL, CRM_WEBHOOK_URL_LONDON: LONDON });
    const { urls } = await post("glasgow");
    expect(urls).toEqual([GHL]);
  });

  it("sends the same payload to the CRM as it would to GoHighLevel", async () => {
    stubEnv({ GHL_WEBHOOK_URL: GHL });
    const ghl = (await post("london")).bodies[0];
    fetchMock.mockClear();
    vi.resetModules();
    stubEnv({ GHL_WEBHOOK_URL: GHL, CRM_WEBHOOK_URL_LONDON: LONDON });
    const crm = (await post("london")).bodies[0];
    expect(Object.keys(crm).sort()).toEqual(Object.keys(ghl).sort());
    const strip = (p: Record<string, unknown>) => ({ ...p, submittedAt: "", imageProcessingConsentRecordedAt: "" });
    expect(strip(crm)).toEqual(strip(ghl));
  });

  it("does not send the extra CRM_LEAD_WEBHOOK_URL copy when it is the same address", async () => {
    stubEnv({ GHL_WEBHOOK_URL: GHL, CRM_WEBHOOK_URL_LONDON: LONDON, CRM_LEAD_WEBHOOK_URL: LONDON });
    const { urls } = await post("london");
    expect(urls).toEqual([LONDON]);
  });

  it("still sends the extra CRM_LEAD_WEBHOOK_URL copy when it is a different address", async () => {
    const extra = "https://app.crm.example/api/webhooks/inbound/other";
    stubEnv({ GHL_WEBHOOK_URL: GHL, CRM_LEAD_WEBHOOK_URL: extra });
    const { urls } = await post("london");
    expect(urls.sort()).toEqual([GHL, extra].sort());
  });

  it("routes the contact through the CRM API, with its answers in custom fields, when CRM_API_KEY is set", async () => {
    routing.ghl.mockClear();
    routing.crm.mockClear();
    stubEnv({ CRM_WEBHOOK_URL_LONDON: LONDON });
    vi.stubEnv("CRM_API_KEY", "crm-test-key");
    const { json } = await post("london");
    expect(json).toMatchObject({ ok: true, routingEnsured: true });
    expect(routing.ghl).not.toHaveBeenCalled();
    expect(routing.crm).toHaveBeenCalledTimes(1);
    const input = routing.crm.mock.calls[0][0] as { tags: string[]; custom: Record<string, string>; source: string };
    expect(input.source).toBe("Pigmentation Analyzer · London");
    expect(input.tags).toEqual(expect.arrayContaining(["pigmentation-analyzer", "hsa-clinic-london", "pigmentation-great"]));
    expect(input.custom).toMatchObject({ suitability_score: "88", assessment_label: "Strong candidate", hsa_meta_tracking_consent: "false" });
  });

  it("keeps GoHighLevel routing when only the GHL env is set", async () => {
    routing.ghl.mockClear();
    routing.crm.mockClear();
    stubEnv({ GHL_WEBHOOK_URL: GHL });
    vi.stubEnv("CRM_API_KEY", undefined);
    await post("london");
    expect(routing.crm).not.toHaveBeenCalled();
    expect(routing.ghl).toHaveBeenCalledTimes(1);
  });
});
