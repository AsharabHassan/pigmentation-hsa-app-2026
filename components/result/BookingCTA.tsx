"use client";

import { CalendarHeart, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BOOKING_URL, CLINIC } from "@/lib/constants";
import { newEventId, trackPixel } from "@/lib/meta-pixel";
import { useWizard } from "@/store/wizard-store";

export function BookingCTA({ label }: { label: string }) {
  const bucket = useWizard((s) => s.result?.bucket);

  // Meta: intent to book. The link opens a new tab, so the pixel has time to
  // send from this page without the navigation cutting the request short.
  function trackBookingClick() {
    trackPixel(
      "Schedule",
      {
        content_name: "Free Online Consultation",
        content_category: bucket,
      },
      newEventId(),
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <a
        href={BOOKING_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={trackBookingClick}
        className="w-full sm:w-auto"
      >
        <Button size="lg" className="w-full sm:w-auto">
          <CalendarHeart size={18} /> {label}
        </Button>
      </a>
      <a
        href={CLINIC.phoneHref}
        className="flex items-center gap-2 text-sm font-medium text-peach transition hover:text-peach-light"
      >
        <Phone size={14} /> Or call us on {CLINIC.phone}
      </a>
    </div>
  );
}
