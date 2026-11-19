import type { ClinicLocationKey } from "./types";
import { COURSE_PRICE, COURSE_SESSIONS, PRICE_PER_SESSION } from "./finance";

// ─────────────────────────────────────────────────────────────────────────────
// Copy for the Google Ads landing pages (/london/pigmentation-removal and
// /glasgow/pigmentation-removal). One source feeds the visible page, the
// metadata and the JSON-LD, so what Google reads always matches what a visitor
// sees. Treatment wording should be signed off by a practitioner before ads run.
// ─────────────────────────────────────────────────────────────────────────────

export interface LandingFaq {
  question: string;
  answer: string;
}

export interface LandingDoctor {
  name: string;
  role: string;
  bio: string;
  /** Portrait in /public/team; omitted until a verified photo is supplied. */
  photo?: string;
}

export interface LandingPhoto {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface LandingContent {
  /** Headline rating from the clinic's Google Business Profile (checked 2026-09-19). */
  googleRating: { score: string; reviews?: number };
  heroPhoto: LandingPhoto;
  clinicPhotos: LandingPhoto[];
  doctors: LandingDoctor[];
  /** Route of this page. */
  path: string;
  /** Wizard route the primary CTA opens. */
  analysisPath: string;
  /** Value stored as the visit's landing page in the insights database. */
  landingId: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  h1Lead: string;
  h1Accent: string;
  intro: string;
  localProof: string[];
  aboutHeading: string;
  aboutBody: string[];
  faqs: LandingFaq[];
}

const sharedFaqs = (city: string): LandingFaq[] => [
  {
    question: "How does the free AI pigmentation analysis work?",
    answer:
      "Upload a clear selfie. The AI compares visible patterns with six pigmentation categories, suggests the closest pattern where the photo supports it, and maps the affected facial areas. Your report explains that suggested pattern and questions to discuss with our team. Lighting, makeup and mixed patterns can limit the result; it is a cosmetic guide, not a diagnosis. A clinician confirms the type and suitable options at your free consultation.",
  },
  {
    question: "What does the pigmentation treatment involve?",
    answer:
      "Our Signature Pigmentation Treatment follows our doctor-led 3R Programme. Reduce: a topical repair therapy with healing ingredients lifts surface pigment while it helps the skin heal. Regulate: microscopic spicules carry pigment-regulating ingredients to the junction between the two top layers of your skin, where the pigment cells sit. This helps bring pigment production back towards normal and helps strengthen that layer, so less pigment leaks deeper. Reverse is an optional, advanced step that your consultant can discuss with you. We repair the skin. We do not damage it. Results vary. A consultation is needed to confirm suitability.",
  },
  {
    question: "Why does my pigmentation keep coming back?",
    answer:
      "Pigment cells sit at the junction between the two top layers of your skin. In many people that junction is weak, so extra pigment leaks into the deeper skin. Treatments that only attack the surface do not change this, so the pigment returns. Our 3R Programme works from the surface to the cell. It reduces the pigment you can see, then helps regulate how pigment is made and strengthen that layer. Results vary. A consultation is needed to confirm suitability.",
  },
  {
    question: "How many sessions will I need?",
    answer:
      "Most people start with a course of 4 sessions, two weeks apart. Some people need 6 or 8. It depends on how deep and widespread your pigmentation is, so our doctor confirms your programme at your consultation.",
  },
  {
    question: `How much does pigmentation removal cost in ${city}?`,
    answer: `Treatment is £${PRICE_PER_SESSION} per session, or £${COURSE_PRICE} for a course of ${COURSE_SESSIONS} sessions. Most people start with a course of ${COURSE_SESSIONS}, two weeks apart. Your exact programme and price are confirmed at your free consultation, with no obligation.`,
  },
  {
    question: "Can I spread the cost?",
    answer:
      "Yes. You can pay in 3 interest-free instalments with Klarna, in 4 interest-free instalments with Clearpay, or spread larger courses monthly with Ideal4Finance. Finance is provided by the named lender and is subject to status and affordability checks, 18+ only.",
  },
  {
    question: "Is the treatment suitable for darker skin tones?",
    answer:
      "Our programme is built to repair the skin, not to damage it, and it does not use laser heat. It is designed to suit all skin tones, including deeper skin that can react to heat-based treatments. Your practitioner still confirms suitability at your consultation, which always comes first.",
  },
  {
    question: "Is there any downtime?",
    answer:
      "Some people notice mild redness or tingling for a short while after a session. Your practitioner explains what to expect for your skin at your consultation. Daily SPF 50 is essential during your programme, and you are given aftercare advice specific to your skin.",
  },
  {
    question: "What happens on the free online consultation?",
    answer:
      "It is a 15-minute online call with our doctor-led team. They review your analysis report with you, answer your questions, and give you your exact plan and price. There is no obligation to book treatment.",
  },
  {
    question: "Is my photo kept?",
    answer:
      "Your photo is processed once to create your report and is not stored by the analysis tool. Your report, including the photo, is emailed to you and saved to your clinic record so the team can review it before your consultation.",
  },
];

// Team as published on harleystreetaesthetic.co.uk/<city>/team. Bios are the
// clinic's own wording, shortened.
const MEHDI: LandingDoctor = {
  name: "Mr Syed Y Mehdi, FRCS",
  role: "Consultant Plastic Surgeon",
  bio: "Reconstructive and aesthetic surgeon whose work spans facial rejuvenation and advanced skin surgery across our London and Glasgow clinics.",
  photo: "/team/syed-mehdi.webp",
};
const AYDA: LandingDoctor = {
  name: "Dr Ayda Soltanzadeh",
  role: "Consultant Dermatologist",
  bio: "A background in clinical dermatology and a meticulous approach to aesthetic medicine, with plans tailored to each patient's skin.",
  photo: "/team/ayda-soltanzadeh.webp",
};
const KHAN: LandingDoctor = {
  name: "Dr Mazhar Khan",
  role: "Medical Doctor, MBBS MRCGP DRCOG DFFP",
  bio: "More than 23 years of clinical experience, over 20 of them as a GP in NHS and private practice.",
  photo: "/team/mazhar-khan.webp",
};
const AL_NAKIB: LandingDoctor = {
  name: "Dr Khalil Al-Nakib",
  role: "Consultant Plastic Surgeon",
  bio: "Combines deep anatomical understanding with an eye for harmony, across surgical and non-surgical skin treatment.",
  photo: "/team/khalil-al-nakib.webp",
};

const GLASGOW_PHOTOS: LandingPhoto[] = [
  { src: "/clinic/glasgow-waiting-area.webp", alt: "Waiting area at Harley Street Aesthetics Glasgow, Ingram House", width: 900, height: 1200 },
  { src: "/clinic/glasgow-treatment-room-2.webp", alt: "Treatment room at the Glasgow clinic", width: 900, height: 1200 },
  { src: "/clinic/glasgow-treatment-room-1.webp", alt: "Second treatment room at the Glasgow clinic", width: 900, height: 1200 },
];

export const LANDING_CONTENT: Record<ClinicLocationKey, LandingContent> = {
  london: {
    path: "/london/pigmentation-removal",
    analysisPath: "/camera",
    landingId: "ads-london-pigmentation-removal",
    googleRating: { score: "4.6", reviews: 219 },
    heroPhoto: {
      src: "/clinic/london-laser-treatment.webp",
      alt: "Treatment in progress at our London clinic",
      width: 1200,
      height: 1420,
    },
    clinicPhotos: [],
    doctors: [MEHDI, AYDA, KHAN],
    metaTitle:
      "Pigmentation Removal London | Free AI Skin Analysis · Harley Street Aesthetics",
    metaDescription: `Doctor-led pigmentation removal at 10 Harley Street, London. Map your dark spots free in 60 seconds with our AI skin analysis, then book a free online consultation. £${PRICE_PER_SESSION} per session or £${COURSE_PRICE} for a course of ${COURSE_SESSIONS}. 0% payment plans.`,
    eyebrow: "Doctor-led · 10 Harley Street, London",
    h1Lead: "Pigmentation removal in London.",
    h1Accent: "Understand your pigmentation pattern.",
    intro:
      "Is it a melasma-like pattern, sun-related spots or marks after blemishes? Your free AI photo analysis suggests a visible pattern, maps the areas affected and creates your personal report. Discuss what it means with our London clinicians before choosing treatment.",
    localProof: [
      "10 Harley Street, W1G 9PF",
      `£${PRICE_PER_SESSION} per session, or ${COURSE_SESSIONS} for £${COURSE_PRICE}`,
      "0% payment plans",
    ],
    aboutHeading: "Doctor-led pigmentation treatment on Harley Street",
    aboutBody: [
      "Harley Street Aesthetics treats facial pigmentation from our clinic at 10 Harley Street in Marylebone, a short walk from Oxford Circus and Regent's Park stations, with a second London location near Chancery Lane.",
      "Every plan starts with understanding your skin. Our free AI analysis shows you where visible pigmentation sits — forehead, under-eyes, nose, cheeks, upper lip and jawline — and your free online consultation turns that into a treatment plan built for your skin tone.",
    ],
    faqs: sharedFaqs("London"),
  },
  glasgow: {
    path: "/glasgow/pigmentation-removal",
    analysisPath: "/glasgow/camera",
    landingId: "ads-glasgow-pigmentation-removal",
    googleRating: { score: "4.4" },
    heroPhoto: {
      src: "/clinic/glasgow-reception-desk.webp",
      alt: "Reception at Harley Street Aesthetics Glasgow",
      width: 900,
      height: 1200,
    },
    clinicPhotos: GLASGOW_PHOTOS,
    doctors: [AL_NAKIB, AYDA, MEHDI],
    metaTitle:
      "Pigmentation Removal Glasgow | Free AI Skin Analysis · Harley Street Aesthetics",
    metaDescription: `Doctor-led pigmentation removal on Ingram Street, Glasgow. Map your dark spots free in 60 seconds with our AI skin analysis, then book a free online consultation. £${PRICE_PER_SESSION} per session or £${COURSE_PRICE} for a course of ${COURSE_SESSIONS}. 0% payment plans.`,
    eyebrow: "Doctor-led · Ingram Street, Glasgow",
    h1Lead: "Pigmentation removal in Glasgow.",
    h1Accent: "Understand your pigmentation pattern.",
    intro:
      "Is it a melasma-like pattern, sun-related spots or marks after blemishes? Your free AI photo analysis suggests a visible pattern, maps the areas affected and creates your personal report. Discuss what it means with our Glasgow clinicians before choosing treatment.",
    localProof: [
      "Ingram House, 227 Ingram Street, G1 1DA",
      `£${PRICE_PER_SESSION} per session, or ${COURSE_SESSIONS} for £${COURSE_PRICE}`,
      "0% payment plans",
    ],
    aboutHeading: "Doctor-led pigmentation treatment in Glasgow city centre",
    aboutBody: [
      "Harley Street Aesthetics brings its Harley Street pigmentation protocol to Glasgow, from our clinic on the 5th floor of Ingram House in the Merchant City, minutes from Queen Street and Argyle Street stations.",
      "Every plan starts with understanding your skin. Our free AI analysis shows you where visible pigmentation sits — forehead, under-eyes, nose, cheeks, upper lip and jawline — and your free online consultation turns that into a treatment plan built for your skin tone.",
    ],
    faqs: sharedFaqs("Glasgow"),
  },
};

export const LANDING_STEPS = [
  {
    step: "01",
    title: "Take a selfie",
    blurb: "One clear, front-facing photo on your phone. No app to download.",
  },
  {
    step: "02",
    title: "Understand your suggested pattern",
    blurb:
      "See the closest visible pattern, where it appears and what to ask your clinician — with uncertainty explained when the photo is unclear.",
  },
  {
    step: "03",
    title: "Book your free consultation",
    blurb:
      "A 15-minute online call where our team reviews your report and confirms your plan and price.",
  },
] as const;
