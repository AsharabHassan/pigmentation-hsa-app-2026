"use client";

import { motion } from "motion/react";
import { Star, Quote } from "lucide-react";
import { EASE } from "@/lib/motion";

// ─────────────────────────────────────────────────────────────────────────────
// PLACEHOLDER patient reviews. Replace every entry below with Harley Street
// Aesthetics' own verified reviews (e.g. from Google / Trustpilot) before
// go-live — do not ship sample copy as if it were real patient feedback.
// ─────────────────────────────────────────────────────────────────────────────

interface Testimonial {
  name: string;
  date: string;
  quote: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Sample Review",
    date: "Replace before go-live",
    quote:
      "From consultation to treatment the team were professional, reassuring and clearly highly skilled. Everything was explained properly and I felt in expert hands throughout.",
  },
  {
    name: "Sample Review",
    date: "Replace before go-live",
    quote:
      "A genuinely premium experience — the clinic is immaculate and the results have been natural and confidence-boosting. I'd recommend Harley Street Aesthetics to anyone.",
  },
  {
    name: "Sample Review",
    date: "Replace before go-live",
    quote:
      "My consultation was thorough and completely no-pressure. They took the time to understand my goals and recommended exactly the right treatment plan for me.",
  },
  {
    name: "Sample Review",
    date: "Replace before go-live",
    quote:
      "Outstanding care and attention to detail. The whole process felt safe, medical and tailored to me. Delighted with how subtle and natural the results look.",
  },
  {
    name: "Sample Review",
    date: "Replace before go-live",
    quote:
      "Friendly, knowledgeable and reassuring from start to finish. They answered all of my questions and I never felt rushed. A first-class aesthetic clinic.",
  },
  {
    name: "Sample Review",
    date: "Replace before go-live",
    quote:
      "Wonderful, professional service tailored to my individual needs. I felt looked after at every step and would happily return.",
  },
];

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Testimonials() {
  return (
    <div>
      <h3 className="text-center font-serif text-xl text-heading">
        What our patients say
      </h3>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <motion.figure
            key={t.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i, duration: 0.5, ease: EASE }}
            className="relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-soft"
          >
            <Quote
              size={28}
              className="absolute right-4 top-4 text-peach/30"
              aria-hidden
            />

            <div
              className="flex gap-0.5 text-peach"
              aria-label="Five out of five stars"
            >
              {Array.from({ length: 5 }).map((_, s) => (
                <Star key={s} size={14} fill="currentColor" strokeWidth={0} />
              ))}
            </div>

            <blockquote className="mt-3 flex-1 text-[13px] leading-relaxed text-body">
              “{t.quote}”
            </blockquote>

            <figcaption className="mt-4 flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-peach/30 bg-peach/15 text-xs font-semibold text-peach">
                {initials(t.name)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-heading">
                  {t.name}
                </span>
                <span className="block text-[11px] text-body/60">{t.date}</span>
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </div>
  );
}
