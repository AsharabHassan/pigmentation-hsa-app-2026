"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

interface SuitabilityGaugeProps {
  score: number;
  accent: "peach" | "sage";
  label: string;
}

// Gold gradient for the strong/good buckets; a softer champagne for the
// consultation/alternative tones. Premium, not clinical.
const GRADIENTS: Record<"peach" | "sage", [string, string, string]> = {
  peach: ["#b8902a", "#e7c668", "#d4af37"],
  sage: ["#9a8f6a", "#d8caa1", "#c9b888"],
};

const R = 62;
const C = 2 * Math.PI * R;

/** A refined circular suitability dial — animated gold arc, serif score, soft glow. */
export function SuitabilityGauge({ score, accent }: SuitabilityGaugeProps) {
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const [c0, c1, c2] = GRADIENTS[accent];
  const [display, setDisplay] = useState(reduce ? score : 0);

  useEffect(() => {
    let raf = 0;
    const dur = reduce ? 0 : 1400;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = dur === 0 ? 1 : Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(score * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score, reduce]);

  return (
    <div className="relative grid h-48 w-48 place-items-center">
      {/* soft gold bloom */}
      <div
        aria-hidden
        className="absolute inset-6 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.18),transparent_70%)] blur-xl"
      />

      <svg viewBox="0 0 160 160" className="h-48 w-48">
        <defs>
          <linearGradient id={`sg-${accent}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={c0} />
            <stop offset="55%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>

        {/* faint concentric hairlines for depth */}
        <circle cx="80" cy="80" r="74" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
        <circle cx="80" cy="80" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

        {/* track */}
        <circle cx="80" cy="80" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4.5" />

        {/* progress arc */}
        <motion.circle
          cx="80"
          cy="80"
          r={R}
          fill="none"
          stroke={`url(#sg-${accent})`}
          strokeWidth="4.5"
          strokeLinecap="round"
          transform="rotate(-90 80 80)"
          strokeDasharray={C}
          initial={{ strokeDashoffset: reduce ? C * (1 - pct) : C }}
          animate={{ strokeDashoffset: C * (1 - pct) }}
          transition={{ duration: reduce ? 0 : 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
        />
      </svg>

      {/* centre readout */}
      <div className="absolute flex flex-col items-center">
        <span className="font-serif text-[3.4rem] leading-none text-heading">
          {Math.round(display)}
        </span>
        <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.34em] text-peach">
          Suitability
        </span>
      </div>
    </div>
  );
}
