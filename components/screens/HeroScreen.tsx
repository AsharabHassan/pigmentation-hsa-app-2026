"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWizard } from "@/store/wizard-store";
import { EASE } from "@/lib/motion";
import { useLightFx } from "@/lib/use-light-fx";

export function HeroScreen() {
  const start = useWizard((s) => s.start);

  return (
    <section className="relative mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
      <AuroraOrb />

      <motion.span
        initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
        className="relative z-10 inline-flex items-center gap-2 rounded-full border border-peach/35 bg-white/[0.04] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-peach shadow-[0_8px_30px_-12px_rgba(212,175,55,0.5)] backdrop-blur-md"
      >
        <Sparkles size={13} /> AI pigmentation analysis
      </motion.span>

      <h1 className="relative z-10 mt-8 font-serif text-[46px] leading-[1.02] tracking-tight text-heading sm:text-[68px]">
        <Line delay={0.35}>Say goodbye to</Line>
        <Line delay={0.5}>
          <span className="italic text-peach">pigmentation</span>
        </Line>
      </h1>

      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.85 }}
        className="relative z-10 mt-7 max-w-md text-lg leading-relaxed text-body"
      >
        Take a photo and our AI maps the dark spots and uneven tone across your
        face in seconds — a doctor-led guide to our Signature Pigmentation
        Removal Treatment at Harley Street Aesthetics. No pressure, just
        clarity.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE, delay: 1.0 }}
        className="relative z-10 mt-10 flex flex-col items-center gap-5"
      >
        <Button size="lg" onClick={start} className="px-10">
          Begin your analysis
          <ArrowRight size={18} />
        </Button>
        <div className="flex items-center gap-3 text-[13px] font-medium text-heading/55">
          <span>60 seconds</span>
          <Dot />
          <span>Private</span>
          <Dot />
          <span>Doctor-led</span>
        </div>
      </motion.div>
    </section>
  );
}

function Line({ children, delay }: { children: ReactNode; delay: number }) {
  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <motion.span
        className="block"
        initial={{ y: "110%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 1.0, ease: EASE, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function Dot() {
  return <span className="h-1 w-1 rounded-full bg-peach-deep/50" />;
}

/** Premium "AI analysis" centerpiece behind the headline: concentric rings, a
 *  slowly rotating conic scan-arc, and a soft pulsing glow. */
function AuroraOrb() {
  const reduce = useLightFx();
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2"
    >
      {/* soft core glow */}
      <motion.div
        className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.4),transparent_65%)] blur-2xl"
        animate={reduce ? undefined : { scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* concentric rings */}
      {[0, 0.12, 0.24, 0.36].map((inset, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-sage/20"
          style={{ inset: `${inset * 100}%` }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: EASE, delay: 0.3 + i * 0.12 }}
        />
      ))}
      {/* rotating conic scan-arc */}
      {!reduce && (
        <motion.div
          className="absolute inset-[6%] rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgba(212,175,55,0.6) 40deg, transparent 120deg)",
            WebkitMask:
              "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
        />
      )}
    </div>
  );
}
