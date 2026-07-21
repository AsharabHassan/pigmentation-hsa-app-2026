import type { MetaTracking } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Meta (Facebook) Pixel — Harley Street Aesthetics.
// The ID is hard-coded on purpose: this app ships to a single clinic property,
// so the pixel must fire identically in dev, preview and production without
// depending on env wiring. An env override is still honoured if one is set.
//
// Every conversion also travels to the CRM (GoHighLevel) carrying the SAME
// event id the browser pixel used. That is what lets Meta deduplicate the
// browser event against the CRM's server-side (Conversions API) copy instead of
// double-counting it — dedup is keyed on event_name + event_id.
// ─────────────────────────────────────────────────────────────────────────────

export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "823507040655170";

type FbqFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
  }
}

/** Unique id shared by the browser event and its server-side twin. */
export function newEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Older Safari / insecure origins: good enough for a dedup key.
  return `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function readFbclid(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("fbclid");
}

/**
 * Meta's click/browser identifiers. `_fbp` and `_fbc` are set by the pixel
 * itself; when an ad click lands before the pixel has written `_fbc` we
 * synthesize it from the `fbclid` query param in Meta's documented format
 * (`fb.<subdomainIndex>.<timestamp>.<fbclid>`), so attribution isn't lost.
 */
export function getMetaAttribution() {
  const fbclid = readFbclid();
  const fbc = readCookie("_fbc") ?? (fbclid ? `fb.1.${Date.now()}.${fbclid}` : null);
  return {
    fbp: readCookie("_fbp"),
    fbc,
    fbclid,
    eventSourceUrl:
      typeof window === "undefined" ? null : window.location.href,
  };
}

/**
 * Mint the tracking envelope for one conversion: the pixel id, a fresh event
 * id, and the click identifiers. Pass the same object to `trackPixel` and to
 * the CRM webhook so both sides describe one event, not two.
 */
export function createMetaEvent(eventName: string): MetaTracking {
  return {
    pixelId: META_PIXEL_ID,
    eventName,
    eventId: newEventId(),
    eventTime: Math.floor(Date.now() / 1000),
    actionSource: "website",
    ...getMetaAttribution(),
  };
}

/** Fire a standard Meta event (Lead, CompleteRegistration, Schedule, …). */
export function trackPixel(
  event: string,
  params?: Record<string, unknown>,
  eventId?: string,
) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (eventId) window.fbq("track", event, params, { eventID: eventId });
  else window.fbq("track", event, params);
}

/** Fire a custom (non-standard) Meta event. */
export function trackPixelCustom(
  event: string,
  params?: Record<string, unknown>,
  eventId?: string,
) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (eventId) window.fbq("trackCustom", event, params, { eventID: eventId });
  else window.fbq("trackCustom", event, params);
}
