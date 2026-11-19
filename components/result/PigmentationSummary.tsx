"use client";

import { motion } from "motion/react";
import { ScanFace } from "lucide-react";
import { SPOT_TYPES, type SpotTypeKey } from "@/lib/spot-types";
import { REGION_LABEL, toRegionKey, type RegionKey } from "@/lib/face-regions";
import { EASE } from "@/lib/motion";

/** Affected zones, most visible first. Falls back to Claude's observed areas. */
export function rankedZones(
  zoneSeverity: Partial<Record<string, number>> | undefined,
  observedAreas: string[] | undefined,
  zonesObscured: string[] | undefined,
): { region: RegionKey; severity: number | null }[] {
  const covered = new Set(zonesObscured ?? []);
  const fromSeverity = Object.entries(zoneSeverity ?? {})
    .filter(([z, v]) => typeof v === "number" && !covered.has(z))
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .map(([z, v]) => ({ region: z as RegionKey, severity: v as number }));
  if (fromSeverity.length) return fromSeverity;
  return (observedAreas ?? [])
    .map(toRegionKey)
    .filter((r): r is RegionKey => r !== null && !covered.has(r))
    .map((region) => ({ region, severity: null }));
}

/**
 * The top of the report: WHAT pigmentation this person has and WHERE it shows on
 * their face, most visible areas first — so everything below reads as being
 * about their pigmentation.
 */
export function PigmentationSummary({
  spotType,
  secondary,
  zoneSeverity,
  observedAreas,
  zonesObscured,
}: {
  spotType?: SpotTypeKey | null;
  secondary?: SpotTypeKey | null;
  zoneSeverity?: Partial<Record<string, number>>;
  observedAreas?: string[];
  zonesObscured?: string[];
}) {
  const type = spotType ? SPOT_TYPES[spotType] : null;
  const second = secondary ? SPOT_TYPES[secondary] : null;
  const zones = rankedZones(zoneSeverity, observedAreas, zonesObscured).slice(0, 4);

  return (
    <div className="rounded-[2rem] border border-peach/30 bg-white/[0.04] p-6 shadow-soft sm:p-7">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-peach">
        <ScanFace size={14} /> Your suggested pigmentation pattern
      </p>
      <h3 className="mt-2 font-serif text-[28px] leading-tight text-heading sm:text-[32px]">
        {type ? type.name : "Areas of uneven tone"}
      </h3>
      <p className="mt-1 text-sm text-peach">
        {type ? `Often called ${type.commonName}` : "Your practitioner confirms the exact type"}
        {second ? ` · with signs of ${second.name.toLowerCase()}` : ""}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-body">
        A visual pattern match from your photo, not a diagnosis. Your clinician
        reviews your history and skin to confirm the type and suitable next steps.
      </p>

      {zones.length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-body/70">
            Where it shows most
          </p>
          <div className="mt-3 grid gap-2.5">
            {zones.map((z, i) => (
              <div key={z.region}>
                <div className="flex items-center justify-between text-[13.5px]">
                  <span className="font-medium text-heading">{REGION_LABEL[z.region]}</span>
                  {z.severity !== null && <span className="text-peach">{z.severity}%</span>}
                </div>
                {z.severity !== null && (
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-peach-deep via-peach to-peach-light"
                      initial={{ width: 0 }}
                      animate={{ width: `${z.severity}%` }}
                      transition={{ duration: 0.9, ease: EASE, delay: 0.2 + i * 0.08 }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11.5px] text-body/60">
            Visibility of pigmentation in each area of your photo — an indication, not a measurement.
          </p>
        </div>
      )}
    </div>
  );
}
