"use client";

import { motion } from "motion/react";
import { BadgePoundSterling, Repeat } from "lucide-react";
import {
  PRICE_GUIDE,
  PROGRAMME_MECHANISM,
  PROGRAMME_PROMISE,
  PROTOCOL_STEPS,
  PROTOCOL_SUPPORT,
  RESULTS_VARY,
  SESSIONS_GUIDE,
} from "@/lib/constants";
import { SPOT_TYPES, type SpotTypeKey } from "@/lib/spot-types";
import { ProgrammeStory } from "@/components/result/ProgrammeStory";

/** With a pigmentation type, each step explains how it treats that type and why it works. */
export function WhatToExpect({ spotType }: { spotType?: SpotTypeKey | null }) {
  const type = spotType ? SPOT_TYPES[spotType] : null;
  return (
    <div>
      <h3 className="font-serif text-xl text-heading">
        {type
          ? `Your treatment plan for ${type.name.toLowerCase()}`
          : "Your treatment: the 3R Programme"}
      </h3>
      <p className="mt-2 text-[14px] font-medium leading-relaxed text-peach">
        {PROGRAMME_PROMISE}
      </p>
      <p className="mt-2 text-[14px] leading-relaxed text-body">{PROGRAMME_MECHANISM}</p>
      <ProgrammeStory className="mt-4" />
      {type && (
        <p className="mt-2 text-[14px] leading-relaxed text-body">
          How each step of our 3R Programme (Reduce, Regulate, Reverse) addresses your type of
          pigmentation, and why it helps.
        </p>
      )}
      <div className={type ? "mt-4 grid gap-3" : "mt-4 grid gap-3 sm:grid-cols-3"}>
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
            {type ? (
              <>
                <p className="mt-2 text-[13px] leading-relaxed text-body">
                  <span className="font-semibold text-heading">
                    How we address it:{" "}
                  </span>
                  {type.steps[i].how}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-body">
                  <span className="font-semibold text-heading">
                    Why it works:{" "}
                  </span>
                  {type.steps[i].why}
                </p>
              </>
            ) : (
              <p className="mt-1 text-[13px] leading-relaxed text-body">{p.blurb}</p>
            )}
          </motion.div>
        ))}
      </div>
      {type && (
        <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-[13px] leading-relaxed text-body">
          <span className="font-semibold text-heading">What to expect: </span>
          {type.outlook}
        </p>
      )}
      <p className="mt-3 text-[13px] leading-relaxed text-body/80">
        {PROTOCOL_SUPPORT}
      </p>
      <p className="mt-4 flex items-start gap-2 text-sm text-body">
        <Repeat size={16} className="mt-0.5 shrink-0 text-sage-deep" />
        <span>
          <span className="font-semibold text-heading">
            Usually {SESSIONS_GUIDE.course}.
          </span>{" "}
          <span className="text-body/70">{SESSIONS_GUIDE.note} {RESULTS_VARY}</span>
        </span>
      </p>
      <p className="mt-2 flex items-center gap-2 text-sm text-body">
        <BadgePoundSterling size={16} className="text-sage-deep" />
        <span>
          Our Signature Pigmentation Treatment is{" "}
          <span className="font-semibold text-heading">{PRICE_GUIDE.line}</span>.{" "}
          <span className="text-body/70">{PRICE_GUIDE.note}</span>
        </span>
      </p>
    </div>
  );
}
