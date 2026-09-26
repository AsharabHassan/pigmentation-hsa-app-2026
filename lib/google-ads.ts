import { getAdvertisingConsent, isExactProductionHost } from "./meta-consent";

// Verified in Harley Street Medics (992-175-4464), 19 September 2026.
export const GOOGLE_ADS_ID = "AW-16798047021";
export const GTM_CONTAINER_ID = "GTM-59FKRRXV";
export const GOOGLE_LEAD_DESTINATION = `${GOOGLE_ADS_ID}/yzi6CI6f4_0cEK2298k-`;
type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    __hsaGoogleConfigured?: boolean;
    __hsaTagManagerStarted?: boolean;
    __hsaGoogleLeadIds?: Set<string>;
  }
}

export function hasGoogleAdsConsent(): boolean {
  return getAdvertisingConsent() === "granted" && isExactProductionHost();
}

/** Never pass form fields, assessment details or arbitrary query strings. */
export function googleMeasurementUrl(href: string): string {
  const url = new URL(href);
  const safe = new URL(url.origin + url.pathname);
  for (const key of ["gclid", "gbraid", "wbraid"]) {
    const value = url.searchParams.get(key);
    if (value && /^[A-Za-z0-9._~-]{1,512}$/.test(value)) {
      safe.searchParams.set(key, value);
    }
  }
  return safe.toString();
}

export function initializeGoogleAds(): void {
  if (typeof window === "undefined" || !hasGoogleAdsConsent()) return;
  window.dataLayer ??= [];
  window.gtag ??= function () {
    // gtag's queue contract is an Arguments object, not a spread array.
    // eslint-disable-next-line prefer-rest-params -- Preserve Google's documented gtag queue shape.
    window.dataLayer!.push(arguments);
  };
  if (!window.__hsaGoogleConfigured) {
    window.gtag("consent", "default", {
      ad_storage: "denied", analytics_storage: "denied",
      ad_user_data: "denied", ad_personalization: "denied",
    });
    window.gtag("set", "ads_data_redaction", true);
    window.gtag("js", new Date());
    window.gtag("config", GOOGLE_ADS_ID, {
      send_page_view: false,
      allow_enhanced_conversions: false,
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      page_location: googleMeasurementUrl(window.location.href),
      page_referrer: "",
    });
    window.__hsaGoogleConfigured = true;
  }
  window.gtag("consent", "update", {
    ad_storage: "granted", analytics_storage: "denied",
    ad_user_data: "denied", ad_personalization: "denied",
  });
}

/** Consent defaults are queued first so the container's tags start from "denied". */
export function initializeTagManager(): void {
  if (typeof window === "undefined" || !hasGoogleAdsConsent()) return;
  initializeGoogleAds();
  if (window.__hsaTagManagerStarted) return;
  window.__hsaTagManagerStarted = true;
  window.dataLayer!.push({ "gtm.start": Date.now(), event: "gtm.js" });
}

export function revokeGoogleAds(): void {
  if (typeof window === "undefined") return;
  window.gtag?.("consent", "update", {
    ad_storage: "denied", analytics_storage: "denied",
    ad_user_data: "denied", ad_personalization: "denied",
  });
  for (const name of document.cookie.split(";").map(c => c.trim().split("=")[0])) {
    if (!name.startsWith("_gcl_")) continue;
    for (const domain of ["", "pigmentation.harleystreetaesthetic.co.uk", "harleystreetaesthetic.co.uk"]) {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? `; Domain=${domain}` : ""}`;
    }
  }
}

/** Called only after the server confirms CRM delivery; one event per submission. */
export function trackCompletedGoogleLead(transactionId: string): void {
  if (typeof window === "undefined" || !hasGoogleAdsConsent()) return;
  initializeGoogleAds();
  window.__hsaGoogleLeadIds ??= new Set();
  if (window.__hsaGoogleLeadIds.has(transactionId)) return;
  window.__hsaGoogleLeadIds.add(transactionId);
  window.gtag?.("event", "conversion", {
    send_to: GOOGLE_LEAD_DESTINATION,
    transaction_id: transactionId,
    value: 0,
    currency: "GBP",
    page_location: googleMeasurementUrl(window.location.href),
    page_referrer: "",
  });
}
