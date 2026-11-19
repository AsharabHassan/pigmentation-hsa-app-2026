"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarHeart,
  Check,
  Clock,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Video,
} from "lucide-react";
import { useWizard } from "@/store/wizard-store";
import { useClinicLocation } from "@/components/clinic/ClinicLocationContext";
import { AREA_LABELS } from "@/lib/constants";
import { topZone } from "@/lib/insights";
import { trackInsight } from "@/lib/visit-context";

export const BOOKING_ANCHOR_ID = "book";

/** Smooth-scroll to the booking card from any booking button. */
export function scrollToBooking(): void {
  const calendar = document.getElementById(BOOKING_ANCHOR_ID);
  if (!calendar) return;
  calendar.scrollIntoView({ behavior: "smooth", block: "start" });
  calendar.focus({ preventScroll: true });
}

const FRAME_ID = "hsa-consultation-calendar";

/**
 * The free online consultation booking step: the clinic's own CRM booking page
 * (since the GoHighLevel cutover), embedded in the result page. The page sends
 * no resize messages, so the frame has a fixed height and scrolls inside. It
 * reads no contact details from the link, so nothing is prefilled. A plain
 * link under the frame opens the same page in a new tab.
 */
export function BookingCalendar({ points: customPoints }: { points?: string[] } = {}) {
  const clinic = useClinicLocation();
  const lead = useWizard((s) => s.lead);
  const result = useWizard((s) => s.result);
  const sectionRef = useRef<HTMLElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [stalled, setStalled] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const analysisId = result?.analysisId;

  // Only a load event that hasn't come within 12 s counts as stalled.
  useEffect(() => {
    if (loaded) return;
    const timer = window.setTimeout(() => setStalled(true), 12_000);
    return () => window.clearTimeout(timer);
  }, [loaded, attempt]);

  function retry() {
    setLoaded(false);
    setStalled(false);
    setAttempt((value) => value + 1);
  }

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          trackInsight(analysisId, "calendar_viewed");
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [analysisId]);

  const top = result ? topZone(result) : null;
  const focus = top ? AREA_LABELS[top.zone] : null;
  const points = customPoints ?? [
    focus
      ? `A practitioner reviews your report before the call, starting with your ${focus}`
      : "A practitioner reviews your report before the call",
    "You leave with your exact plan and price",
    "No obligation — it's a conversation, not a commitment",
  ];
  const facts = [
    { icon: Clock, label: "15 minutes" },
    { icon: Video, label: "Online call" },
    { icon: ShieldCheck, label: "Free" },
  ];

  return (
    <section
      ref={sectionRef}
      id={BOOKING_ANCHOR_ID}
      tabIndex={-1}
      aria-label="Book your free consultation"
      className="scroll-mt-24 overflow-hidden rounded-[2rem] border border-peach/35 bg-gradient-to-b from-peach/[0.09] via-white/[0.03] to-white/[0.02] shadow-[0_30px_80px_-40px_rgba(212,175,55,0.55)]"
    >
      <div className="px-5 pt-7 text-center sm:px-8 sm:pt-9">
        <span className="inline-flex items-center gap-2 rounded-full border border-peach/30 bg-peach/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-peach">
          <CalendarHeart size={13} /> Your next step
        </span>
        <h3 className="mt-4 font-serif text-[28px] leading-tight text-heading sm:text-[34px]">
          {lead?.firstName ? `${lead.firstName}, choose` : "Choose"} your
          consultation time
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-body">
          A free online consultation with our doctor-led {clinic.city} team.
        </p>

        <div className="mx-auto mt-5 grid max-w-sm grid-cols-3 divide-x divide-peach/20 rounded-2xl border border-peach/20 bg-black/30">
          {facts.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 px-2 py-3"
            >
              <Icon size={16} className="text-peach" />
              <span className="text-xs font-semibold text-heading">
                {label}
              </span>
            </div>
          ))}
        </div>

        <ul className="mx-auto mt-5 max-w-md space-y-2 text-left">
          {points.map((point) => (
            <li
              key={point}
              className="flex items-start gap-2.5 text-sm leading-relaxed text-body"
            >
              <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-peach/15">
                <Check size={11} strokeWidth={3} className="text-peach" />
              </span>
              {point}
            </li>
          ))}
        </ul>

      </div>

      <div className="mt-7 px-2 pb-2 sm:px-3 sm:pb-3">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-white ring-1 ring-peach/40">
          <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] bg-[#faf7ef] px-4 py-2.5">
            <span className="flex items-center gap-2 text-xs font-semibold text-[#1c1a16]">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#b8902a]" />
              </span>
              {loaded ? "Live availability" : "Consultation calendar"}
            </span>
          </div>

          {!loaded && (
            <div
              role="status"
              className="absolute inset-x-0 bottom-0 top-[41px] z-10 flex flex-col items-center justify-center gap-3 bg-white px-6 text-center"
            >
              {!stalled && <Loader2 size={22} className="animate-spin text-[#b8902a]" />}
              <span className="text-xs font-medium text-[#5c5852]">
                {stalled ? "The calendar is taking a while to load. Try loading it again." : "Loading available times…"}
              </span>
              {stalled && <button type="button" onClick={retry} className="min-h-11 rounded-full border border-[#b8902a] px-5 text-sm font-semibold text-[#715320]">Retry calendar</button>}
            </div>
          )}

          <iframe
            key={attempt}
            src={clinic.calendarUrl}
            id={FRAME_ID}
            title="Choose your free online consultation time"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
            onLoad={() => setLoaded(true)}
            className="block h-[1100px] w-full border-0 sm:h-[900px]"
          />
        </div>
      </div>

      <p className="px-6 pt-3 text-center text-xs text-body">
        Calendar not showing?{" "}
        <a
          href={clinic.calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackInsight(analysisId, "cta_click", "calendar-direct")}
          className="inline-flex items-center gap-1 font-semibold text-peach underline"
        >
          Open the booking page <ExternalLink size={12} aria-hidden />
        </a>
      </p>

      <p className="px-6 pb-6 pt-3 text-center text-xs leading-relaxed text-body/65">
        Your confirmation arrives by email. Need to change it later? Call{" "}
        <a href={clinic.phoneHref} className="font-medium text-peach">
          {clinic.phone}
        </a>
        .
      </p>
    </section>
  );
}
