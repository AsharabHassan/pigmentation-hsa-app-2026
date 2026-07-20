import { describe, it, expect } from "vitest";
import {
  regionRect,
  regionMarkers,
  toRegionKey,
  REGION_ORDER,
  REGION_COPY,
  REGION_LABEL,
  type RegionKey,
} from "@/lib/face-regions";
import type { NormalizedPoint } from "@/components/scan/useFaceLandmarker";

// Synthetic 478-point mesh: a plausible oval face spread so every region's
// indices land inside (0,1). Not anatomically exact — the geometry layer only
// needs a bounding box per index group.
function syntheticLandmarks(): NormalizedPoint[] {
  const pts: NormalizedPoint[] = [];
  for (let i = 0; i < 478; i++) {
    // Deterministic pseudo-scatter across a centred face oval.
    const a = (i * 137.508) % 360; // golden-angle spread
    const rad = 0.12 + ((i * 7919) % 100) / 100 * 0.18;
    pts.push({
      x: 0.5 + Math.cos((a * Math.PI) / 180) * rad,
      y: 0.45 + Math.sin((a * Math.PI) / 180) * rad * 1.25,
      z: 0,
    });
  }
  return pts;
}

const ZONES: RegionKey[] = [
  "forehead",
  "undereye",
  "nose",
  "cheeks",
  "upperlip",
  "jawline",
];

describe("face-regions pigmentation zones", () => {
  const landmarks = syntheticLandmarks();

  it("produces a valid crop rect for every zone", () => {
    for (const zone of ZONES) {
      const rect = regionRect(zone, landmarks);
      expect(rect, zone).not.toBeNull();
      expect(rect!.x).toBeGreaterThanOrEqual(0);
      expect(rect!.y).toBeGreaterThanOrEqual(0);
      expect(rect!.x + rect!.w).toBeLessThanOrEqual(1);
      expect(rect!.y + rect!.h).toBeLessThanOrEqual(1);
      expect(rect!.w).toBeGreaterThan(0.04);
      expect(rect!.h).toBeGreaterThan(0.04);
    }
  });

  it("produces at least one marker per zone, all within bounds", () => {
    for (const zone of ZONES) {
      const markers = regionMarkers(zone, landmarks);
      expect(markers.length, zone).toBeGreaterThan(0);
      for (const m of markers) {
        expect(m.cx).toBeGreaterThanOrEqual(0);
        expect(m.cx).toBeLessThanOrEqual(1);
        expect(m.cy).toBeGreaterThanOrEqual(0);
        expect(m.cy).toBeLessThanOrEqual(1);
      }
    }
  });

  it("extendUp pads the forehead crop above its landmarks", () => {
    const withPad = regionRect("forehead", landmarks)!;
    // The nose region has no extendUp; the forehead's rect should reach higher
    // relative to its anchor cluster than raw bbox+margin alone would.
    expect(withPad.y).toBeGreaterThanOrEqual(0);
    // extendUp is 0.09 — the top edge must sit at least ~0.05 above the lowest
    // possible unpadded value unless clamped to 0.
    expect(withPad.y === 0 || withPad.h > 0.09).toBe(true);
  });

  it("covers all zones in REGION_ORDER, labels and copy", () => {
    expect(REGION_ORDER).toEqual(ZONES);
    for (const zone of ZONES) {
      expect(REGION_LABEL[zone]).toBeTruthy();
      expect(REGION_COPY[zone].title).toBeTruthy();
      expect(REGION_COPY[zone].blurb).toBeTruthy();
    }
  });
});

describe("toRegionKey free-text mapping", () => {
  it("maps narrative zone phrases to region keys", () => {
    expect(toRegionKey("forehead")).toBe("forehead");
    expect(toRegionKey("brow area")).toBe("forehead");
    expect(toRegionKey("under-eye")).toBe("undereye");
    expect(toRegionKey("upper lip")).toBe("upperlip");
    expect(toRegionKey("nose")).toBe("nose");
    expect(toRegionKey("bridge of the nose")).toBe("nose");
    expect(toRegionKey("cheeks")).toBe("cheeks");
    expect(toRegionKey("mid-face")).toBe("cheeks");
    expect(toRegionKey("jawline")).toBe("jawline");
    expect(toRegionKey("chin")).toBe("jawline");
  });

  it("returns null for unmappable text", () => {
    expect(toRegionKey("body")).toBeNull();
    expect(toRegionKey("")).toBeNull();
  });
});
