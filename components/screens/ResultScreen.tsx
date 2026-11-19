"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Sparkles, Info, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWizard } from "@/store/wizard-store";
import { FaceConcernMap } from "@/components/result/FaceConcernMap";
import { WhatToExpect } from "@/components/result/WhatToExpect";
import { SpotTypeCard } from "@/components/result/SpotTypeCard";
import { RecommendedTreatment } from "@/components/result/RecommendedTreatment";
import { PigmentationSummary } from "@/components/result/PigmentationSummary";
import { shouldRecommend } from "@/lib/protocol-pitch";
import { scrollToBooking } from "@/components/result/BookingCalendar";
import { REPORT_DISCLAIMER, SPOT_TYPES } from "@/lib/spot-types";
import { ResultsGallery } from "@/components/result/ResultsGallery";
import { Testimonials } from "@/components/result/Testimonials";
import { BookingCTA, StickyBookingBar } from "@/components/result/BookingCTA";
import { BookingCalendar } from "@/components/result/BookingCalendar";
import { NextStepCard } from "@/components/result/NextStepCard";
import { FinanceCalculator } from "@/components/result/FinanceCalculator";
import { trackInsight } from "@/lib/visit-context";
import { DisclaimerBanner } from "@/components/compliance/DisclaimerBanner";
import { BUCKET_META, TREATMENT_CONCERNS } from "@/lib/constants";
import { EASE } from "@/lib/motion";
import { useClinicLocation } from "@/components/clinic/ClinicLocationContext";

const reveal = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.6, ease: EASE },
});

export function ResultScreen() {
  const clinic = useClinicLocation();
  const result = useWizard((s) => s.result);
  const imageBase64 = useWizard((s) => s.imageBase64);
  const imageMediaType = useWizard((s) => s.imageMediaType);
  const landmarks = useWizard((s) => s.landmarks);
  const lead = useWizard((s) => s.lead);
  const [downloading, setDownloading] = useState(false);
  const analysisId = result?.analysisId;

  useEffect(() => {
    trackInsight(analysisId, "result_viewed");
  }, [analysisId]);

  if (!result) return null;

  const meta = BUCKET_META[result.bucket];
  const { narrative } = result;

  async function downloadReport() {
    if (!result) return;
    trackInsight(analysisId, "report_download");
    setDownloading(true);
    try {
      const { generateReportPdf } = await import("@/lib/report");
      const blob = await generateReportPdf({
        result,
        imageBase64,
        imageMediaType,
        landmarks,
        lead,
        clinicLocation: clinic.key,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const who = lead?.firstName ? `-${lead.firstName}` : "";
      a.download = `Pigmentation-Analysis-Report${who}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch {
      /* ignore — download is best-effort */
    } finally {
      setDownloading(false);
    }
  }
  const areas =
    narrative.observedAreas.length > 0
      ? narrative.observedAreas
      : (TREATMENT_CONCERNS as readonly string[]);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 pb-28 pt-10 sm:pb-10">
      <motion.div {...reveal(0)} className="flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-peach/30 bg-peach/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-peach">
          <Sparkles size={13} /> {meta.chip}
        </span>
        <h2 className="mt-4 font-serif text-[32px] leading-tight text-heading sm:text-[40px]">
          {narrative.headline}
        </h2>
      </motion.div>

      <motion.div {...reveal(0.1)} className="mt-8">
        <NextStepCard />
      </motion.div>

      {result.usedPhoto && (
        <motion.div {...reveal(0.2)} className="mt-8">
          <PigmentationSummary
            spotType={result.spotType}
            secondary={result.secondarySpotType}
            zoneSeverity={result.zoneSeverity}
            observedAreas={narrative.observedAreas}
            zonesObscured={result.zonesObscured}
          />
        </motion.div>
      )}

      <motion.div
        {...reveal(0.5)}
        className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 shadow-soft"
      >
        <p className="text-[15px] leading-relaxed text-body">
          {narrative.narrative}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {areas.map((a) => (
            <span
              key={a}
              className="rounded-full bg-cream-deep px-3 py-1 text-xs font-medium capitalize text-heading"
            >
              {a}
            </span>
          ))}
        </div>

        <p className="mt-5 border-t border-sage/15 pt-4 text-[15px] font-medium leading-relaxed text-heading">
          {narrative.encouragement}
        </p>
      </motion.div>


      <motion.div {...reveal(0.55)} className="mt-10">
        <FaceConcernMap />
      </motion.div>

      {result.usedPhoto && result.zonesObscured.length > 0 && (
        <motion.div
          {...reveal(0.55)}
          className="mt-6 flex items-start gap-2.5 rounded-2xl border border-peach/25 bg-peach/[0.06] px-4 py-3"
        >
          <Info size={16} className="mt-0.5 shrink-0 text-peach" />
          <p className="text-[13px] leading-relaxed text-body">
            <span className="font-semibold text-heading">
              Some areas were covered.
            </span>{" "}
            Hair, facial hair, glasses or shadow hid part of your face, so
            we&rsquo;ve kept the read light on those areas. The treatment works
            just as well there — your practitioner will assess them properly at
            your consultation.
          </p>
        </motion.div>
      )}

      {result.usedPhoto && result.makeupDetected && (
        <motion.div
          {...reveal(0.57)}
          className="mt-4 flex items-start gap-2.5 rounded-2xl border border-sage/25 bg-sage/[0.06] px-4 py-3"
        >
          <Info size={16} className="mt-0.5 shrink-0 text-sage" />
          <p className="text-[13px] leading-relaxed text-body">
            <span className="font-semibold text-heading">Makeup noticed.</span>{" "}
            Foundation or concealer may be softening how your pigmentation
            appears in the photo, so your true results could be even better
            than this read suggests. A bare-faced photo — or your free
            consultation — will show the full picture.
          </p>
        </motion.div>
      )}


      <motion.div {...reveal(0.4)} className="mt-8">
        <p className="mb-4 text-center text-sm leading-relaxed text-body">
          {result.spotType
            ? `Your photo suggests a ${SPOT_TYPES[result.spotType].name.toLowerCase()} pattern. Discuss this finding, the affected areas and suitable options with our ${clinic.city} team.`
            : `Your photo alone cannot confirm a pigmentation type. Our ${clinic.city} team can help you understand the marks and discuss suitable options.`}
        </p>
        <BookingCTA label="Discuss my pigmentation report" placement="top" showPhone={false} />
      </motion.div>

      {result.spotType && (
        <motion.div {...reveal(0.6)} className="mt-10">
          <SpotTypeCard
            primary={result.spotType}
            secondary={result.secondarySpotType}
          />
        </motion.div>
      )}


      {shouldRecommend(result.bucket) && (
        <motion.div {...reveal(0.64)} className="mt-8">
          <RecommendedTreatment spotType={result.spotType} />
        </motion.div>
      )}

      <motion.div {...reveal(0.66)} className="mt-10">
        <BookingCalendar />
      </motion.div>

      <motion.div {...reveal(0.7)} className="mt-8">
        <WhatToExpect spotType={result.spotType} />
      </motion.div>

      <motion.div {...reveal(0.75)} className="mt-10">
        <ResultsGallery />
      </motion.div>

      <motion.div {...reveal(0.8)} className="mt-8">
        <FinanceCalculator />
      </motion.div>

      <motion.div {...reveal(0.9)} className="mt-10">
        <Testimonials />
      </motion.div>

      <motion.div {...reveal(1)} className="mt-10">
        <BookingCTA label={meta.ctaLabel} placement="bottom" />
      </motion.div>

      <motion.div {...reveal(1.05)} className="mt-4 flex justify-center">
        <Button
          variant="outline"
          onClick={downloadReport}
          disabled={downloading}
        >
          {downloading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Preparing your
              report…
            </>
          ) : (
            <>
              <Download size={16} /> Download your report (PDF)
            </>
          )}
        </Button>
      </motion.div>

      <motion.div {...reveal(1.1)}>
        <DisclaimerBanner className="mt-8" />
      </motion.div>

      <motion.p
        {...reveal(1.15)}
        className="mt-6 text-center text-[13px] font-medium leading-relaxed text-heading"
      >
        {REPORT_DISCLAIMER}{" "}
        <button
          type="button"
          onClick={() => {
            trackInsight(analysisId, "cta_click", "disclaimer");
            scrollToBooking();
          }}
          className="text-peach underline underline-offset-2"
        >
          Book now
        </button>
      </motion.p>

      <StickyBookingBar label="Free online consultation" />
    </div>
  );
}
