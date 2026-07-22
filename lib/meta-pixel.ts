import type { ClientMetaAttribution } from "./types";
import {
  hasMetaTrackingConsent,
  isExactProductionHost,
} from "./meta-consent";

const HSA_PIGMENTATION_PIXEL_ID = "1849043682301992";

// This single-clinic app must never fall back to an unrelated data source. A
// stale Vercel value is ignored until it is corrected during deployment.
export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID === HSA_PIGMENTATION_PIXEL_ID
    ? process.env.NEXT_PUBLIC_META_PIXEL_ID
    : HSA_PIGMENTATION_PIXEL_ID;

type FbqFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
    __hsaMetaPixelInitialized?: boolean;
    __hsaMetaPageViewTracked?: boolean;
  }
}
function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/** Return a campaign-safe URL with no query parameters or fragment. */
export function getCanonicalPageUrl(url: string): string | null {
  try {
    const canonical = new URL(url);
    canonical.search = "";
    canonical.hash = "";
    return canonical.toString();
  } catch {
    return null;
  }
}

/**
 * Build the only browser-owned fields accepted by the lead endpoint.
 * No attribution leaves the browser without consent or from a preview host.
 */
export function getMetaAttribution(): ClientMetaAttribution | undefined {
  if (typeof window === "undefined" || !hasMetaTrackingConsent()) {
    return undefined;
  }

  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  const fbc =
    readCookie("_fbc") ??
    (fbclid ? `fb.1.${Date.now()}.${fbclid}` : null);

  return {
    fbp: readCookie("_fbp"),
    fbc,
    eventSourceUrl: getCanonicalPageUrl(window.location.href),
  };
}

/** Queue the one permitted browser event after consent and host checks pass. */
export function initializeMetaPixel(): void {
  if (
    typeof window === "undefined" ||
    typeof window.fbq !== "function" ||
    !hasMetaTrackingConsent() ||
    !isExactProductionHost()
  ) {
    return;
  }

  // Re-grant on every accepted state transition. This is idempotent and is
  // required when a visitor rejects after accepting, then later opts back in.
  window.fbq("consent", "grant");

  if (!window.__hsaMetaPixelInitialized) {
    window.fbq("init", META_PIXEL_ID);
    window.__hsaMetaPixelInitialized = true;
  }

  if (!window.__hsaMetaPageViewTracked) {
    window.fbq("track", "PageView");
    window.__hsaMetaPageViewTracked = true;
  }
}

/** Revoke Meta consent and remove the first-party identifiers we can access. */
export function revokeMetaPixel(): void {
  if (typeof window === "undefined") return;

  if (typeof window.fbq === "function") {
    window.fbq("consent", "revoke");
  }

  if (typeof document !== "undefined") {
    for (const cookie of ["_fbp", "_fbc"]) {
      document.cookie = `${cookie}=; Max-Age=0; Path=/; SameSite=Lax`;

      // Remove legacy domain-scoped identifiers created before consent was
      // introduced. These domains are deliberately explicit for this app;
      // never attempt broad public-suffix deletion.
      for (const domain of [
        "pigmentation.harleystreetaesthetic.co.uk",
        ".pigmentation.harleystreetaesthetic.co.uk",
        "harleystreetaesthetic.co.uk",
        ".harleystreetaesthetic.co.uk",
      ]) {
        document.cookie = `${cookie}=; Max-Age=0; Path=/; Domain=${domain}; SameSite=Lax`;
      }
    }
  }
}
