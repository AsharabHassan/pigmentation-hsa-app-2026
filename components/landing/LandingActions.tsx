"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, CalendarHeart, ScanFace } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BOOKING_ANCHOR_ID,
  scrollToBooking,
} from "@/components/result/BookingCalendar";

const primary =
  "inline-flex h-14 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-peach-deep via-peach to-peach-light px-7 text-[15px] font-semibold text-ink shadow-[0_14px_40px_-12px_rgba(212,175,55,0.7)] transition hover:from-peach hover:via-peach-light hover:to-peach";
const secondary =
  "inline-flex h-14 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-peach/50 px-7 text-[15px] font-medium text-heading transition hover:border-peach hover:bg-peach/10";

/**
 * Build the analyzer URL at click time so the ad's campaign tags and click ids
 * (utm_*, gclid, fbclid…) travel with the visitor, plus ?lp= so the insights
 * database credits this landing page. A plain href keeps it crawlable.
 */
function analysisHref(analysisPath: string, landingId: string): string {
  const params = new URLSearchParams(window.location.search);
  params.set("lp", landingId);
  return `${analysisPath}?${params.toString()}`;
}

export function StartAnalysisLink({
  analysisPath,
  landingId,
  className,
  children,
}: {
  analysisPath: string;
  landingId: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <a
      href={analysisPath}
      onClick={(event) => {
        event.preventDefault();
        window.location.assign(analysisHref(analysisPath, landingId));
      }}
      className={cn(primary, className)}
    >
      {children ?? (
        <>
          <ScanFace size={19} /> Start my free AI analysis
          <ArrowRight size={17} />
        </>
      )}
    </a>
  );
}

export function BookConsultationButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={scrollToBooking}
      className={cn(secondary, className)}
    >
      <CalendarHeart size={18} /> Book free online consultation
    </button>
  );
}

/** Phone-only bar: the primary action stays one tap away down the whole page. */
export function LandingStickyBar({
  analysisPath,
  landingId,
}: {
  analysisPath: string;
  landingId: string;
}) {
  const [show, setShow] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const target = document.getElementById(BOOKING_ANCHOR_ID);
    let observer: IntersectionObserver | undefined;
    if (target && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver((entries) =>
        setCalendarVisible(entries.some((entry) => entry.isIntersecting)),
      );
      observer.observe(target);
    }
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer?.disconnect();
    };
  }, []);

  if (!show || calendarVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-peach/25 bg-[#090909]/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:hidden">
      <StartAnalysisLink
        analysisPath={analysisPath}
        landingId={landingId}
        className="h-12 flex-1 px-4 text-sm"
      >
        <ScanFace size={17} /> Free AI analysis
      </StartAnalysisLink>
      <button
        type="button"
        onClick={scrollToBooking}
        aria-label="Book free online consultation"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-peach/50 text-peach"
      >
        <CalendarHeart size={19} />
      </button>
    </div>
  );
}
