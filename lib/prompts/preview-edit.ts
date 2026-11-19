// ─────────────────────────────────────────────────────────────────────────────
// The edit instruction for the AI "after" preview (OpenAI GPT-Image-2.5).
// The model may ONLY lighten the client's own brown pigmentation, by the amount
// expected for their pigmentation type after a first course of sessions — never beautify,
// smooth, re-shape or change identity. The client then checks the edit against
// the original (lib/ai-preview.ts) and falls back to the on-device preview if it
// drifted. (A colour-based pigment-reduction gate was tried and dropped: on
// dense freckles it ranked a near-erased edit as milder than a half fade.)
// ─────────────────────────────────────────────────────────────────────────────

import type { SpotTypeKey } from "@/lib/spot-types";
import { expectedReduction } from "@/lib/expected-response";

const TYPE_FOCUS: Record<SpotTypeKey, string> = {
  melasma:
    "the soft-edged brown or grey-brown melasma patches (typically across the cheeks, forehead, nose bridge and upper lip)",
  solar_lentigines: "the flat, clearly defined brown sun spots",
  pih: "the flat brown marks left behind after blemishes",
  ephelides: "the small light-brown freckles",
  photodamage: "the mottled, patchy brown unevenness from sun exposure",
  periorbital: "the brown under-eye pigmentation (not shadows from hollows, and not blood vessels)",
};

const ZONE_NAMES: Record<string, string> = {
  forehead: "forehead",
  undereye: "under-eye area",
  nose: "nose",
  cheeks: "cheeks",
  upperlip: "upper lip",
  jawline: "jawline",
};

/** Plain-words strength for the model, from the expected reduction. */
function strengthWords(reduction: number): string {
  if (reduction >= 0.45) return "roughly half as visible as now";
  if (reduction >= 0.36) return "noticeably lighter — about 40% less visible than now";
  return "gently softened — about a third less visible than now";
}

export function buildPreviewPrompt(
  spotType: SpotTypeKey | null | undefined,
  zones: string[],
): string {
  const focus = spotType
    ? TYPE_FOCUS[spotType]
    : "the visible brown pigmentation, dark spots and patchy uneven tone";
  const where = zones
    .map((z) => ZONE_NAMES[z])
    .filter(Boolean)
    .join(", ");
  const strength = strengthWords(expectedReduction(spotType, 50));

  return [
    "Edit this real clinical selfie to show a realistic, honest result after a first course of professional pigmentation treatment.",
    `Change ONLY ${focus}${where ? `, mainly on the ${where}` : ""}: make that brown pigmentation lighter and softer against the person's own surrounding skin — ${strength}. It must still be clearly present: every mark stays where it is, just paler and less defined. Do not erase or remove any of it.`,
    "Keep everything else exactly the same, as if it were the same photograph: the same person and identity, face shape, bone structure, age, expression, eyes, eyebrows, eyelashes, lips, teeth, nose, ears, hair, facial hair, makeup, glasses, jewellery, clothing, background, pose, framing, camera angle, lighting, shadows, white balance, focus and image grain.",
    "Keep the natural skin texture: pores, fine lines, wrinkles, moles, scars and redness stay exactly as they are.",
    "Do NOT smooth, airbrush, retouch, whiten, brighten, tan or even out the overall skin tone, do not slim or beautify the face, and do not add makeup.",
    "Output a photorealistic image with the same composition and aspect ratio as the input.",
  ].join("\n");
}
