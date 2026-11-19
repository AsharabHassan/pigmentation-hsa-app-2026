// ─────────────────────────────────────────────────────────────────────────────
// Domain model for the Pigmentation Analyzer. Claude Vision chooses the
// suitability outcome and writes the narrative; all zone geometry stays
// on-device (MediaPipe) — the model only ever returns zone-level figures.
// ─────────────────────────────────────────────────────────────────────────────

import type { SpotTypeKey } from "./spot-types";
export type { SpotTypeKey } from "./spot-types";

/** The four suitability outcomes. Never a flat "you don't qualify". */
export type Bucket = "great" | "good" | "consultation" | "alternative";

/** Landing clinic selected by the campaign route. */
export type ClinicLocationKey = "london" | "glasgow";

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
  /** The kind of pigmentation the photo appears most consistent with; null when unclear. */
  spotType?: SpotTypeKey | null;
  /** A second kind, only when the photo clearly shows a mix. */
  secondarySpotType?: SpotTypeKey | null;
  /** Insights-database id for this analysis; ties the lead, clicks and booking to it. */
  analysisId?: string;
}

/** Lead captured at the gate. */
export interface Lead {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

/** Request body for POST /api/analyze. */
export interface AnalyzeRequest {
  imageBase64: string | null;
  imageMediaType?: "image/jpeg" | "image/png" | "image/webp";
  /** Explicit consent to process the face image. Required when imageBase64 present. */
  imageConsent: boolean;
  /** First-party visit context (clinic route + campaign tags) for the insights database. */
  context?: import("./insights").VisitContext;
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
  spotType: SpotTypeKey | null;
  secondarySpotType: SpotTypeKey | null;
}

/** Browser-readable attribution only. Conversion identity is server-owned. */
export interface ClientMetaAttribution {
  /** Meta browser id cookie (`_fbp`). */
  fbp: string | null;
  /** Meta click id cookie (`_fbc`), synthesized from `fbclid` when absent. */
  fbc: string | null;
  eventSourceUrl: string | null;
}

/** Server-owned, allow-listed Meta conversion fields. */
export interface ServerMetaConversion {
  datasetId: "1849043682301992";
  pixelId: "1849043682301992";
  eventName: "Lead";
  eventId: string;
  /** Unix seconds. */
  eventTime: number;
  actionSource: "website";
  eventSourceUrl: string;
  fbp?: string;
  fbc?: string;
  /** Raw Meta click identifier, derived server-side from a validated `_fbc`. */
  fbclid?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  clientUserAgent?: string;
  clientIpAddress?: string;
}

/** Request body for POST /api/lead. */
export interface LeadRequest {
  lead: Lead;
  result: AnalyzeResult;
  /** Clinic market selected by the landing route; defaults to London server-side. */
  clinicLocation: ClinicLocationKey;
  /** Explicit statement confirmed by the camera/upload action. */
  imageProcessingConsent: boolean;
  /** Client-recorded time of the affirmative camera/upload action. */
  imageProcessingConsentAt: string;
  /** Explicit choice for Meta advertising measurement. */
  metaTrackingConsent: boolean;
  /** The client ticked "I'm requesting a free consultation" before the scan. */
  consultationContactConsent?: true;
  consultationContactConsentAt?: string;
  /** The exact wording they agreed to, kept on the CRM contact as evidence. */
  consultationContactStatement?: string;
  consultationContactConsentVersion?: string;
  preferredCallTime?: "morning" | "afternoon" | "evening";
  /** Optional browser attribution; ignored unless Meta tracking is accepted. */
  attribution?: ClientMetaAttribution;
}
