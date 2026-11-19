// ─────────────────────────────────────────────────────────────────────────────
// The kinds of facial pigmentation the report can name, and how each step of
// the Signature Pigmentation Treatment (the 3R Programme) addresses that kind.
//
// Claude only ever PICKS a key from this list — it never writes this copy. Every
// word a visitor reads about their pigmentation type is fixed, clinic-authored
// text, so it can be reviewed and signed off by a practitioner in one place.
// ─────────────────────────────────────────────────────────────────────────────

export const SPOT_TYPE_KEYS = [
  "melasma",
  "solar_lentigines",
  "pih",
  "ephelides",
  "photodamage",
  "periorbital",
] as const;

export type SpotTypeKey = (typeof SPOT_TYPE_KEYS)[number];

export function isSpotTypeKey(value: unknown): value is SpotTypeKey {
  return (SPOT_TYPE_KEYS as readonly unknown[]).includes(value);
}

/** One protocol step, explained for one pigmentation type. */
export interface SpotTypeStep {
  /** How the step is used for this type. */
  how: string;
  /** Why that works for this type. */
  why: string;
}

export interface SpotTypeInfo {
  key: SpotTypeKey;
  /** Medical name. */
  name: string;
  /** Everyday name, shown alongside the medical one. */
  commonName: string;
  /** What it looks like and what it is. */
  what: string;
  /** What typically causes it. */
  cause: string;
  /** Per-step plan, in PROTOCOL_STEPS order: Reduce, Regulate, Reverse (optional). */
  steps: [SpotTypeStep, SpotTypeStep, SpotTypeStep];
  /** Honest expectation-setting and aftercare specific to this type. */
  outlook: string;
}

/** Reverse is optional and advanced, so its wording is the same for every type. */
const REVERSE_STEP: SpotTypeStep = {
  how: "An optional, advanced regenerative step for those who want to go further.",
  why: "Your consultant can discuss it with you later. Most people choose the first two steps, Reduce and Regulate.",
};

export const SPOT_TYPES: Record<SpotTypeKey, SpotTypeInfo> = {
  melasma: {
    key: "melasma",
    name: "Melasma",
    commonName: "hormonal pigmentation",
    what: "Soft-edged brown or grey-brown patches that tend to appear symmetrically — most often across the cheeks, forehead, bridge of the nose and upper lip.",
    cause:
      "Pigment-producing cells that have become overactive, typically driven by hormones (pregnancy, contraception, HRT), sunlight and heat.",
    steps: [
      {
        how: "Topical repair therapy with healing ingredients, including a colostrum-based complex, is applied to the skin.",
        why: "Melasma is easily provoked by heat and irritation. A repair-first start lifts surface pigment while keeping the skin calm.",
      },
      {
        how: "Microscopic spicules carry pigment-regulating ingredients to the junction between the two top layers of your skin, where your pigment cells sit.",
        why: "Melasma comes from overactive pigment cells. This step helps bring pigment production back towards normal. It also helps strengthen that layer, so less pigment leaks deeper.",
      },
      REVERSE_STEP,
    ],
    outlook:
      "Melasma can be controlled, but it can return with sun, heat or hormonal change. Daily SPF 50 and maintenance are part of the plan, and your practitioner will set honest expectations.",
  },
  solar_lentigines: {
    key: "solar_lentigines",
    name: "Solar lentigo",
    commonName: "sun spots or age spots",
    what: "Flat, clearly defined brown spots on the areas that see the most sun — typically the cheeks, temples, forehead and nose.",
    cause:
      "Years of accumulated sun exposure, which causes pigment to collect in fixed, well-defined spots.",
    steps: [
      {
        how: "Topical repair therapy is applied across each spot and the sun-affected skin around it.",
        why: "The pigment in a sun spot is concentrated near the surface. This step lifts surface pigment while healing ingredients help repair skin that years of sun have changed.",
      },
      {
        how: "Microscopic spicules carry pigment-regulating ingredients to the junction where your pigment cells sit.",
        why: "It helps calm the overactive pigment production behind the spots. A stronger junction also helps stop pigment settling deeper. It is pushed up instead, where the Reduce step can lift it.",
      },
      REVERSE_STEP,
    ],
    outlook:
      "Sun spots are among the most responsive types of pigmentation. New ones can form with further sun exposure, so daily SPF protects your result.",
  },
  pih: {
    key: "pih",
    name: "Post-inflammatory hyperpigmentation",
    commonName: "marks left behind after blemishes or irritation",
    what: "Flat brown, tan or darker marks sitting where a breakout, irritation or injury has healed — often across the cheeks, jawline and around the mouth.",
    cause:
      "The skin's response to inflammation: as a blemish or injury heals, it leaves excess pigment behind. It is more common and longer-lasting in deeper skin tones.",
    steps: [
      {
        how: "Topical repair therapy with healing ingredients starts the programme gently.",
        why: "These marks are caused by inflammation, so the priority is to treat without provoking more. That is why we repair the skin and do not add more damage.",
      },
      {
        how: "Microscopic spicules carry pigment-regulating ingredients to the junction where your pigment cells sit.",
        why: "Pigment can leak into the deeper skin, which is why some marks linger. This step helps regulate pigment production and strengthen that layer, so pigment is pushed up instead.",
      },
      REVERSE_STEP,
    ],
    outlook:
      "These marks respond well but fade gradually over a course of sessions. Keeping any active breakouts under control is part of the plan, as new inflammation can create new marks.",
  },
  ephelides: {
    key: "ephelides",
    name: "Ephelides",
    commonName: "freckles",
    what: "Small, light-brown flecks scattered across the nose and cheeks, which deepen in summer and fade in winter.",
    cause:
      "An inherited tendency for the skin to produce pigment in small clusters in response to sunlight.",
    steps: [
      {
        how: "Topical repair therapy is applied across the freckled areas.",
        why: "Freckle pigment sits in the top layers of the skin. That is where this step works. It lifts surface pigment so freckles fade as the skin repairs.",
      },
      {
        how: "Microscopic spicules carry pigment-regulating ingredients to the junction where your pigment cells sit.",
        why: "Freckles come from pigment cells that react strongly to sunlight. This step helps bring that pigment production back towards normal levels.",
      },
      REVERSE_STEP,
    ],
    outlook:
      "Freckles respond well, but the tendency is inherited, so they can return with sun exposure. Consistent SPF is what keeps the result.",
  },
  photodamage: {
    key: "photodamage",
    name: "Solar dyschromia",
    commonName: "mottled, uneven tone from sun exposure",
    what: "A diffuse, mottled unevenness — a mix of slightly darker and lighter areas rather than distinct individual spots — often with a generally dull tone.",
    cause:
      "Cumulative sun exposure affecting pigment distribution across wider areas of skin, rather than in single spots.",
    steps: [
      {
        how: "Topical repair therapy treats the whole affected area from the first session.",
        why: "The unevenness is spread across the skin, not in single spots. Whole-area repair lifts surface pigment and supports healthier skin.",
      },
      {
        how: "Microscopic spicules carry pigment-regulating ingredients to the junction where your pigment cells sit.",
        why: "Sun damage can weaken the junction where pigment cells sit. This step helps regulate pigment production and strengthen that layer, so the tone stays more even.",
      },
      REVERSE_STEP,
    ],
    outlook:
      "Tone and clarity improve progressively across a course of sessions. Daily SPF prevents the same damage building up again.",
  },
  periorbital: {
    key: "periorbital",
    name: "Periorbital hyperpigmentation",
    commonName: "dark circles or under-eye pigmentation",
    what: "Brown or grey-brown darkening of the skin beneath the eyes, sometimes extending onto the upper lids, that stays visible even when you are well rested.",
    cause:
      "Extra pigment in the thin under-eye skin — often inherited and more common in deeper skin tones — made more visible by rubbing, allergies, sun exposure and the natural thinning of this skin with age.",
    steps: [
      {
        how: "Topical repair therapy is applied gently around the eye area, where your practitioner judges it suitable.",
        why: "The under-eye skin is the thinnest on the face. A repair-first approach is a gentle way to start reducing the pigment there.",
      },
      {
        how: "The Regulate step is used with particular care near the eyes, and only where your practitioner confirms it is suitable.",
        why: "It helps regulate pigment production in this delicate skin and supports the layer where pigment cells sit.",
      },
      REVERSE_STEP,
    ],
    outlook:
      "Under-eye pigmentation improves steadily over a course of sessions. Daily SPF, avoiding rubbing, and treating any allergies help keep the result. Your practitioner will also check whether hollowness or visible blood vessels are adding to the shadow.",
  },
};

/** "Melasma (hormonal pigmentation)" */
export function spotTypeTitle(key: SpotTypeKey): string {
  const t = SPOT_TYPES[key];
  return `${t.name} (${t.commonName})`;
}

/** Shown at the end of the on-screen result and the PDF report. */
export const REPORT_DISCLAIMER =
  "This analysis is for informational purposes only and is not a diagnosis. For a diagnosis, book your free online consultation.";
