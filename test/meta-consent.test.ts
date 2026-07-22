import { beforeEach, describe, expect, it } from "vitest";
import {
  ADVERTISING_CONSENT_STORAGE_KEY,
  getAdvertisingConsent,
  getConfiguredProductionHostname,
  isExactProductionHost,
  setAdvertisingConsent,
  syncAdvertisingConsentFromStorage,
} from "@/lib/meta-consent";
import {
  getCanonicalPageUrl,
  getMetaAttribution,
  revokeMetaPixel,
} from "@/lib/meta-pixel";

describe("Meta advertising consent", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete window.__hsaAdvertisingConsent;
    document.cookie = "_fbp=; Max-Age=0; Path=/";
    document.cookie = "_fbc=; Max-Age=0; Path=/";
  });

  it("starts unset and persists an explicit choice without creating Meta cookies", () => {
    expect(getAdvertisingConsent()).toBe("unset");

    setAdvertisingConsent("granted");

    expect(getAdvertisingConsent()).toBe("granted");
    expect(window.localStorage.getItem(ADVERTISING_CONSENT_STORAGE_KEY)).toBe(
      "granted",
    );
    expect(document.cookie).not.toContain("_fbp=");
    expect(document.cookie).not.toContain("_fbc=");
  });

  it("keeps an explicit choice in memory when localStorage is blocked", () => {
    const storageSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("blocked", "SecurityError");
      });

    setAdvertisingConsent("denied");

    expect(getAdvertisingConsent()).toBe("denied");
    storageSpy.mockRestore();
  });

  it("keeps withdrawal authoritative when a stale grant cannot be replaced", () => {
    window.localStorage.setItem(ADVERTISING_CONSENT_STORAGE_KEY, "granted");
    expect(getAdvertisingConsent()).toBe("granted");

    const storageSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("blocked", "SecurityError");
      });

    setAdvertisingConsent("denied");

    expect(window.localStorage.getItem(ADVERTISING_CONSENT_STORAGE_KEY)).toBe(
      "granted",
    );
    expect(getAdvertisingConsent()).toBe("denied");
    storageSpy.mockRestore();
  });

  it("applies cross-tab storage changes to the in-memory choice", () => {
    setAdvertisingConsent("granted");

    syncAdvertisingConsentFromStorage({
      key: ADVERTISING_CONSENT_STORAGE_KEY,
      newValue: "denied",
      storageArea: window.localStorage,
    });

    expect(getAdvertisingConsent()).toBe("denied");
  });

  it("requires an exact hostname match", () => {
    const siteUrl = "https://pigmentation.harleystreetaesthetic.co.uk/path";

    expect(getConfiguredProductionHostname(siteUrl)).toBe(
      "pigmentation.harleystreetaesthetic.co.uk",
    );
    expect(
      isExactProductionHost(
        "pigmentation.harleystreetaesthetic.co.uk",
        siteUrl,
      ),
    ).toBe(true);
    expect(
      isExactProductionHost("preview.harleystreetaesthetic.co.uk", siteUrl),
    ).toBe(false);
    expect(isExactProductionHost("localhost", siteUrl)).toBe(false);
  });

  it("removes query parameters and fragments from attribution URLs", () => {
    expect(
      getCanonicalPageUrl(
        "https://pigmentation.harleystreetaesthetic.co.uk/?utm_source=meta&fbclid=secret#result",
      ),
    ).toBe("https://pigmentation.harleystreetaesthetic.co.uk/");
  });

  it("returns no attribution when consent or production-host checks fail", () => {
    setAdvertisingConsent("granted");
    expect(getMetaAttribution()).toBeUndefined();
  });

  it("removes accessible legacy Meta identifiers before a choice", () => {
    document.cookie = "_fbp=legacy-browser-id; Path=/";
    document.cookie = "_fbc=legacy-click-id; Path=/";

    revokeMetaPixel();

    expect(document.cookie).not.toContain("_fbp=");
    expect(document.cookie).not.toContain("_fbc=");
  });
});
