import type { Bucket } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Clinic brand + contact constants (Harley Street Aesthetics, London & Glasgow).
// Single source of truth for copy that appears across screens.
// ─────────────────────────────────────────────────────────────────────────────

export interface ClinicLocation {
  city: string;
  lines: string[];
  phone: string;
  phoneHref: string;
}

export const CLINIC = {
  name: "Harley Street Aesthetics",
  shortName: "HSA",
  byline: "London · Glasgow",
  director: "Our Harley Street medical team",
  tagline:
    "London & Glasgow's premier destination for advanced aesthetic medicine",
  // Primary (London flagship) — used wherever a single address is shown.
  addressLines: ["10 Harley Street", "London W1G 9PF"],
  phone: "020 4628 3165",
  phoneHref: "tel:+442046283165",
  whatsapp: "07700 106236",
  whatsappHref: "https://wa.me/447700106236",
  email: "hello@harleystreetaesthetic.co.uk",
  hours: "Mon–Sat · by appointment",
  locations: [
    {
      city: "London",
      lines: ["10 Harley Street", "London W1G 9PF"],
      phone: "020 4628 3165",
      phoneHref: "tel:+442046283165",
    },
    {
      city: "Glasgow",
      lines: ["5th Floor, Ingram House", "227 Ingram Street, Glasgow G1 1DA"],
      phone: "0141 488 8985",
      phoneHref: "tel:+441414888985",
    },
  ] satisfies ClinicLocation[],
} as const;

export const TRUST_MARKERS = [
  "10 Harley Street, London",
  "Doctor-led & medically supervised",
  "Rated excellent by patients",
  "Flexible payment plans",
] as const;

/** Booking + site URLs (overridable via public env at deploy). */
const CONFIGURED_BOOKING_URL =
  process.env.NEXT_PUBLIC_BOOKING_URL ??
  process.env.NEXT_PUBLIC_PHOREST_BOOKING_URL;
const WORKING_BOOKING_URL =
  "https://harleystreetaesthetic.co.uk/london/contact/";

// Protect production from the retired route if a stale Vercel value survives
// one deployment. Other explicitly configured booking providers still work.
export const BOOKING_URL =
  !CONFIGURED_BOOKING_URL ||
  /^https:\/\/harleystreetaesthetic\.co\.uk\/london\/book\/?$/i.test(
    CONFIGURED_BOOKING_URL,
  )
    ? WORKING_BOOKING_URL
    : CONFIGURED_BOOKING_URL;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://pigmentation.harleystreetaesthetic.co.uk";

// ─────────────────────────────────────────────────────────────────────────────
// Per-bucket presentation metadata. Claude chooses the bucket; this drives the
// result screen's headline, tone colour, gauge band and CTA.
// ─────────────────────────────────────────────────────────────────────────────

export interface BucketMeta {
  label: string;
  /** Default headline used by the deterministic fallback narrative. */
  headline: string;
  /** Encouraging sub-line. */
  blurb: string;
  /** Brand token used to theme the verdict (CSS var name without `--color-`). */
  accent: "peach" | "sage";
  ctaLabel: string;
  /** Indicative gauge band centre for this bucket (0–100). */
  gaugeBand: [number, number];
}

export const BUCKET_META: Record<Bucket, BucketMeta> = {
  great: {
    label: "Strong candidate",
    headline: "Your skin shows exactly what this treatment targets",
    blurb:
      "The pigmentation visible in your photo is just the kind our Signature Pigmentation Removal Treatment is designed to fade.",
    accent: "peach",
    ctaLabel: "Book Your Free Online Consultation",
    gaugeBand: [82, 100],
  },
  good: {
    label: "Good candidate",
    headline: "Your skin tone could respond beautifully",
    blurb:
      "Your photo shows the kind of subtle unevenness that responds well to our protocol — a consultation will confirm the detail.",
    accent: "peach",
    ctaLabel: "Book Your Free Online Consultation",
    gaugeBand: [68, 88],
  },
  consultation: {
    label: "Consultation recommended",
    headline: "Let's look at your skin together",
    blurb:
      "Your skin is best reviewed by our Harley Street team before we can be sure of the right plan. That's completely normal.",
    accent: "sage",
    ctaLabel: "Book Your Free Online Consultation",
    gaugeBand: [55, 75],
  },
  alternative: {
    label: "Let's explore your options",
    headline: "Another treatment may suit you better",
    blurb:
      "Your goals may be better met by a different approach. A free online consultation is the best way to find the right one.",
    accent: "sage",
    ctaLabel: "Discuss your options",
    gaugeBand: [40, 60],
  },
};

/** Friendly labels for the facial zones the analysis covers. */
export const AREA_LABELS: Record<string, string> = {
  forehead: "forehead",
  undereye: "under-eye area",
  nose: "nose",
  cheeks: "cheeks",
  upperlip: "upper lip",
  jawline: "jawline",
};

/** Concerns the protocol targets, for the result screen's "what it treats" context. */
export const TREATMENT_CONCERNS = [
  "Dark spots & sun damage",
  "Uneven or patchy tone",
  "Post-blemish marks",
  "Stubborn facial pigmentation",
] as const;

/** The clinic's 3-step Signature Pigmentation Removal Treatment. */
export const PROTOCOL_STEPS = [
  {
    step: "01",
    title: "VirtueRF · Pulsed Mode",
    blurb:
      "Radiofrequency energy delivered through fine microchannels helps break down excess pigment — working like a laser, without laser side-effects — while calming the overactive pigment-producing cells.",
  },
  {
    step: "02",
    title: "Exosome Therapy",
    blurb:
      "Growth-factor-rich exosomes soothe the skin, accelerate healing and encourage cellular renewal for a brighter, more even complexion.",
  },
  {
    step: "03",
    title: "Mesotherapy",
    blurb:
      "A tailored cocktail of vitamins, antioxidants and pigment-reducing agents, delivered where your skin needs it most.",
  },
] as const;

/** Supporting elements of the protocol, shown beneath the 3 steps. */
export const PROTOCOL_SUPPORT =
  "Supported by brightening skincare — Alpha Arbutin, Vitamin C, Niacinamide, Tranexamic Acid — and optional IV brightening drips.";

/** Indicative UK pricing guidance (clinic-stated; flexible payment plans). */
export const PRICE_GUIDE = {
  from: "£399",
  note: "Indicative — your exact plan is confirmed at consultation. Flexible payment plans available.",
} as const;

export const DISCLAIMER =
  "This tool offers general cosmetic information to help you prepare for a consultation. It is not a medical assessment or diagnosis, and it cannot identify the type or cause of any pigmentation. Suitability and safety are confirmed by a qualified practitioner. If any mark on your skin is new, changing or worrying you, please have it checked by a doctor.";
