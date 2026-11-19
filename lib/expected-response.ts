// ─────────────────────────────────────────────────────────────────────────────
// How much each kind of pigmentation is EXPECTED to fade over a first course
// (usually 4 sessions, two weeks apart): the target the "see the difference"
// preview is calibrated to, so it shows an expected result, not a perfect one.
//
// NOTE (3R Programme, Nov 2026): these values were drafted for the previous
// "after 2-3 sessions" framing and have NOT been re-calibrated for a course of
// 4. They are deliberately unchanged until the clinic signs off new figures.
//
// TODO(HSA clinician sign-off): these are Claude-drafted starting values from
// typical response patterns (freckles/sun spots clear fastest, melasma slowest).
// Replace with figures the clinic signs off, and later with measurements from
// consented session-1 vs session-3 photos.
// ─────────────────────────────────────────────────────────────────────────────

import type { SpotTypeKey } from "@/lib/spot-types";

/** Fraction of visible pigment contrast expected to fade (0–1). */
export const EXPECTED_REDUCTION: Record<SpotTypeKey, number> = {
  ephelides: 0.55,
  solar_lentigines: 0.55,
  pih: 0.45,
  photodamage: 0.45,
  melasma: 0.35,
  periorbital: 0.3,
};

/** When the photo didn't settle on one type. */
export const GENERIC_REDUCTION = 0.4;

/**
 * Target for one zone: the type's expected fade, eased down for heavier zones
 * (more pigment means more is still left after a first course).
 */
export function expectedReduction(
  spotType: SpotTypeKey | null | undefined,
  zoneSeverity: number | undefined,
): number {
  const base = spotType ? EXPECTED_REDUCTION[spotType] : GENERIC_REDUCTION;
  const sev = Math.min(100, Math.max(0, zoneSeverity ?? 50));
  return Math.round(base * (1 - 0.25 * (sev / 100)) * 100) / 100;
}
