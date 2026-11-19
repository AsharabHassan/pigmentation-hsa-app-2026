"use client";

import { Microscope } from "lucide-react";
import { SPOT_TYPES, type SpotTypeKey } from "@/lib/spot-types";

/** Names the kind of pigmentation the photo appears consistent with, and why it forms. */
export function SpotTypeCard({
  primary,
  secondary,
}: {
  primary: SpotTypeKey;
  secondary?: SpotTypeKey | null;
}) {
  const type = SPOT_TYPES[primary];
  const second = secondary ? SPOT_TYPES[secondary] : null;

  return (
    <div className="rounded-[2rem] border border-peach/25 bg-peach/[0.05] p-7 shadow-soft">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-peach">
        <Microscope size={14} /> Your pigmentation type
      </p>
      <p className="mt-3 text-[13px] text-body/80">
        Your photo appears most consistent with
      </p>
      <h3 className="mt-1 font-serif text-[26px] leading-tight text-heading sm:text-[30px]">
        {type.name}
      </h3>
      <p className="mt-1 text-sm text-peach">
        Often called {type.commonName}
      </p>

      <dl className="mt-5 space-y-4 text-[14px] leading-relaxed">
        <div>
          <dt className="font-semibold text-heading">What it is</dt>
          <dd className="mt-1 text-body">{type.what}</dd>
        </div>
        <div>
          <dt className="font-semibold text-heading">What causes it</dt>
          <dd className="mt-1 text-body">{type.cause}</dd>
        </div>
      </dl>

      {second && (
        <p className="mt-5 border-t border-white/10 pt-4 text-[14px] leading-relaxed text-body">
          <span className="font-semibold text-heading">
            Also showing signs of {second.name}
          </span>{" "}
          ({second.commonName}). {second.what} Your plan below is built around
          your main type, and your practitioner will tailor it to cover both.
        </p>
      )}

      <p className="mt-5 text-xs leading-relaxed text-body/70">
        An indication from a single photo, not a diagnosis — your practitioner
        confirms your pigmentation type at your free online consultation.
      </p>
    </div>
  );
}
