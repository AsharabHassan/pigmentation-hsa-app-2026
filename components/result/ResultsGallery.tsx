"use client";

import { motion } from "motion/react";
import { Sparkles, ImagePlus } from "lucide-react";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { EASE } from "@/lib/motion";
import { useClinicLocation } from "@/components/clinic/ClinicLocationContext";

// ─────────────────────────────────────────────────────────────────────────────
// Before/after gallery.
//
// The pairs in /public/results are the clinic team's own patients, used with
// their consent for advertising (confirmed by the clinic owner, 2026-09-19).
// Each is cropped to the treatment area. Add new cases to CASES below — never
// reuse imagery from another clinic.
//
// Both sliders share one frame size for a balanced grid; each photo is shown
// fully (object-contain) inside that frame, letterboxed where its native ratio
// differs from the frame.
// ─────────────────────────────────────────────────────────────────────────────
const FRAME_RATIO = "3 / 4";

interface Case {
  area: string;
  before: string;
  after: string;
}

// Populate with HSA's own consented cases, e.g.
// { area: "jawline and neck", before: "/results/neck-before.jpg", after: "/results/neck-after.jpg" }
const CASES: Case[] = [
  {
    area: "cheek and temple",
    before: "/results/cheek-profile-before.webp",
    after: "/results/cheek-profile-after.webp",
  },
  {
    area: "nose and upper lip",
    before: "/results/nose-upper-lip-before.webp",
    after: "/results/nose-upper-lip-after.webp",
  },
  {
    area: "cheek, close up",
    before: "/results/cheek-close-up-before.webp",
    after: "/results/cheek-close-up-after.webp",
  },
  {
    area: "cheek discolouration",
    before: "/results/cheek-redness-before.webp",
    after: "/results/cheek-redness-after.webp",
  },
];

/** `wide` is the landing-page layout: no built-in heading, four across on desktop. */
export function ResultsGallery({ wide = false }: { wide?: boolean } = {}) {
  const clinic = useClinicLocation();
  // An empty "results will appear here" box costs trust; show nothing instead.
  if (CASES.length === 0) return null;

  return (
    <div>
      {!wide && (
        <>
          <div className="flex items-center justify-center gap-2 text-center">
            <Sparkles size={14} className="text-peach" />
            <h3 className="font-serif text-xl text-heading">
              Real results, real patients
            </h3>
          </div>
          <p className="mx-auto mt-1 max-w-md text-center text-[13px] leading-relaxed text-body/80">
            Actual pigmentation results from our {clinic.city} team. Individual
            results vary — yours is confirmed at your consultation.
          </p>
        </>
      )}

      {CASES.length > 0 ? (
        <div
          className={
            wide
              ? "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
              : "mt-5 grid grid-cols-2 gap-3 sm:gap-5"
          }
        >
          {CASES.map((c, i) => (
            <motion.div
              key={c.area}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 * i, duration: 0.5, ease: EASE }}
            >
              <BeforeAfterSlider
                beforeSrc={c.before}
                afterSrc={c.after}
                area={c.area}
                ratio={FRAME_RATIO}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="mx-auto mt-5 flex max-w-md flex-col items-center gap-3 rounded-[1.5rem] border border-dashed border-peach/25 bg-white/[0.03] px-6 py-10 text-center">
          <ImagePlus size={26} className="text-peach" />
          <p className="text-sm font-medium text-heading">
            Before &amp; after gallery
          </p>
          <p className="max-w-xs text-[13px] leading-relaxed text-body/75">
            Consented patient results will appear here. Real outcomes are shared
            with you in person at your free consultation.
          </p>
        </div>
      )}
    </div>
  );
}
