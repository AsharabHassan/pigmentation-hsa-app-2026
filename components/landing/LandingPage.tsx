import {
  BadgeCheck,
  ChevronDown,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { Logo } from "@/components/brand/Logo";
import { ClinicFooter } from "@/components/brand/ClinicFooter";
import { ClinicLocationProvider } from "@/components/clinic/ClinicLocationContext";
import { DisclaimerBanner } from "@/components/compliance/DisclaimerBanner";
import { ResultsGallery } from "@/components/result/ResultsGallery";
import { WhatToExpect } from "@/components/result/WhatToExpect";
import { FinanceCalculator } from "@/components/result/FinanceCalculator";
import { BookingCalendar } from "@/components/result/BookingCalendar";
import {
  CLINIC,
  SITE_URL,
  TREATMENT_CONCERNS,
  getClinicLocation,
} from "@/lib/constants";
import { PRICE_PER_SESSION } from "@/lib/finance";
import { LANDING_CONTENT, LANDING_STEPS } from "@/lib/landing-content";
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
  "No obligation — it's a conversation, not a commitment",
];

function SectionHeading({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-peach">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-serif text-[30px] leading-tight text-heading sm:text-[38px]">
        {title}
      </h2>
      {lead && (
        <p className="mt-3 text-[15px] leading-relaxed text-body">{lead}</p>
      )}
    </div>
  );
}

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
      telephone: clinic.phoneHref.replace("tel:", ""),
      email: CLINIC.email,
      priceRange: "££",
      address: {
        "@type": "PostalAddress",
        streetAddress: clinic.lines[0],
        addressLocality: clinic.city,
        postalCode: clinic.lines[1]?.match(/[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}/)?.[0],
        addressCountry: "GB",
      },
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

export function LandingPage({ location }: { location: ClinicLocationKey }) {
  const content = LANDING_CONTENT[location];
  const clinic = getClinicLocation(location);
  const cta = {
    analysisPath: content.analysisPath,
    landingId: content.landingId,
  };

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

      <div className="flex min-h-dvh flex-col overflow-x-hidden pb-20 sm:pb-0">
        <AmbientBackground />

        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#070707]/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
            <Logo />
            <div className="flex items-center gap-3">
              <a
                href={clinic.phoneHref}
                className="hidden items-center gap-2 text-sm font-medium text-heading/80 transition hover:text-peach sm:flex"
              >
                <Phone size={14} className="text-peach" /> {clinic.phone}
              </a>
              <StartAnalysisLink {...cta} className="h-10 px-5 text-sm">
                Free AI analysis
              </StartAnalysisLink>
            </div>
          </div>
        </header>

        <main className="relative z-10">
          {/* ── Hero ─────────────────────────────────────────────────────── */}
          <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-16 pt-12 lg:grid-cols-[1.15fr_0.85fr] lg:pt-20">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-peach/35 bg-white/[0.04] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-peach">
                <Sparkles size={13} /> {content.eyebrow}
              </span>
              <h1 className="mt-6 font-serif text-[38px] leading-[1.06] tracking-tight text-heading sm:text-[54px]">
                {content.h1Lead}{" "}
                <span className="italic text-peach">{content.h1Accent}</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-body lg:mx-0">
                {content.intro}
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <StartAnalysisLink {...cta} className="w-full sm:w-auto" />
                <BookConsultationButton className="w-full sm:w-auto" />
              </div>
              <p className="mt-3 text-[13px] text-heading/55">
                60 seconds · Free · Your report is emailed to you
              </p>

              <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-2.5 text-left text-[13px] text-body sm:max-w-lg lg:mx-0">
                {content.localProof.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <BadgeCheck
                      size={15}
                      className="mt-0.5 shrink-0 text-peach"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <SampleReportMock />
          </section>

          {/* ── How it works ─────────────────────────────────────────────── */}
          <section className="border-y border-white/[0.06] bg-white/[0.02] py-16">
            <div className="mx-auto w-full max-w-6xl px-5">
              <SectionHeading
                eyebrow="How it works"
                title="From selfie to treatment plan in three steps"
              />
              <ol className="mt-10 grid gap-4 md:grid-cols-3">
                {LANDING_STEPS.map((item) => (
                  <li
                    key={item.step}
                    className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6"
                  >
                    <span className="font-serif text-3xl text-peach">
                      {item.step}
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-heading">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-body">
                      {item.blurb}
                    </p>
                  </li>
                ))}
              </ol>
              <div className="mt-9 flex justify-center">
                <StartAnalysisLink {...cta} />
              </div>
            </div>
          </section>

          {/* ── What we treat + local about ──────────────────────────────── */}
          <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 lg:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-peach">
                {clinic.city} clinic
              </p>
              <h2 className="mt-3 font-serif text-[30px] leading-tight text-heading sm:text-[36px]">
                {content.aboutHeading}
              </h2>
              {content.aboutBody.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-4 text-[15px] leading-relaxed text-body"
                >
                  {paragraph}
                </p>
              ))}
              <p className="mt-5 flex items-start gap-2 text-sm text-body">
                <MapPin size={16} className="mt-0.5 shrink-0 text-peach" />
                {clinic.lines.join(", ")}
              </p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-7">
              <h3 className="font-serif text-xl text-heading">
                Concerns we help with
              </h3>
              <ul className="mt-5 space-y-3">
                {[
                  ...TREATMENT_CONCERNS,
                  "Sun spots and age spots",
                  "Melasma-type patches (assessed by a practitioner)",
                ].map((concern) => (
                  <li
                    key={concern}
                    className="flex items-start gap-3 text-[15px] text-body"
                  >
                    <ShieldCheck
                      size={17}
                      className="mt-0.5 shrink-0 text-peach"
                    />
                    {concern}
                  </li>
                ))}
              </ul>
              <p className="mt-6 flex items-start gap-2 border-t border-white/10 pt-5 text-[13px] leading-relaxed text-body/75">
                <Stethoscope size={15} className="mt-0.5 shrink-0 text-sage" />
                Any mark that is new, changing or worrying you should be checked
                by a doctor before cosmetic treatment.
              </p>
            </div>
          </section>

          {/* ── Treatment, results, finance ──────────────────────────────── */}
          <section className="border-y border-white/[0.06] bg-white/[0.02] py-16">
            <div className="mx-auto w-full max-w-3xl space-y-12 px-5">
              <h2 className="sr-only">
                Treatment, real results and payment options
              </h2>
              <WhatToExpect />
              <ResultsGallery />
              <FinanceCalculator />
            </div>
          </section>

          {/* ── FAQ ──────────────────────────────────────────────────────── */}
          <section className="mx-auto w-full max-w-3xl px-5 py-16">
            <SectionHeading
              eyebrow="Questions"
              title={`Pigmentation removal in ${clinic.city}: your questions answered`}
            />
            <div className="mt-9 space-y-3">
              {content.faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-2xl border border-white/10 bg-white/[0.04] px-5 open:border-peach/30"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] font-semibold text-heading [&::-webkit-details-marker]:hidden">
                    <h3 className="text-[15px] font-semibold">{faq.question}</h3>
                    <ChevronDown
                      size={18}
                      className="shrink-0 text-peach transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <p className="pb-5 text-sm leading-relaxed text-body">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* ── Secondary conversion: book directly ──────────────────────── */}
          <section className="mx-auto w-full max-w-3xl px-5 pb-16">
            <SectionHeading
              eyebrow="Prefer to talk first?"
              title="Book your free online consultation"
              lead="Skip the analysis and speak to our team directly — or take the 60-second analysis first so they have your report in front of them."
            />
            <div className="mt-8">
              <BookingCalendar points={CONSULTATION_POINTS} />
            </div>
            <div className="mt-8 flex flex-col items-center gap-3">
              <StartAnalysisLink {...cta} />
              <a
                href={clinic.phoneHref}
                className="flex items-center gap-2 text-sm font-medium text-peach"
              >
                <Phone size={14} /> Or call our {clinic.city} clinic on{" "}
                {clinic.phone}
              </a>
            </div>
            <DisclaimerBanner className="mt-10" />
          </section>
        </main>

        <ClinicFooter />
        <LandingStickyBar {...cta} />
      </div>
    </ClinicLocationProvider>
  );
}
