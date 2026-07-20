// JSON schema for Claude's structured photo assessment. Deliberately simple —
// structured outputs don't support min/max/length constraints, and every object
// needs additionalProperties:false.

const ZONE_ENUM = [
  "forehead",
  "under-eye",
  "nose",
  "cheeks",
  "upper-lip",
  "jawline",
] as const;

export const RESULT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    suitability: {
      type: "string",
      enum: ["strong", "good", "consultation", "alternative"],
      description:
        "The cosmetic suitability outcome. 'strong' = clearly visible, treatable facial pigmentation (dark spots, sun-related marks, patchy or uneven tone) — the ideal candidate; 'good' = milder or subtler unevenness that still responds well; 'consultation' = the photo can't be assessed (too dark, blurry, heavy makeup) or the case is genuinely borderline; 'alternative' = the standout concern is out of scope for a pigmentation protocol (e.g. predominantly raised/textural marks, or predominantly redness rather than brown pigment).",
    },
    pigmentClarity: {
      type: "number",
      description:
        "0–40. How CLEARLY a treatable pigmentation concern is visible — discrete dark spots, sun-related freckling, diffuse darker patches, or marks left after blemishes. Clear, treatable pigmentation scores HIGH — this is exactly who the treatment helps. Score low only when no unevenness is visible at all, or the concern is clearly out of scope. Judge ONLY from this photo, with fine gradations — avoid identical values across different faces.",
    },
    skinQuality: {
      type: "number",
      description:
        "0–30. Apparent skin health and readiness for a radiofrequency and injectable-based protocol (calm, intact skin scores higher; visibly active breakout or irritation lowers it). Judge only from this photo, with fine gradations.",
    },
    toneUniformity: {
      type: "number",
      description:
        "0–30. How much the overall complexion would benefit from tone-evening — visible contrast between darker areas and the surrounding skin scores high; an already even, uniform tone scores low. Judge only from this photo, with fine gradations.",
    },
    zonesObscured: {
      type: "array",
      description:
        "Zones whose skin cannot be reliably read in THIS photo — hidden by beard or facial hair, a fringe or hair over the forehead, glasses over the under-eye area, or harsh shadow. Empty array when every zone is visible. An obscured zone NEVER disqualifies treatment — it only limits what the photo shows.",
      items: { type: "string", enum: ZONE_ENUM },
    },
    makeupDetected: {
      type: "boolean",
      description:
        "True when foundation, concealer or a smoothing filter appears to be evening out the skin tone, so the photo understates any pigmentation. Makeup does NOT disqualify treatment and does not require a retake — it only limits what the photo can show. When coverage is clearly heavy, lean towards 'consultation'.",
    },
    zoneFindings: {
      type: "array",
      description:
        "For each zone whose skin you can ACTUALLY see in THIS photo: severityPercent = how prominent darker pigmentation or uneven tone is in that zone (0–100, fine gradations; near 0 for a perfectly even zone); improvementPercent = an indicative cosmetic improvement potential after the pigmentation protocol — higher where a clear treatable concern is visible (55–80), modest for subtle unevenness (30–50), low where little is needed (20–35). Do NOT include obscured zones. 1–6 items, judged from this face with fine gradations.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          zone: { type: "string", enum: ZONE_ENUM },
          severityPercent: { type: "number" },
          improvementPercent: { type: "number" },
        },
        required: ["zone", "severityPercent", "improvementPercent"],
      },
    },
    framingAdequate: {
      type: "boolean",
      description:
        "True only if the WHOLE face — forehead to jaw, both cheeks — is clearly visible, in focus, and evenly lit well enough to judge skin tone. False if part of the face is cut off, the head is at too steep an angle, the face is too small/far, the photo is too dark or blurry, strong side-lighting throws hard shadows across the face, an obvious colour filter is applied, or it's a screenshot rather than a clean front-facing selfie. Lighting matters: uneven light mimics uneven pigment. When false the person should retake their photo.",
    },
    headline: {
      type: "string",
      description: "A warm, 6–10 word headline for the result screen.",
    },
    narrative: {
      type: "string",
      description:
        "2–3 short sentences, personalized-but-careful, cosmetic not diagnostic. UK English.",
    },
    observedAreas: {
      type: "array",
      items: { type: "string" },
      description:
        "1–3 facial zones referenced in general terms (e.g. 'cheeks', 'forehead', 'upper lip').",
    },
    encouragement: {
      type: "string",
      description:
        "One reassuring sentence inviting a free online consultation, noting that final suitability and safety are confirmed by a practitioner.",
    },
  },
  required: [
    "suitability",
    "pigmentClarity",
    "skinQuality",
    "toneUniformity",
    "zonesObscured",
    "makeupDetected",
    "zoneFindings",
    "framingAdequate",
    "headline",
    "narrative",
    "observedAreas",
    "encouragement",
  ],
} as const;
