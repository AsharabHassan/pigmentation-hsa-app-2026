"use client";

import { CalendarHeart, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BOOKING_URL, CLINIC } from "@/lib/constants";

export function BookingCTA({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
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
