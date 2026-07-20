"use client";

import { motion } from "motion/react";
import type { Step } from "@/store/wizard-store";

const ORDER: Step[] = ["consent", "scan", "lead", "result"];

export function ProgressRail({ step }: { step: Step }) {
  const activeIndex = ORDER.indexOf(step);
  if (activeIndex < 0) return null;

  return (
    <div className="flex items-center gap-2" aria-hidden>
      {ORDER.map((s, i) => {
        const filled = i <= activeIndex;
        return (
          <div
            key={s}
            className="relative h-[3px] w-7 overflow-hidden rounded-full bg-sage/20 sm:w-10"
          >
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-peach to-peach-deep"
              initial={false}
              animate={{ width: filled ? "100%" : "0%" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        );
      })}
    </div>
  );
}
