"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ScanFace } from "lucide-react";
import { useWizard } from "@/store/wizard-store";
import {
  regionRect,
  toRegionKey,
  REGION_COPY,
  type RegionKey,
} from "@/lib/face-regions";
import { cropImage } from "@/lib/crop";
import { EASE } from "@/lib/motion";

// When Claude names no croppable zone, fall back to the two zones pigmentation
// shows most commonly so the user still gets a focused, on-device look.
const DEFAULT_REGIONS: RegionKey[] = ["cheeks", "forehead"];

interface Crop {
  region: RegionKey;
  src: string;
}

/**
 * Shows the user their OWN selfie, cropped to the facial zones the pigmentation
 * protocol targets, with a short "what it does here" line per zone. Everything is computed
 * on-device from the in-memory photo + landmarks. Renders nothing if we don't
 * have both (e.g. an uploaded photo with no detectable face) — the surrounding
 * result screen still shows the textual area chips and real-results gallery.
 */
export function AreaFocus() {
  const imageBase64 = useWizard((s) => s.imageBase64);
  const imageMediaType = useWizard((s) => s.imageMediaType);
  const landmarks = useWizard((s) => s.landmarks);
  const observedAreas = useWizard((s) => s.result?.narrative.observedAreas);

  const regions = useMemo(() => {
    const mapped = (observedAreas ?? [])
      .map(toRegionKey)
      .filter((r): r is RegionKey => r !== null);
    const unique = Array.from(new Set(mapped.length ? mapped : DEFAULT_REGIONS));
    return unique.slice(0, 3);
  }, [observedAreas]);

  const [crops, setCrops] = useState<Crop[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Yield first so state updates never run synchronously inside the effect.
      await Promise.resolve();
      if (!imageBase64 || !landmarks || regions.length === 0) {
        if (!cancelled) setCrops([]);
        return;
      }
      const out: Crop[] = [];
      for (const region of regions) {
        const rect = regionRect(region, landmarks);
        if (!rect) continue;
        const src = await cropImage(imageBase64, imageMediaType, rect);
        if (src) out.push({ region, src });
      }
      if (!cancelled) setCrops(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [imageBase64, imageMediaType, landmarks, regions]);

  if (crops.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-center gap-2 text-center">
        <ScanFace size={15} className="text-peach" />
        <h3 className="font-serif text-xl text-heading">
          The areas we focused on
        </h3>
      </div>
      <p className="mx-auto mt-1 max-w-md text-center text-[13px] leading-relaxed text-body/80">
        Taken from your own photo, on your device. A focused look at where the
        treatment could work for you — confirmed at your consultation.
      </p>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {crops.map((c, i) => {
          const copy = REGION_COPY[c.region];
          return (
            <motion.div
              key={c.region}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.5, ease: EASE }}
              className="overflow-hidden rounded-[1.5rem] border border-peach/20 bg-white/[0.04] shadow-soft"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/[0.04]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.src}
                  alt={`Your ${c.region}, a zone the treatment would target`}
                  className="h-full w-full object-cover"
                />
                {/* soft focus ring to draw the eye to the area */}
                <div className="pointer-events-none absolute inset-0 rounded-[1.5rem] ring-2 ring-inset ring-peach/40" />
                <span className="absolute left-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                  {copy.title}
                </span>
              </div>
              <p className="px-4 py-3 text-[13px] leading-relaxed text-body">
                {copy.blurb}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
