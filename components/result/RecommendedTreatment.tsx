"use client";

import { motion } from "motion/react";
import { Award, Check, X, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scrollToBooking } from "@/components/result/BookingCalendar";
import { PRICE_GUIDE, RESULTS_VARY, SESSIONS_GUIDE } from "@/lib/constants";
import { SPOT_TYPES, type SpotTypeKey } from "@/lib/spot-types";
import { TREATMENT_NAME, TREATMENT_TAGLINE, WHY_HSA, pitchFor } from "@/lib/protocol-pitch";
import { EASE } from "@/lib/motion";

/**
 * The selling moment of the report: names the Signature Treatment as the doctors'
 * recommendation for THIS visitor's pigmentation, shows why a combined plan goes
 * further than any single treatment, and leads straight to booking. Only rendered
 * for strong/good candidates (the caller checks `shouldRecommend`).
 */
export function RecommendedTreatment({ spotType }: { spotType?: SpotTypeKey | null }) {
  const pitch = pitchFor(spotType);
  const typeName = spotType ? SPOT_TYPES[spotType].name : null;

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-peach/40 bg-gradient-to-b from-peach/[0.10] via-peach/[0.04] to-transparent p-6 shadow-soft sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-peach/15 blur-3xl" />

      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-peach">
        <Award size={14} /> Your recommended treatment · {TREATMENT_TAGLINE}
      </p>
      <h3 className="mt-3 font-serif text-[28px] leading-tight text-heading sm:text-[34px]">
        {TREATMENT_NAME}
      </h3>
      <p className="mt-1.5 text-sm font-medium text-peach">{pitch.subtitle}</p>
      <p className="mt-4 text-[15px] leading-relaxed text-body">{pitch.lead}</p>

      <p className="mt-7 text-xs font-semibold uppercase tracking-[0.14em] text-heading">
        Why it goes further than a single treatment
        {typeName ? ` for ${typeName.toLowerCase()}` : ""}
      </p>
      <div className="mt-3 grid gap-3">
        {pitch.comparisons.map((c, i) => (
          <motion.div
            key={c.alternative}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: 0.08 * i, duration: 0.5, ease: EASE }}
            className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:grid-cols-2 sm:gap-4"
          >
            <p className="flex items-start gap-2 text-[13.5px] leading-relaxed text-body/80">
              <X size={15} className="mt-0.5 shrink-0 text-body/50" />
              <span>
                <span className="font-semibold text-body">{c.alternative}</span>{" "}
                {c.limitation}
              </span>
            </p>
            <p className="flex items-start gap-2 text-[13.5px] leading-relaxed text-heading">
              <Check size={15} className="mt-0.5 shrink-0 text-peach" />
              <span>{c.ours}</span>
            </p>
          </motion.div>
        ))}
      </div>

      <ul className="mt-6 grid gap-2 sm:grid-cols-2">
        {WHY_HSA.map((w) => (
          <li key={w} className="flex items-start gap-2 text-[13.5px] leading-relaxed text-body">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-sage" />
            {w}
          </li>
        ))}
      </ul>

      <div className="mt-7 flex flex-col items-start gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-body">
          <span className="font-semibold text-heading">{PRICE_GUIDE.line}</span>
          {" · "}usually {SESSIONS_GUIDE.course}{" · "}flexible payment plans
        </p>
        <Button size="lg" onClick={scrollToBooking}>
          Book my free consultation <ArrowRight size={16} />
        </Button>
      </div>
      <p className="mt-3 text-[11.5px] leading-relaxed text-body/60">
        Your practitioner confirms your suitability, plan and number of sessions at your consultation. {RESULTS_VARY}
      </p>
    </div>
  );
}
