"use client";

import { useEffect, useState } from "react";
import { CalendarHeart, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClinicLocation } from "@/components/clinic/ClinicLocationContext";
import { useWizard } from "@/store/wizard-store";
import { trackInsight } from "@/lib/visit-context";
import { BOOKING_ANCHOR_ID, scrollToBooking } from "./BookingCalendar";

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

  useEffect(() => {
    const target = document.getElementById(BOOKING_ANCHOR_ID);
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) =>
      setCalendarVisible(entries.some((entry) => entry.isIntersecting)),
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  if (calendarVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-peach/25 bg-[#090909]/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:hidden">
      <Button size="lg" className="w-full" onClick={book}>
        <CalendarHeart size={18} /> {label}
      </Button>
    </div>
  );
}
