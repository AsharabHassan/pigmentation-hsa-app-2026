import type { ClinicLocationKey } from "./types";
import type { InsightEventType, VisitContext } from "./insights";

// Browser side of the insights database. First-party only: campaign tags are
// read from the landing URL, nothing is stored in cookies or localStorage, and
// no ad-platform identifier (fbclid, _fbp, _fbc) is ever sent here.

export function getVisitContext(clinicLocation: ClinicLocationKey): VisitContext {
  if (typeof window === "undefined") {
    return { clinicLocation, fromMetaAd: false, fromGoogleAd: false };
  }
  const params = new URLSearchParams(window.location.search);
  const tag = (name: string) => params.get(name)?.trim().slice(0, 200) || null;
  const utmSource = tag("utm_source");
  let referrerHost: string | null = null;
  try {
    const host = document.referrer ? new URL(document.referrer).hostname : "";
    referrerHost = host && host !== window.location.hostname ? host : null;
  } catch {
    referrerHost = null;
  }
  return {
    clinicLocation,
    utmSource,
    utmMedium: tag("utm_medium"),
    utmCampaign: tag("utm_campaign"),
    utmContent: tag("utm_content"),
    utmTerm: tag("utm_term"),
    fromMetaAd:
      params.has("fbclid") ||
      /^(fb|facebook|ig|instagram|meta)$/i.test(utmSource ?? ""),
    fromGoogleAd:
      params.has("gclid") ||
      params.has("gbraid") ||
      params.has("wbraid") ||
      /^(google|adwords)$/i.test(utmSource ?? ""),
    // An ads landing page hands its id on as ?lp=, so the visit is credited to
    // the page that won the click rather than to the analyzer route.
    landingPath: (tag("lp") ?? window.location.pathname).slice(0, 200),
    referrerHost,
  };
}

/** Fire-and-forget result-page beacon. Never throws, never blocks. */
export function trackInsight(
  analysisId: string | undefined,
  type: InsightEventType,
  detail?: string,
): void {
  if (!analysisId || typeof window === "undefined") return;
  try {
    void fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysisId, type, detail: detail ?? null }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* ignore */
  }
}
