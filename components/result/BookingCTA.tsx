"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CalendarHeart, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClinicLocation } from "@/components/clinic/ClinicLocationContext";
import { useWizard } from "@/store/wizard-store";
import { trackInsight } from "@/lib/visit-context";
import { BOOKING_ANCHOR_ID, scrollToBooking } from "./BookingCalendar";
import experienceStyles from "@/components/wizard/AnalysisExperience.module.css";

const subscribeToMount = () => () => {};

type Placement = "top" | "bottom" | "sticky";

function useBookingClick(placement: Placement) {
  const analysisId = useWizard((s) => s.result?.analysisId);
  return () => {
    trackInsight(analysisId, "cta_click", placement);
    scrollToBooking();
  };
}

export function BookingCTA({
  label,
  placement,
  showPhone = true,
}: {
  label: string;
  placement: Exclude<Placement, "sticky">;
  showPhone?: boolean;
}) {
  const clinic = useClinicLocation();
  const analysisId = useWizard((s) => s.result?.analysisId);
  const book = useBookingClick(placement);

  return (
    <div className="flex flex-col items-center gap-3">
      <Button size="lg" className="w-full sm:w-auto" onClick={book}>
        <CalendarHeart size={18} /> {label}
      </Button>
      {showPhone && (
        <a
          href={clinic.phoneHref}
          onClick={() => trackInsight(analysisId, "call_click", placement)}
          className="flex items-center gap-2 text-sm font-medium text-peach transition hover:text-peach-light"
        >
          <Phone size={14} /> Or call our {clinic.city} clinic on {clinic.phone}
        </a>
      )}
    </div>
  );
}

/** Phone-only bar that keeps booking one tap away until the calendar is on screen. */
export function StickyBookingBar({ label }: { label: string }) {
  const book = useBookingClick("sticky");
  const [calendarVisible, setCalendarVisible] = useState(false);
  const mounted = useSyncExternalStore(subscribeToMount, () => true, () => false);

  useEffect(() => {
    const target = document.getElementById(BOOKING_ANCHOR_ID);
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) =>
      setCalendarVisible(entries.some((entry) => entry.isIntersecting)),
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // Flag the body while the bar shows, so fixed UI (the cookie pill) can sit above it.
  const showing = mounted && !calendarVisible;
  useEffect(() => {
    if (!showing) return;
    document.body.dataset.stickyBooking = "";
    return () => {
      delete document.body.dataset.stickyBooking;
    };
  }, [showing]);

  if (!showing) return null;

  // The wizard's blur/transform animation creates a containing block for fixed
  // children. A portal keeps this bar anchored to the viewport while scrolling.
  return createPortal(
    <div role="region" aria-label="Mobile consultation booking" className={`${experienceStyles.experience} fixed inset-x-0 bottom-0 z-40 border-t border-peach/25 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_#00000015] sm:hidden`}>
      <Button size="lg" className="w-full px-4 text-sm" onClick={book}>
        <CalendarHeart size={18} /> {label}
      </Button>
    </div>,
    document.body,
  );
}
