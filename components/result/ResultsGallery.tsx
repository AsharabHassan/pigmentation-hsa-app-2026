"use client";

import { motion } from "motion/react";
import { Sparkles, ImagePlus } from "lucide-react";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { EASE } from "@/lib/motion";

// ─────────────────────────────────────────────────────────────────────────────
// Before/after gallery.
//
// PLACEHOLDER: this ships with NO patient images. Before go-live, drop Harley
// Street Aesthetics' own consented pigmentation before/after pairs into
// /public/results and populate the CASES array below — each photo cropped to the
// treatment area only, with documented patient consent. Do not reuse imagery
// from any other clinic.
//
// Both sliders share one frame size for a balanced grid; each photo is shown
// fully (object-contain) inside that frame, letterboxed where its native ratio
// differs from the frame.
// ─────────────────────────────────────────────────────────────────────────────
const FRAME_RATIO = "4 / 3";

interface Case {
  area: string;
  before: string;
  after: string;
}

// Populate with HSA's own consented cases, e.g.
// { area: "jawline and neck", before: "/results/neck-before.jpg", after: "/results/neck-after.jpg" }
const CASES: Case[] = [];

export function ResultsGallery() {
  return (
    <div>
      <div className="flex items-center justify-center gap-2 text-center">
        <Sparkles size={14} className="text-peach" />
        <h3 className="font-serif text-xl text-heading">
          Real results, real patients
        </h3>
      </div>
      <p className="mx-auto mt-1 max-w-md text-center text-[13px] leading-relaxed text-body/80">
        Actual pigmentation results from our Harley Street team. Individual
        results vary — yours is confirmed at your consultation.
      </p>

      {CASES.length > 0 ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
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
