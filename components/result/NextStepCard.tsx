"use client";

import { CalendarHeart, Check, Lock, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClinicLocation } from "@/components/clinic/ClinicLocationContext";
import { useWizard } from "@/store/wizard-store";
import { trackInsight } from "@/lib/visit-context";
import { JOURNEY } from "@/lib/consultation-journey";
import { SPOT_TYPES } from "@/lib/spot-types";
import { scrollToBooking } from "./BookingCalendar";
import { CALLBACK_PROMISE } from "@/lib/consultation-consent";

/**
 * Top-of-result framing: names the condition the report identified, then makes
 * the consultation the obvious next step (2 of 4 done), so clients don't treat
 * the report as the end of the journey.
 */
export function NextStepCard() {
  const clinic = useClinicLocation();
  const analysisId = useWizard((s) => s.result?.analysisId);
  const spotType = useWizard((s) => (s.result?.usedPhoto ? s.result.spotType : null));
  // Lead with the condition the scan identified — the report's core value.
  const finding = spotType
    ? `${SPOT_TYPES[spotType].name.toLowerCase()} (${SPOT_TYPES[spotType].commonName})`
    : null;
  const book = () => {
    trackInsight(analysisId, "cta_click", "next_step");
    scrollToBooking();
  };

  return (
    <section
      aria-label="Your next step"
      className="overflow-hidden rounded-[2rem] border border-peach/40 bg-white/[0.04] shadow-soft"
    >
      <div className="border-b border-peach/20 bg-peach/[0.08] px-6 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-peach">
        Step 2 of 4 complete · Your findings are ready
      </div>

      <div className="p-6 sm:p-7">
        <h3 className="font-serif text-[26px] leading-tight text-heading sm:text-[30px]">
          {finding ? (
            <>
              Your report has identified{" "}
              <span className="text-peach">{finding}</span>. Now let&rsquo;s
              treat it.
            </>
          ) : (
            <>Your report is ready. Now let&rsquo;s turn it into results.</>
          )}
        </h3>
        <p className="mt-3 text-[15px] leading-relaxed text-body">
          Your report names what&rsquo;s showing in your skin and maps where
          it sits and how strongly. In your free 15-minute online
          consultation, our doctor-led {clinic.city}{" "}team builds your
          treatment plan around these findings &mdash; going through the
          detail with you, checking what is safe for your skin and history,
          and giving you a clear programme and price.
        </p>

        <ol className="mt-6 grid gap-3 sm:grid-cols-4 sm:gap-2">
          {JOURNEY.map((stage, i) => {
            const done = i < 2;
            const next = i === 2;
            return (
              <li
                key={stage.key}
                className={`flex items-start gap-3 rounded-2xl border px-3 py-3 sm:flex-col sm:gap-2 ${
                  next
                    ? "border-peach bg-peach/[0.10]"
                    : "border-sage/20 bg-transparent"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    done
                      ? "bg-peach text-white"
                      : next
                        ? "border border-peach text-peach"
                        : "border border-sage/40 text-heading/50"
                  }`}
                >
                  {done ? <Check size={12} strokeWidth={3} /> : i < 3 ? i + 1 : <Lock size={11} />}
                </span>
                <span>
                  <span className={`block text-[13px] font-semibold ${next ? "text-heading" : "text-heading/70"}`}>
                    {stage.label}
                    {next && <span className="ml-1.5 text-peach">← you&rsquo;re here</span>}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-body/80">{stage.detail}</span>
                </span>
              </li>
            );
          })}
        </ol>

        <div className="mt-6 flex flex-col items-center gap-2">
          <Button size="lg" className="w-full sm:w-auto" onClick={book}>
            <CalendarHeart size={18} /> Book my free consultation
          </Button>
          <p className="text-xs text-body/70">Free · 15 minutes online · No obligation to go ahead</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-sage/25 bg-sage/[0.06] p-4 sm:flex-row sm:items-center">
          <PhoneCall size={20} className="shrink-0 text-peach" />
          <p className="flex-1 text-sm leading-relaxed text-body">
            <span className="font-semibold text-heading">Expect our call {CALLBACK_PROMISE}</span>{" "}
            &mdash; if you haven&rsquo;t booked yet, we&rsquo;ll go through your report
            and find a time that suits you.
          </p>
        </div>
      </div>
    </section>
  );
}
