// ─────────────────────────────────────────────────────────────────────────────
// Domain model for the Pigmentation Analyzer. Claude Vision chooses the
// suitability outcome and writes the narrative; all zone geometry stays
// on-device (MediaPipe) — the model only ever returns zone-level figures.
// ─────────────────────────────────────────────────────────────────────────────

/** The four suitability outcomes. Never a flat "you don't qualify". */
export type Bucket = "great" | "good" | "consultation" | "alternative";

/** Facial zones the pigmentation map can crop and score. */
export type ZoneKey =
  | "forehead"
  | "undereye"
  | "nose"
  | "cheeks"
  | "upperlip"
  | "jawline";

/** Machine-readable reason a hard flag fired (carried for GHL payload shape). */
export type HardFlag = string;

/** Deterministic routing fields kept for the GHL payload / result envelope. */
export interface ScoreResult {
  bucket: Bucket;
  /** 0–100 normalized suitability score (presentational). */
  score: number;
  hardFlags: HardFlag[];
  /** True when a soft flag forced a consultation routing. */
  softFlagged: boolean;
  /** Short, human-readable reason for the routing (used as a fallback narrative seed). */
  routedReason: string;
}

/** The narrative portion Claude authors. */
export interface ClaudeNarrative {
  headline: string;
  /** 2–3 short sentences, personalized-but-careful, cosmetic not diagnostic. */
  narrative: string;
  /** Zones Claude observed/affirmed, phrased in general terms. */
  observedAreas: string[];
  encouragement: string;
}

/** The full result returned by /api/analyze and rendered on the result screen. */
export interface AnalyzeResult extends ScoreResult {
  narrative: ClaudeNarrative;
  /** Whether the narrative came from Claude or the deterministic fallback. */
  narrativeSource: "claude" | "fallback";
  /** True when a photo was analyzed. */
  usedPhoto: boolean;
  /** Zones that could not be read (beard, fringe/hair, glasses, heavy shadow). */
  zonesObscured: ZoneKey[];
  /** True when makeup appears to be evening out the skin — the read is limited. */
  makeupDetected: boolean;
  /** Per-zone pigmentation prominence (0–100), keyed by ZoneKey. */
  zoneSeverity: Record<string, number>;
  /** Indicative per-zone improvement potential (0–100), keyed by ZoneKey. */
  zoneImprovement: Record<string, number>;
  /** False when the whole face isn't clearly visible and evenly lit — prompt a retake. */
  framingAdequate: boolean;
}

/** Lead captured at the gate. */
export interface Lead {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** Separate PECR marketing consent. */
  marketingConsent: boolean;
}

/** Request body for POST /api/analyze. */
export interface AnalyzeRequest {
  imageBase64: string | null;
  imageMediaType?: "image/jpeg" | "image/png" | "image/webp";
  /** Explicit consent to process the face image. Required when imageBase64 present. */
  imageConsent: boolean;
}

/** Claude's raw assessment of the photo: a cosmetic suitability read + narrative. */
export interface PhotoAssessment {
  /** The suitability outcome Claude chose, mapped to a Bucket server-side. */
  suitability: Bucket;
  /** Claude's 0–100 suitability score for this face; clamped to the bucket band. */
  score: number;
  narrative: ClaudeNarrative;
  /** Zones that could not be read (beard, fringe/hair, glasses, heavy shadow). */
  zonesObscured: ZoneKey[];
  /** True when makeup appears to be evening out the skin — the read is limited. */
  makeupDetected: boolean;
  /** Per-zone pigmentation prominence (0–100), keyed by ZoneKey. */
  zoneSeverity: Record<string, number>;
  /** Indicative per-zone improvement potential (0–100), keyed by ZoneKey. */
  zoneImprovement: Record<string, number>;
  /** False when the whole face isn't clearly visible and evenly lit — prompt a retake. */
  framingAdequate: boolean;
}

/**
 * Meta conversion identifiers for one event, minted in the browser and
 * forwarded to the CRM so the server-side copy can be deduplicated against the
 * pixel's. `clientUserAgent` / `clientIpAddress` are filled in server-side from
 * the request headers — the browser can't read its own IP.
 */
export interface MetaTracking {
  pixelId: string;
  eventName: string;
  eventId: string;
  /** Unix seconds — Meta rejects events older than 7 days. */
  eventTime: number;
  actionSource: "website";
  /** Meta browser id cookie (`_fbp`). */
  fbp: string | null;
  /** Meta click id cookie (`_fbc`), synthesized from `fbclid` when absent. */
  fbc: string | null;
  fbclid: string | null;
  eventSourceUrl: string | null;
  clientUserAgent?: string | null;
  clientIpAddress?: string | null;
}

/** Request body for POST /api/lead. */
export interface LeadRequest {
  lead: Lead;
  result: AnalyzeResult;
  /** Meta conversion envelope for the `Lead` event fired alongside this call. */
  meta?: MetaTracking;
}
