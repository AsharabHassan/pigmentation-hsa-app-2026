import type { ClinicLocationKey } from "./types";
import { PRICE_PER_SESSION } from "./finance";

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
      "You take or upload one selfie on your phone. In about 60 seconds our AI maps visible dark spots and uneven tone across six areas of your face and gives you a personalised cosmetic report, which is also emailed to you as a PDF. It is an informational guide, not a medical diagnosis — a practitioner confirms your suitability at your free online consultation.",
  },
  {
    question: "What does the pigmentation treatment involve?",
    answer:
      "Our Signature Pigmentation Removal Treatment is a three-step, doctor-led protocol: VirtueRF Microneedling to help break down excess pigment, targeted Laser selected for your skin tone, and Mesotherapy with vitamins, antioxidants and pigment-reducing agents. It is supported by brightening skincare you continue at home.",
  },
  {
    question: "How many sessions will I need?",
    answer:
      "Most patients need at least 2 sessions, and results build gradually over the course. The right number depends on how deep and widespread your pigmentation is, so your practitioner confirms it at your consultation.",
  },
  {
    question: `How much does pigmentation removal cost in ${city}?`,
    answer: `Treatment starts from £${PRICE_PER_SESSION} per session. Because most people need at least two sessions, a course typically starts from £${PRICE_PER_SESSION * 2}. Your exact plan and price are confirmed at your free consultation, with no obligation.`,
  },
  {
    question: "Can I spread the cost?",
    answer:
      "Yes. You can pay in 3 interest-free instalments with Klarna, in 4 interest-free instalments with Clearpay, or spread larger courses monthly with Ideal4Finance. Finance is provided by the named lender and is subject to status and affordability checks, 18+ only.",
  },
  {
    question: "Is the treatment suitable for darker skin tones?",
    answer:
      "Pigmentation can be treated across a wide range of skin tones, but the settings matter. That is why the laser step is chosen and set by your practitioner for your skin, and why a consultation always comes first.",
  },
  {
    question: "Is there any downtime?",
    answer:
      "Most people notice some redness and warmth for a day or two, and treated spots can look slightly darker before they fade. Daily SPF is essential during your course. Your practitioner will give you aftercare advice specific to your skin.",
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
      alt: "Laser treatment in progress at our London clinic",
      width: 1200,
      height: 1420,
    },
    clinicPhotos: [],
    doctors: [MEHDI, AYDA, KHAN],
    metaTitle:
      "Pigmentation Removal London | Free AI Skin Analysis · Harley Street Aesthetics",
    metaDescription: `Doctor-led pigmentation removal at 10 Harley Street, London. Map your dark spots free in 60 seconds with our AI skin analysis, then book a free online consultation. From £${PRICE_PER_SESSION} per session, 0% payment plans.`,
    eyebrow: "Pigmentation removal · 10 Harley Street, London",
    h1Lead: "Pigmentation removal in London.",
    h1Accent: "See your skin mapped first, free.",
    intro:
      "Dark spots, sun damage and uneven tone mapped across your face in 60 seconds — then a doctor-led plan to fade them at our Harley Street clinic.",
    localProof: [
      "10 Harley Street, W1G 9PF",
      "Doctor-led clinic",
      `From £${PRICE_PER_SESSION} per session`,
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
    metaDescription: `Doctor-led pigmentation removal on Ingram Street, Glasgow. Map your dark spots free in 60 seconds with our AI skin analysis, then book a free online consultation. From £${PRICE_PER_SESSION} per session, 0% payment plans.`,
    eyebrow: "Pigmentation removal · Ingram Street, Glasgow",
    h1Lead: "Pigmentation removal in Glasgow.",
    h1Accent: "See your skin mapped first, free.",
    intro:
      "Dark spots, sun damage and uneven tone mapped across your face in 60 seconds — then a doctor-led plan to fade them at our Glasgow city-centre clinic.",
    localProof: [
      "Ingram House, 227 Ingram Street, G1 1DA",
      "Doctor-led clinic",
      `From £${PRICE_PER_SESSION} per session`,
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
    title: "AI maps your pigmentation",
    blurb:
      "Six facial zones analysed in about 60 seconds, with your own personalised report.",
  },
  {
    step: "03",
    title: "Book your free consultation",
    blurb:
      "A 15-minute online call where our team reviews your report and confirms your plan and price.",
  },
] as const;
