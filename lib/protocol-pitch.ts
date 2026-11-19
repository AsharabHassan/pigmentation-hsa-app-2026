// ─────────────────────────────────────────────────────────────────────────────
// The recommendation that sells the Signature Pigmentation Treatment: the
// clinic's 3R Programme (Reduce, Regulate, Reverse).
// Fixed, clinic-authored copy (Claude never writes it), so it can be reviewed in
// one place. Wording is deliberately comparative-but-defensible for UK
// advertising rules: "recommended by our doctors" and "why it goes further than
// a single treatment", never an unqualified "the best".
// House style: repair, don't damage. Never name a product or brand, never call
// our treatment a "peel", never say it brightens or lightens, and never claim
// "no needles" or "painless" (the Regulate step uses microscopic spicules).
// ─────────────────────────────────────────────────────────────────────────────

import type { Bucket } from "./types";
import type { SpotTypeKey } from "./spot-types";

export const TREATMENT_NAME = "Signature Pigmentation Treatment";
/** How the clinic positions it everywhere a visitor first meets it. */
export const TREATMENT_TAGLINE = "The 3R Programme: repair, don't damage";

/** One single-treatment alternative and how the 3R Programme goes further. */
export interface Comparison {
  alternative: string;
  limitation: string;
  ours: string;
}

export interface ProtocolPitch {
  /** e.g. "Recommended by our doctors for melasma". */
  subtitle: string;
  /** Why the 3R Programme suits this pigmentation. */
  lead: string;
  comparisons: [Comparison, Comparison, Comparison];
}

export const PITCH: Record<SpotTypeKey, ProtocolPitch> = {
  melasma: {
    subtitle: "Recommended by our doctors for melasma",
    lead: "Melasma comes from overactive pigment cells and flares with heat and irritation. It needs a treatment that repairs the skin and calms pigment production, not one that attacks the surface. That is how our 3R Programme is built.",
    comparisons: [
      {
        alternative: "Creams alone",
        limitation: "work on the surface but rarely calm the overactive pigment cells, so results tend to plateau.",
        ours: "Reduce lifts the pigment you can see. Regulate works on the cells that make it.",
      },
      {
        alternative: "Laser alone",
        limitation: "can overheat melasma and cause it to rebound darker.",
        ours: "Our programme repairs the skin. It does not use laser heat.",
      },
      {
        alternative: "Harsh resurfacing",
        limitation: "can irritate the skin, and irritation darkens melasma.",
        ours: "Healing ingredients, including a colostrum-based complex, calm and repair the skin as we treat.",
      },
    ],
  },
  solar_lentigines: {
    subtitle: "Recommended by our doctors for sun spots",
    lead: "Sun spots respond best when the spot and the sun-affected skin around it are treated together. Our 3R Programme lifts the pigment and works on the process that makes it.",
    comparisons: [
      {
        alternative: "Creams alone",
        limitation: "fade slowly and rarely clear a clearly defined sun spot.",
        ours: "The Reduce step lifts surface pigment across each spot.",
      },
      {
        alternative: "Laser alone",
        limitation: "targets the spot but leaves the sun-damaged skin around it unchanged.",
        ours: "Topical repair therapy treats the whole area and helps the skin heal.",
      },
      {
        alternative: "One-off treatments",
        limitation: "can help for a while, but defined spots usually remain.",
        ours: "A course of sessions reduces the pigment and helps regulate how it is made.",
      },
    ],
  },
  pih: {
    subtitle: "Recommended by our doctors for post-blemish marks",
    lead: "Marks left after blemishes come from inflammation. The priority is to clear them without triggering new ones. Repair, don't damage: that is how our 3R Programme works.",
    comparisons: [
      {
        alternative: "Creams alone",
        limitation: "work slowly. Marks can take many months to fade.",
        ours: "Reduce lifts surface pigment while the skin heals, session by session.",
      },
      {
        alternative: "Strong lasers or harsh resurfacing",
        limitation: "can inflame the skin and create new marks, especially in deeper skin tones.",
        ours: "Our programme is built to repair the skin, not to add more damage.",
      },
      {
        alternative: "Treating marks only",
        limitation: "leaves the process that makes excess pigment untouched.",
        ours: "Regulate helps bring pigment production back towards normal, at the layer where pigment cells sit.",
      },
    ],
  },
  ephelides: {
    subtitle: "Recommended by our doctors for freckles",
    lead: "Freckle pigment sits in the top layers of the skin, where our Reduce step works. Freckles fade while the tone around them becomes more even.",
    comparisons: [
      {
        alternative: "Creams alone",
        limitation: "barely touch freckles.",
        ours: "The Reduce step works right where freckle pigment sits.",
      },
      {
        alternative: "Cover-up",
        limitation: "hides freckles for the day but does nothing to the pigment.",
        ours: "Our programme works on the pigment itself, so you may need less coverage over time.",
      },
      {
        alternative: "Laser alone",
        limitation: "targets freckles but not the overall evenness of your skin.",
        ours: "Topical repair therapy treats the whole area for a clearer, more even look.",
      },
    ],
  },
  periorbital: {
    subtitle: "Recommended by our doctors for dark circles",
    lead: "Under-eye darkness sits in the thinnest, most sensitive skin on the face. It needs a gentle, repair-first approach that reduces the pigment while supporting the skin. That is how our 3R Programme starts.",
    comparisons: [
      {
        alternative: "Eye creams alone",
        limitation: "barely reach the pigment in the under-eye skin, so dark circles tend to stay.",
        ours: "The Reduce step works on the pigmented skin itself, supported by your home routine.",
      },
      {
        alternative: "Concealer",
        limitation: "hides the shadow for the day but does nothing to the pigment underneath.",
        ours: "Our programme reduces the pigment itself, so you may need less coverage over time.",
      },
      {
        alternative: "Fillers alone",
        limitation: "can soften hollowness but don't treat brown pigment.",
        ours: "We target the pigment. Your practitioner advises if hollowness or visible vessels need separate care.",
      },
    ],
  },
  photodamage: {
    subtitle: "Recommended by our doctors for sun-related uneven tone",
    lead: "Mottled, uneven tone comes from sun damage spread across the skin. It needs whole-area repair, not just treatment of individual marks.",
    comparisons: [
      {
        alternative: "Creams alone",
        limitation: "work on the surface, but don't repair sun-damaged skin.",
        ours: "Healing ingredients support healthy, repaired skin across the whole area.",
      },
      {
        alternative: "Laser alone",
        limitation: "targets pigment but does nothing to regulate how it is made.",
        ours: "Reduce and Regulate work on the pigment and on the process behind it.",
      },
      {
        alternative: "One-off facials",
        limitation: "refresh the surface for a few days.",
        ours: "A structured course builds results session by session.",
      },
    ],
  },
};

/** Used when the photo didn't settle on one pigmentation type. */
export const GENERIC_PITCH: ProtocolPitch = {
  subtitle: "Recommended by our doctors for your skin",
  lead: "Your skin is already damaged. It needs repairing, not more damage. Our 3R Programme reduces the pigment you can see, then helps regulate how pigment is made. It works from the surface to the cell.",
  comparisons: [
    {
      alternative: "Creams alone",
      limitation: "work on the surface and tend to plateau.",
      ours: "Regulate works deeper, at the layer where pigment cells sit.",
    },
    {
      alternative: "Laser alone",
      limitation: "shatters pigment with heat, which can trigger rebound pigmentation in some skin.",
      ours: "Our programme repairs the skin. It does not use laser heat.",
    },
    {
      alternative: "One-off treatments",
      limitation: "refresh the skin briefly.",
      ours: "A course of sessions, usually 4, two weeks apart, builds results step by step.",
    },
  ],
};

/** What sets the clinic apart, shown with every recommendation. */
export const WHY_HSA = [
  "Doctor-led clinic on Harley Street, London and in Glasgow",
  "The 3R Programme: Reduce, Regulate, Reverse",
  "Built to repair the skin, and designed to suit all skin tones",
  "Free online consultation, with no pressure to book",
] as const;

/** Only clear candidates get the hard recommendation; others keep the gentle path. */
export function shouldRecommend(bucket: Bucket): boolean {
  return bucket === "great" || bucket === "good";
}

export function pitchFor(spotType: SpotTypeKey | null | undefined): ProtocolPitch {
  return spotType ? PITCH[spotType] : GENERIC_PITCH;
}
