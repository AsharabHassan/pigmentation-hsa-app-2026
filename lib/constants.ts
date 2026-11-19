import type { Bucket, ClinicLocationKey } from "./types";
import { COURSE_PRICE, COURSE_SESSIONS, PRICE_PER_SESSION } from "./finance";
export type { ClinicLocationKey } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Clinic brand + contact constants (Harley Street Aesthetics, London & Glasgow).
// Single source of truth for copy that appears across screens.
// ─────────────────────────────────────────────────────────────────────────────

export interface ClinicLocation {
  key: ClinicLocationKey;
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
      key: "london",
      city: "London",
      lines: ["10 Harley Street", "London W1G 9PF"],
      phone: "020 4628 3165",
      phoneHref: "tel:+442046283165",
    },
    {
      key: "glasgow",
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
const WORKING_GLASGOW_BOOKING_URL =
  "https://harleystreetaesthetic.co.uk/glasgow/contact/";

// Protect production from the retired route if a stale Vercel value survives
// one deployment. Other explicitly configured booking providers still work.
export const BOOKING_URL =
  !CONFIGURED_BOOKING_URL ||
  /^https:\/\/harleystreetaesthetic\.co\.uk\/london\/book\/?$/i.test(
    CONFIGURED_BOOKING_URL,
  )
    ? WORKING_BOOKING_URL
    : CONFIGURED_BOOKING_URL;

export const BOOKING_URLS: Record<ClinicLocationKey, string> = {
  london: BOOKING_URL,
  glasgow:
    process.env.NEXT_PUBLIC_GLASGOW_BOOKING_URL ??
    WORKING_GLASGOW_BOOKING_URL,
};

// GoHighLevel calendar embedded on the result page. One shared consultation
// calendar today; each clinic can be pointed at its own via public env.
const DEFAULT_CALENDAR_URL =
  "https://link.harleystreetaesthetic.co.uk/widget/bookings/aesthetic-consultant-1";

export const CALENDAR_URLS: Record<ClinicLocationKey, string> = {
  london: process.env.NEXT_PUBLIC_BOOKING_CALENDAR_URL ?? DEFAULT_CALENDAR_URL,
  glasgow:
    process.env.NEXT_PUBLIC_GLASGOW_BOOKING_CALENDAR_URL ??
    process.env.NEXT_PUBLIC_BOOKING_CALENDAR_URL ??
    DEFAULT_CALENDAR_URL,
};

/** UK numbers in the +44 form GoHighLevel's phone field expects. */
export function toE164Uk(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("44")) return `+${digits}`;
  if (digits.startsWith("0")) return `+44${digits.slice(1)}`;
  return digits;
}

type CalendarLead = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
} | null;

/** The field names GoHighLevel's calendar reads to prefill its contact form. */
export function calendarPrefill(lead: CalendarLead): Record<string, string> {
  if (!lead) return {};
  return {
    first_name: lead.firstName,
    last_name: lead.lastName,
    email: lead.email,
    phone: toE164Uk(lead.phone),
  };
}

/** Calendar link with the visitor's details prefilled, so booking is two taps. */
export function prefilledCalendarUrl(
  calendarUrl: string,
  lead: CalendarLead,
): string {
  try {
    const url = new URL(calendarUrl);
    for (const [name, value] of Object.entries(calendarPrefill(lead))) {
      url.searchParams.set(name, value);
    }
    return url.toString();
  } catch {
    return calendarUrl;
  }
}

export const DEFAULT_CLINIC_LOCATION: ClinicLocationKey = "london";

export function isClinicLocationKey(
  value: unknown,
): value is ClinicLocationKey {
  return value === "london" || value === "glasgow";
}

export function getClinicLocation(location: ClinicLocationKey) {
  const clinic = CLINIC.locations.find((item) => item.key === location);
  if (!clinic) throw new Error(`Unknown clinic location: ${location}`);
  return {
    ...clinic,
    bookingUrl: BOOKING_URLS[location],
    calendarUrl: CALENDAR_URLS[location],
  };
}

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
  /** What the CLIENT sees at the top of the report and on the PDF cover.
   *  (`label` stays as-is: it is sent to GoHighLevel and used by the team.) */
  chip: string;
  /** Indicative gauge band centre for this bucket (0–100). */
  gaugeBand: [number, number];
}

export const BUCKET_META: Record<Bucket, BucketMeta> = {
  great: {
    label: "Strong candidate",
    chip: "Great match for our Signature Treatment",
    headline: "Your skin shows exactly what this treatment targets",
    blurb:
      "The pigmentation visible in your photo is just the kind our new Signature Pigmentation Treatment is designed to fade.",
    accent: "peach",
    ctaLabel: "Book Your Free Online Consultation",
    gaugeBand: [82, 100],
  },
  good: {
    label: "Good candidate",
    chip: "Good match for our Signature Treatment",
    headline: "Your skin tone could respond beautifully",
    blurb:
      "Your photo shows the kind of subtle unevenness that responds well to our new pigmentation treatment — a consultation will confirm the detail.",
    accent: "peach",
    ctaLabel: "Book Your Free Online Consultation",
    gaugeBand: [68, 88],
  },
  consultation: {
    label: "Consultation recommended",
    chip: "Let's look at your skin together",
    headline: "Let's look at your skin together",
    blurb:
      "Your skin is best reviewed by our doctor-led team before we can be sure of the right plan. That's completely normal.",
    accent: "sage",
    ctaLabel: "Book Your Free Online Consultation",
    gaugeBand: [55, 75],
  },
  alternative: {
    label: "Let's explore your options",
    chip: "Let's explore your options",
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

/**
 * The clinic's Signature Pigmentation Treatment: the 3R Programme
 * (Reduce, Regulate, Reverse). Reverse is optional and advanced.
 * House rules: never name a product or brand, never call it a "peel", never
 * claim "no needles" or "painless" for the spicule step.
 */
export const PROGRAMME_NAME = "3R Programme";

export const PROTOCOL_STEPS = [
  {
    step: "01",
    title: "Reduce · the pigment you can see",
    blurb:
      "A topical repair therapy with healing ingredients, including a colostrum-based complex. It lifts surface pigment while it helps the skin heal. Healthy, repaired skin responds better to treatment.",
  },
  {
    step: "02",
    title: "Regulate · how pigment is made",
    blurb:
      "Microscopic spicules carry pigment-regulating ingredients to the junction between the two top layers of your skin, where the pigment cells sit. They help bring overactive pigment production back towards normal. They also help strengthen that layer, so less pigment leaks deeper.",
  },
  {
    step: "03",
    title: "Reverse · optional advanced step",
    blurb:
      "An advanced regenerative therapy for those who want to go further. It is optional and is discussed with your consultant. Most people choose the first two steps.",
  },
] as const;

/** The core message, in the medical director's framing. */
export const PROGRAMME_PROMISE = "Repair, don't damage. From the surface to the cell.";

/** Plain-language mechanism: why pigmentation returns and what the programme does about it. */
export const PROGRAMME_MECHANISM =
  "Pigment cells sit at the junction between the two top layers of your skin. In many people that junction is weak. Extra pigment then leaks into the deeper skin, which is why it keeps coming back. Older approaches attack the surface and add more damage. We help regulate how pigment is made and strengthen that layer. Your skin is already damaged. It needs repairing, not more damage.";

/** Shown near result claims. */
export const RESULTS_VARY = "Results vary. A consultation is needed to confirm suitability.";

/** How the clinic frames the course; the exact programme is set at consultation. */
export const SESSIONS_GUIDE = {
  /** Sessions in the usual starting course. */
  usual: 4,
  course: "4 sessions, two weeks apart",
  note: "Most people start with a course of 4 sessions, two weeks apart. Some people need 6 or 8. Our doctor confirms your programme at your consultation.",
} as const;

/** Supporting elements of the protocol, shown beneath the 3 steps. */
export const PROTOCOL_SUPPORT =
  "Supported at home by a clinic-prescribed repair routine (tranexamic acid, vitamin C, ferulic acid and hyaluronic acid), with daily SPF 50 to protect your result.";

/** UK pricing (clinic-stated; flexible payment plans). */
export const PRICE_GUIDE = {
  // Price for ONE session. (Key kept as `from` for existing callers.)
  from: `£${PRICE_PER_SESSION} per session`,
  course: `£${COURSE_PRICE} for a course of ${COURSE_SESSIONS} sessions`,
  line: `£${PRICE_PER_SESSION} per session, or £${COURSE_PRICE} for a course of ${COURSE_SESSIONS} sessions`,
  note: "Your exact programme and price are confirmed at consultation. Flexible payment plans available.",
} as const;

export const DISCLAIMER =
  "This tool offers general information to help you prepare for a consultation. It is for informational purposes only and is not a diagnosis — any pigmentation type shown is an indication from a single photo, and only a qualified practitioner can confirm it, along with your suitability and safety. If any mark on your skin is new, changing or worrying you, please have it checked by a doctor.";
