"use client";

import { motion } from "motion/react";
import { BadgePoundSterling } from "lucide-react";
import { PRICE_GUIDE, PROTOCOL_STEPS, PROTOCOL_SUPPORT } from "@/lib/constants";

export function WhatToExpect() {
  return (
    <div>
      <h3 className="font-serif text-xl text-heading">
        Your treatment — three steps, one goal
      </h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {PROTOCOL_STEPS.map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i, duration: 0.5 }}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
          >
            <span className="font-serif text-lg text-peach">{p.step}</span>
            <p className="mt-3 text-sm font-semibold text-heading">{p.title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-body">{p.blurb}</p>
          </motion.div>
        ))}
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-body/80">
        {PROTOCOL_SUPPORT}
      </p>
      <p className="mt-4 flex items-center gap-2 text-sm text-body">
        <BadgePoundSterling size={16} className="text-sage-deep" />
        <span>
          Pigmentation removal at Harley Street Aesthetics from{" "}
          <span className="font-semibold text-heading">{PRICE_GUIDE.from}</span>.{" "}
          <span className="text-body/70">{PRICE_GUIDE.note}</span>
        </span>
      </p>
    </div>
  );
}
