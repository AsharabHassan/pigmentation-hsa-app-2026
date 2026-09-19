import Image from "next/image";
import { Phone, Star } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ClinicFooter } from "@/components/brand/ClinicFooter";
import { ClinicLocationProvider } from "@/components/clinic/ClinicLocationContext";
import { ResultsGallery } from "@/components/result/ResultsGallery";
import { FinanceCalculator } from "@/components/result/FinanceCalculator";
import { BookingCalendar } from "@/components/result/BookingCalendar";
import {
  CLINIC,
  PROTOCOL_STEPS,
  PROTOCOL_SUPPORT,
  SESSIONS_GUIDE,
  SITE_URL,
  TREATMENT_CONCERNS,
  getClinicLocation,
} from "@/lib/constants";
import { PRICE_PER_SESSION } from "@/lib/finance";
import {
  LANDING_CONTENT,
  LANDING_STEPS,
  type LandingDoctor,
} from "@/lib/landing-content";
import type { ClinicLocationKey } from "@/lib/types";
import {
  BookConsultationButton,
  LandingStickyBar,
  StartAnalysisLink,
} from "./LandingActions";
import { SampleReportMock } from "./SampleReportMock";

const CONSULTATION_POINTS = [
  "Talk through your skin concerns with our doctor-led team",
  "You leave with your exact plan and price",
  "No obligation. It is a conversation, not a commitment",
];

const shell = "mx-auto w-full max-w-6xl px-5 sm:px-8";
const h2Dark =
  "font-serif text-[32px] leading-[1.12] text-heading sm:text-[42px]";
const h2Light =
  "font-serif text-[32px] leading-[1.12] text-umber sm:text-[42px]";

function structuredData(location: ClinicLocationKey) {
  const content = LANDING_CONTENT[location];
  const clinic = getClinicLocation(location);
  const url = `${SITE_URL}${content.path}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "MedicalBusiness",
      "@id": `${url}#clinic`,
      name: `${CLINIC.name} ${clinic.city}`,
      url,
      image: `${SITE_URL}${content.heroPhoto.src}`,
      telephone: clinic.phoneHref.replace("tel:", ""),
      email: CLINIC.email,
      priceRange: "££",
      address: {
        "@type": "PostalAddress",
        streetAddress: clinic.lines[0],
        addressLocality: clinic.city,
        postalCode: clinic.lines[1]?.match(
          /[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}/,
        )?.[0],
        addressCountry: "GB",
      },
      employee: content.doctors.map((doctor) => ({
        "@type": "Person",
        name: doctor.name,
        jobTitle: doctor.role,
      })),
      makesOffer: {
        "@type": "Offer",
        name: "Signature Pigmentation Removal Treatment",
        price: PRICE_PER_SESSION,
        priceCurrency: "GBP",
        description: "Starting price per session; most patients need at least 2.",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: content.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ];
}

function Doctor({ doctor }: { doctor: LandingDoctor }) {
  const initials = doctor.name
    .replace(/^(Mr|Dr|Mrs|Ms)\.?\s+/i, "")
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  return (
    <li className="flex gap-5 border-t border-umber/15 pt-6">
      <div className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-full bg-ivory-deep">
        {doctor.photo ? (
          <Image
            src={doctor.photo}
            alt={`${doctor.name}, ${doctor.role}`}
            fill
            sizes="92px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-serif text-2xl text-umber-soft">
            {initials}
          </span>
        )}
      </div>
      <div>
        <h3 className="font-serif text-[21px] leading-tight text-umber">
          {doctor.name}
        </h3>
        <p className="mt-1 text-[13px] font-medium text-peach-deep">
          {doctor.role}
        </p>
        <p className="mt-2.5 text-sm leading-relaxed text-umber-soft">
          {doctor.bio}
        </p>
      </div>
    </li>
  );
}

export function LandingPage({ location }: { location: ClinicLocationKey }) {
  const content = LANDING_CONTENT[location];
  const clinic = getClinicLocation(location);
  const cta = {
    analysisPath: content.analysisPath,
    landingId: content.landingId,
  };
  const rating = content.googleRating;
  const facts = [
    `From £${PRICE_PER_SESSION} per session`,
    `Course of ${SESSIONS_GUIDE.minimum}+ sessions`,
    "Pay in 3 or 4 at 0% interest",
    "Free online consultation",
  ];

  return (
    <ClinicLocationProvider location={location}>
      {structuredData(location).map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(data).replace(/</g, "\\u003c"),
          }}
        />
      ))}

      <div className="flex min-h-dvh flex-col overflow-x-hidden bg-cream pb-20 sm:pb-0">
        <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-cream/90 backdrop-blur-md">
          <div className={`${shell} flex h-16 items-center justify-between gap-4`}>
            <Logo />
            <div className="flex items-center gap-5">
              <a
                href={clinic.phoneHref}
                className="hidden items-center gap-2 text-sm font-medium text-heading/85 transition hover:text-peach sm:flex"
              >
                <Phone size={14} className="text-peach" /> {clinic.phone}
              </a>
              <StartAnalysisLink {...cta} className="h-10 px-5 text-sm">
                Free skin analysis
              </StartAnalysisLink>
            </div>
          </div>
        </header>

        <main>
          {/* ── Hero: the real clinic, with the report laid over it ─────── */}
          <section className={`${shell} grid gap-12 pb-20 pt-12 lg:grid-cols-12 lg:gap-8 lg:pt-20`}>
            <div className="lg:col-span-6 lg:pt-6">
              <p className="text-sm text-peach">
                {CLINIC.name}, {clinic.lines[0]}, {clinic.city}
              </p>
              <h1 className="mt-5 font-serif text-[42px] leading-[1.04] tracking-[-0.01em] text-heading sm:text-[60px]">
                {content.h1Lead}
                <span className="mt-2 block text-[0.62em] leading-[1.15] text-heading/70">
                  {content.h1Accent}
                </span>
              </h1>
              <p className="mt-7 max-w-[34rem] text-[17px] leading-[1.65] text-body">
                {content.intro}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <StartAnalysisLink {...cta} className="w-full sm:w-auto" />
                <BookConsultationButton className="w-full sm:w-auto" />
              </div>
              <p className="mt-4 text-[13px] text-heading/50">
                Takes about 60 seconds. Your report is emailed to you.
              </p>

              <div className="mt-10 flex items-center gap-3 border-t border-white/10 pt-6">
                <span className="flex gap-0.5 text-peach" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={15} fill="currentColor" strokeWidth={0} />
                  ))}
                </span>
                <p className="text-sm text-body">
                  <span className="font-semibold text-heading">
                    {rating.score} out of 5
                  </span>{" "}
                  on Google
                  {rating.reviews ? `, from ${rating.reviews} reviews` : ""}
                </p>
              </div>
            </div>

            <div className="relative lg:col-span-6">
              <div className="relative ml-auto aspect-[4/5] w-full max-w-[520px] overflow-hidden rounded-md">
                <Image
                  src={content.heroPhoto.src}
                  alt={content.heroPhoto.alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 520px, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <p className="absolute bottom-4 right-4 text-right text-xs text-white/85">
                  Our {clinic.city} clinic
                </p>
              </div>
              <div className="relative -mt-40 w-[210px] sm:-mt-56 sm:w-[250px] lg:absolute lg:bottom-[-40px] lg:left-[calc(100%-520px+20px)] lg:mt-0">
                <SampleReportMock />
              </div>
            </div>
          </section>

          {/* ── Facts, stated once ──────────────────────────────────────── */}
          <section className="border-y border-white/[0.08]">
            <ul className={`${shell} grid grid-cols-2 gap-y-4 py-6 text-sm text-heading lg:grid-cols-4`}>
              {facts.map((fact) => (
                <li
                  key={fact}
                  className="border-l border-peach/40 pl-4 leading-snug"
                >
                  {fact}
                </li>
              ))}
            </ul>
          </section>

          {/* ── How it works: a real sequence, so it is numbered ────────── */}
          <section className={`${shell} py-20 lg:py-24`}>
            <div className="max-w-2xl">
              <h2 className={h2Dark}>
                From a selfie to a treatment plan
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-body">
                The analysis is a cosmetic guide that helps you and our team
                start from the same picture. It is not a diagnosis.
              </p>
            </div>
            <ol className="mt-12 grid gap-10 border-t border-peach/30 md:grid-cols-3 md:gap-8">
              {LANDING_STEPS.map((item, i) => (
                <li key={item.step} className="relative pt-7">
                  <span className="absolute -top-px left-0 h-px w-16 bg-peach" />
                  <span className="font-serif text-[15px] text-peach">
                    Step {i + 1}
                  </span>
                  <h3 className="mt-2 font-serif text-2xl text-heading">
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-body">
                    {item.blurb}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          {/* ── The clinic, on warm paper so the photos carry it ────────── */}
          <section className="lp-paper bg-ivory py-20 text-umber lg:py-24">
            <div className={`${shell} grid gap-12 lg:grid-cols-12`}>
              <div className="lg:col-span-5">
                <h2 className={h2Light}>{content.aboutHeading}</h2>
                {content.aboutBody.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-5 text-[16px] leading-[1.7] text-umber-soft"
                  >
                    {paragraph}
                  </p>
                ))}
                <address className="mt-7 border-l-2 border-peach-deep pl-4 text-[15px] not-italic leading-relaxed text-umber">
                  {clinic.lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                  <a
                    href={clinic.phoneHref}
                    className="mt-1 block font-medium text-peach-deep"
                  >
                    {clinic.phone}
                  </a>
                </address>
              </div>

              <div className="lg:col-span-7">
                {content.clinicPhotos.length > 0 && (
                  <div className="mb-8 grid grid-cols-6 gap-3">
                    {content.clinicPhotos.map((photo, i) => (
                      <div
                        key={photo.src}
                        className={`relative overflow-hidden rounded-md ${
                          i === 0
                            ? "col-span-6 aspect-[16/10] sm:col-span-4 sm:row-span-2 sm:aspect-auto"
                            : "col-span-3 aspect-[4/5] sm:col-span-2"
                        }`}
                      >
                        <Image
                          src={photo.src}
                          alt={photo.alt}
                          fill
                          sizes="(min-width: 1024px) 420px, 100vw"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <h3 className="font-serif text-2xl text-umber">
                    Concerns we see most
                  </h3>
                  <ul className="mt-4 grid gap-x-8 text-[15px] text-umber-soft sm:grid-cols-2">
                    {[
                      ...TREATMENT_CONCERNS,
                      "Sun spots and age spots",
                      "Melasma-type patches, assessed by a practitioner",
                    ].map((concern) => (
                      <li
                        key={concern}
                        className="border-b border-umber/12 py-3"
                      >
                        {concern}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-[13px] leading-relaxed text-umber-soft/85">
                    Any mark that is new, changing or worrying you should be
                    checked by a doctor before cosmetic treatment.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── The treatment ───────────────────────────────────────────── */}
          <section className={`${shell} grid gap-12 py-20 lg:grid-cols-12 lg:py-24`}>
            <div className="lg:col-span-4">
              <h2 className={h2Dark}>Three treatments, one plan</h2>
              <p className="mt-4 text-[16px] leading-relaxed text-body">
                Each step works on pigment differently. Your practitioner
                decides the balance for your skin tone.
              </p>
              <dl className="mt-8 space-y-5 border-t border-white/10 pt-6">
                <div>
                  <dt className="text-[13px] text-heading/55">Price</dt>
                  <dd className="mt-1 font-serif text-3xl text-heading">
                    from £{PRICE_PER_SESSION}
                    <span className="ml-2 font-sans text-sm text-body">
                      per session
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[13px] text-heading/55">Course</dt>
                  <dd className="mt-1 text-[15px] leading-relaxed text-body">
                    {SESSIONS_GUIDE.note}
                  </dd>
                </div>
              </dl>
            </div>
            <ol className="lg:col-span-8">
              {PROTOCOL_STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="grid gap-2 border-t border-white/10 py-7 sm:grid-cols-[9rem_1fr] sm:gap-8"
                >
                  <span className="font-serif text-[15px] text-peach">
                    Step {i + 1}
                  </span>
                  <div>
                    <h3 className="font-serif text-2xl text-heading">
                      {step.title}
                    </h3>
                    <p className="mt-2.5 max-w-xl text-[15px] leading-relaxed text-body">
                      {step.blurb}
                    </p>
                  </div>
                </li>
              ))}
              <li className="border-t border-white/10 pt-6 text-sm leading-relaxed text-body/80">
                {PROTOCOL_SUPPORT}
              </li>
            </ol>
          </section>

          {/* ── Results ─────────────────────────────────────────────────── */}
          <section className="border-t border-white/[0.08] py-20 lg:py-24">
            <div className={shell}>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <h2 className={h2Dark}>Results from our {clinic.city} team</h2>
                  <p className="mt-4 text-[16px] leading-relaxed text-body">
                    Drag each photo to compare. These are our own patients,
                    shown with their consent. Individual results vary, and
                    yours is confirmed at your consultation.
                  </p>
                </div>
                <StartAnalysisLink {...cta} className="shrink-0">
                  See where your pigmentation sits
                </StartAnalysisLink>
              </div>
              <div className="mt-10">
                <ResultsGallery wide />
              </div>
            </div>
          </section>

          {/* ── The team ────────────────────────────────────────────────── */}
          <section className="lp-paper bg-ivory py-20 text-umber lg:py-24">
            <div className={`${shell} grid gap-10 lg:grid-cols-12`}>
              <div className="lg:col-span-4">
                <h2 className={h2Light}>The medical team in {clinic.city}</h2>
                <p className="mt-4 text-[16px] leading-[1.7] text-umber-soft">
                  Consultants and doctors lead the clinic, and a practitioner
                  confirms your suitability before any treatment begins.
                </p>
              </div>
              <ul className="grid gap-x-10 gap-y-8 lg:col-span-8 md:grid-cols-2">
                {content.doctors.map((doctor) => (
                  <Doctor key={doctor.name} doctor={doctor} />
                ))}
              </ul>
            </div>
          </section>

          {/* ── Paying for it ───────────────────────────────────────────── */}
          <section className={`${shell} grid items-start gap-12 py-20 lg:grid-cols-12 lg:py-24`}>
            <div className="lg:col-span-5 lg:pt-4">
              <h2 className={h2Dark}>Spread the cost, interest-free</h2>
              <p className="mt-4 text-[16px] leading-relaxed text-body">
                Choose the number of sessions and a payment partner to see what
                each payment would be. Your exact price is confirmed at your
                consultation.
              </p>
            </div>
            <div className="lg:col-span-7">
              <FinanceCalculator />
            </div>
          </section>

          {/* ── Questions ───────────────────────────────────────────────── */}
          <section className="lp-paper bg-ivory py-20 text-umber lg:py-24">
            <div className={`${shell} grid gap-10 lg:grid-cols-12`}>
              <div className="lg:col-span-4">
                <h2 className={`${h2Light} lg:sticky lg:top-24`}>
                  Pigmentation removal in {clinic.city}: your questions
                </h2>
              </div>
              <div className="lg:col-span-8">
                {content.faqs.map((faq) => (
                  <details
                    key={faq.question}
                    className="group border-t border-umber/15 last:border-b"
                  >
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
                      <h3 className="font-serif text-[20px] leading-snug text-umber">
                        {faq.question}
                      </h3>
                      <span
                        aria-hidden
                        className="mt-1 text-2xl leading-none text-peach-deep transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="max-w-2xl pb-6 text-[15px] leading-[1.7] text-umber-soft">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* ── Secondary conversion: book directly ─────────────────────── */}
          <section className={`${shell} grid gap-12 py-20 lg:grid-cols-12 lg:py-24`}>
            <div className="lg:col-span-5 lg:pt-6">
              <h2 className={h2Dark}>Prefer to talk first?</h2>
              <p className="mt-4 text-[16px] leading-relaxed text-body">
                Book a free 15-minute online consultation with our {clinic.city}{" "}
                team. If you take the analysis first, they will have your report
                in front of them on the call.
              </p>
              <div className="mt-8 flex flex-col items-start gap-4">
                <StartAnalysisLink {...cta} />
                <a
                  href={clinic.phoneHref}
                  className="flex items-center gap-2 text-sm font-medium text-peach"
                >
                  <Phone size={14} /> Call the {clinic.city} clinic on{" "}
                  {clinic.phone}
                </a>
              </div>
            </div>
            <div className="lg:col-span-7">
              <BookingCalendar points={CONSULTATION_POINTS} />
            </div>
          </section>
        </main>

        <ClinicFooter />
        <LandingStickyBar {...cta} />
      </div>
    </ClinicLocationProvider>
  );
}
