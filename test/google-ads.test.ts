// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ consent: "unset", production: true }));
vi.mock("@/lib/meta-consent", () => ({
  getAdvertisingConsent: () => state.consent,
  isExactProductionHost: () => state.production,
}));
import { googleMeasurementUrl, initializeGoogleAds, initializeTagManager, revokeGoogleAds, trackCompletedGoogleLead } from "@/lib/google-ads";
import { submitLead } from "@/lib/api-client";
import type { LeadRequest } from "@/lib/types";

beforeEach(() => {
  state.consent = "unset";
  state.production = true;
  delete window.gtag;
  delete window.dataLayer;
  delete window.__hsaGoogleConfigured;
  delete window.__hsaTagManagerStarted;
  delete window.__hsaGoogleLeadIds;
  vi.unstubAllGlobals();
});

describe("Google Ads privacy and delivery", () => {
  it("does not initialize or send events without consent or on a preview", () => {
    initializeGoogleAds();
    trackCompletedGoogleLead("one");
    expect(window.dataLayer).toBeUndefined();
    state.consent = "granted";
    state.production = false;
    initializeGoogleAds();
    trackCompletedGoogleLead("one");
    expect(window.dataLayer).toBeUndefined();
  });
  it("keeps click attribution but strips arbitrary personal data from URLs", () => {
    expect(googleMeasurementUrl("https://example.com/glasgow?gclid=abc-123&email=person@example.com&score=70#results"))
      .toBe("https://example.com/glasgow?gclid=abc-123");
  });
  it("counts each completed submission once and never grants customer-data use", () => {
    state.consent = "granted";
    trackCompletedGoogleLead("one");
    trackCompletedGoogleLead("one");
    const commands = window.dataLayer!.map(x => Array.from(x as ArrayLike<unknown>));
    const conversions = commands.filter(x => x[0] === "event");
    expect(conversions).toHaveLength(1);
    expect(conversions[0][2]).toMatchObject({ transaction_id: "one", value: 0 });
    expect(commands.filter(x => x[0] === "consent").every(x => (x[2] as { ad_user_data: string }).ad_user_data === "denied")).toBe(true);
    expect(commands.find(x => x[0] === "config")?.[2]).toMatchObject({ allow_enhanced_conversions: false });
  });
  it("starts Tag Manager once, only with consent, after the denied defaults", () => {
    initializeTagManager();
    expect(window.dataLayer).toBeUndefined();
    state.consent = "granted";
    initializeTagManager();
    initializeTagManager();
    const entries = window.dataLayer!.map(x => (Array.isArray(x) || !("length" in (x as object)) ? x : Array.from(x as ArrayLike<unknown>)));
    const starts = entries.filter(x => (x as { event?: string }).event === "gtm.js");
    expect(starts).toHaveLength(1);
    const firstConsent = entries.findIndex(x => Array.isArray(x) && x[0] === "consent" && x[1] === "default");
    expect(firstConsent).toBeGreaterThanOrEqual(0);
    expect(firstConsent).toBeLessThan(entries.indexOf(starts[0]));
  });
  it("stops subsequent events when consent is withdrawn", () => {
    state.consent = "granted";
    initializeGoogleAds();
    state.consent = "denied";
    revokeGoogleAds();
    trackCompletedGoogleLead("one");
    expect(window.dataLayer!.map(x => Array.from(x as ArrayLike<unknown>)).filter(x => x[0] === "event")).toHaveLength(0);
  });
  it.each([
    [200, { ok: true, delivered: true }, true],
    [200, { ok: true, routingEnsured: true }, true],
    [200, { ok: true, delivered: false, routingEnsured: false }, false],
    [500, { ok: false }, false],
  ])("requires actual server-confirmed delivery (%s, %j)", async (status, payload, expected) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: status === 200, json: async () => payload }));
    expect(await submitLead({} as LeadRequest)).toBe(expected);
  });
  it("never reports a network failure as a completed lead", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await submitLead({} as LeadRequest)).toBe(false);
  });
});
