"use client";

import { useEffect, useRef } from "react";
import {
  CalendarHeart,
  Check,
  Clock,
  ExternalLink,
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

/**
 * The free online consultation booking step. Bookings are taken on the
 * clinic's own CRM booking page (since the GoHighLevel cutover). That page
 * can't be embedded (the CRM sends X-Frame-Options: DENY and
 * frame-ancestors 'none') and reads no contact details from the link, so this
 * card opens it in a new tab and the report stays open behind it.
 */
export function BookingCalendar({ points: customPoints }: { points?: string[] } = {}) {
  const clinic = useClinicLocation();
  const lead = useWizard((s) => s.lead);
  const result = useWizard((s) => s.result);
  const sectionRef = useRef<HTMLElement>(null);
  const analysisId = result?.analysisId;

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

      <div className="mt-7 flex flex-col items-center px-5 sm:px-8">
        <a
          href={clinic.calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackInsight(analysisId, "cta_click", "calendar-direct")}
          className="inline-flex h-14 min-h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-peach-deep via-peach to-peach-light px-9 text-base font-semibold tracking-tight text-ink shadow-[0_14px_40px_-12px_rgba(212,175,55,0.7)] transition-colors duration-300 hover:from-peach hover:via-peach-light hover:to-peach focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach-deep focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:w-auto"
        >
          <CalendarHeart size={18} /> See available times
          <ExternalLink size={15} aria-hidden />
        </a>
        <p className="mt-3 max-w-sm text-center text-xs leading-relaxed text-body/75">
          Opens our secure booking page in a new tab — your report stays open
          here.
        </p>
      </div>

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
