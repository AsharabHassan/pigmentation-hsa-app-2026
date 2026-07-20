import type { NormalizedPoint } from "@/components/scan/useFaceLandmarker";

// ─────────────────────────────────────────────────────────────────────────────
// Maps the on-device MediaPipe 478-point face mesh to the facial zones the
// pigmentation protocol treats, and turns each into a normalized crop rectangle
// and an overlay ellipse/centre for the premium pigmentation map. Presentational
// only — it gives the user a focused look at their OWN zones; not a clinical
// measurement.
// ─────────────────────────────────────────────────────────────────────────────

export type RegionKey =
  | "forehead"
  | "undereye"
  | "nose"
  | "cheeks"
  | "upperlip"
  | "jawline";

/** A crop rectangle in normalized (0–1) image coordinates. */
export interface NormRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A highlight ellipse in normalized (0–1) image coordinates. */
export interface NormEllipse {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

interface RegionConfig {
  /** Landmark indices whose bounding box approximates the region (for the CROP). */
  indices: number[];
  /**
   * Tight landmark subset whose centre anchors the on-face MARKER. Distinct from
   * `indices` so each marker sits on its own area and they don't all collapse
   * onto the mid-face centroid. Falls back to `indices` when omitted.
   */
  anchorIndices?: number[];
  /** Fraction of the bbox size padded on every side for the CROP. */
  margin: number;
  /** Extra fraction of image height added BELOW the bbox. */
  extendDown?: number;
  /** Extra fraction of image height added ABOVE the bbox (the mesh stops mid-forehead). */
  extendUp?: number;
  /** Multiplier applied to the anchor half-extent for the overlay ELLIPSE. */
  ellipseScale?: number;
}

// Approximate MediaPipe FaceMesh indices per zone. Exact contours aren't
// needed — a padded bounding box reads well as a focused crop, and its centre
// drives the on-face marker.
const REGIONS: Record<RegionKey, RegionConfig> = {
  forehead: {
    // Upper face-oval + brow line. The mesh's top landmark (10) sits mid-forehead,
    // so extendUp pads the crop toward the hairline.
    indices: [
      10, 338, 297, 332, 284, 251, 109, 67, 103, 54, 21, 151, 9, 8, 107, 336,
      105, 334, 70, 300, 46, 276,
    ],
    anchorIndices: [10, 151, 9, 107, 336, 67, 297],
    margin: 0.14,
    extendUp: 0.09,
    ellipseScale: 0.85,
  },
  undereye: {
    // Lower lids + tear-trough of both eyes → a band beneath the eyes.
    indices: [
      33, 7, 163, 144, 145, 153, 154, 155, 133, 117, 118, 119, 120, 121, 47,
      263, 249, 390, 373, 374, 380, 381, 382, 362, 346, 347, 348, 349, 350, 277,
    ],
    anchorIndices: [117, 119, 346, 348, 229, 449, 33, 263],
    margin: 0.22,
    ellipseScale: 0.85,
  },
  nose: {
    // Bridge, tip and alae — a frequent site of sun-related spots.
    indices: [
      168, 6, 197, 195, 5, 4, 1, 2, 98, 327, 129, 358, 115, 344, 48, 278, 220,
      440,
    ],
    anchorIndices: [6, 197, 195, 5, 4, 1],
    margin: 0.22,
    ellipseScale: 0.85,
  },
  cheeks: {
    indices: [
      234, 93, 132, 58, 205, 187, 123, 117, 118, 101, 100, 454, 323, 361, 288,
      425, 411, 352, 346, 347, 330, 329,
    ],
    anchorIndices: [205, 425, 101, 330, 36, 266, 50, 280],
    margin: 0.12,
    ellipseScale: 0.8,
  },
  upperlip: {
    // Between the nose base and the upper lip — the classic pigmentation band.
    indices: [
      2, 164, 167, 393, 92, 322, 165, 391, 61, 291, 40, 270, 37, 267, 0, 39,
      269,
    ],
    anchorIndices: [164, 167, 393, 0, 37, 267],
    margin: 0.28,
    ellipseScale: 0.9,
  },
  jawline: {
    indices: [
      234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 378, 379, 365,
      397, 288, 361, 323, 454,
    ],
    anchorIndices: [172, 136, 150, 149, 397, 365, 379, 378, 176, 400],
    margin: 0.16,
    ellipseScale: 0.85,
  },
};

// Per-side marker anchor groups. Bilateral zones (under-eye, cheeks, jawline,
// forehead sides) get a marker on EACH side so they sit on the actual feature
// instead of collapsing onto the central nose line; nose and upper-lip are a
// single central marker. Every marker for a zone shares that zone's number +
// card.
const REGION_MARKERS: Record<RegionKey, number[][]> = {
  forehead: [
    [109, 67, 103, 69, 66, 107], // right brow-to-mid-forehead
    [338, 297, 332, 299, 296, 336], // left brow-to-mid-forehead
  ],
  undereye: [
    [117, 118, 119, 120, 121, 100], // right under-eye
    [346, 347, 348, 349, 350, 329], // left under-eye
  ],
  nose: [[6, 197, 195, 5, 4, 1]], // central bridge-to-tip
  cheeks: [
    [205, 50, 123, 187, 36, 142], // right cheek
    [425, 280, 352, 411, 266, 371], // left cheek
  ],
  upperlip: [[164, 167, 393, 0, 37, 267]], // central, above the lip
  jawline: [
    [136, 150, 149, 172, 176, 148], // right jaw
    [365, 379, 378, 397, 400, 377], // left jaw
  ],
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function rawBBox(indices: number[], landmarks: NormalizedPoint[]): BBox | null {
  const pts = indices.map((i) => landmarks[i]).filter(Boolean);
  if (pts.length < 3) return null;
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}

/** Compute the normalized crop rect for a region, or null if unavailable. */
export function regionRect(
  region: RegionKey,
  landmarks: NormalizedPoint[],
): NormRect | null {
  const cfg = REGIONS[region];
  const bb = rawBBox(cfg.indices, landmarks);
  if (!bb) return null;
  let { minX, minY, maxX, maxY } = bb;

  const mw = (maxX - minX) * cfg.margin;
  const mh = (maxY - minY) * cfg.margin;
  minX -= mw;
  maxX += mw;
  minY -= mh;
  maxY += mh;
  if (cfg.extendDown) maxY += cfg.extendDown;
  if (cfg.extendUp) minY -= cfg.extendUp;

  minX = clamp01(minX);
  minY = clamp01(minY);
  maxX = clamp01(maxX);
  maxY = clamp01(maxY);

  const w = maxX - minX;
  const h = maxY - minY;
  if (w < 0.04 || h < 0.04) return null; // too small to be meaningful
  return { x: minX, y: minY, w, h };
}

/**
 * Compute the normalized overlay ellipse (centre + radii) for a region's
 * marker. Anchored on a tight landmark subset and kept compact so the markers
 * read as precise points on each area rather than overlapping blobs.
 */
export function regionEllipse(
  region: RegionKey,
  landmarks: NormalizedPoint[],
): NormEllipse | null {
  const cfg = REGIONS[region];
  const bb = rawBBox(cfg.anchorIndices ?? cfg.indices, landmarks);
  if (!bb) return null;
  const scale = cfg.ellipseScale ?? 1;
  const cx = (bb.minX + bb.maxX) / 2;
  let cy = (bb.minY + bb.maxY) / 2;
  let rx = ((bb.maxX - bb.minX) / 2) * scale;
  let ry = ((bb.maxY - bb.minY) / 2) * scale;
  // For regions that extend beyond the mesh, nudge the marker toward the pad.
  if (cfg.extendDown) {
    cy += cfg.extendDown / 2;
    ry += cfg.extendDown / 2;
  }
  if (cfg.extendUp) {
    cy -= cfg.extendUp / 2;
    ry += cfg.extendUp / 2;
  }
  // Compact, consistent marker size — never a face-swallowing blob.
  rx = Math.min(0.1, Math.max(0.04, rx));
  ry = Math.min(0.06, Math.max(0.03, ry));
  return { cx: clamp01(cx), cy: clamp01(cy), rx, ry };
}

/**
 * Compute the on-face MARKER ellipses for a region — one per anatomical side
 * (so bilateral zones sit on each eye/cheek/jaw instead of the central nose
 * line), or a single central marker for nose/upper-lip. Each is kept compact.
 */
export function regionMarkers(
  region: RegionKey,
  landmarks: NormalizedPoint[],
): NormEllipse[] {
  const cfg = REGIONS[region];
  const out: NormEllipse[] = [];
  for (const group of REGION_MARKERS[region]) {
    const bb = rawBBox(group, landmarks);
    if (!bb) continue;
    const cx = (bb.minX + bb.maxX) / 2;
    let cy = (bb.minY + bb.maxY) / 2;
    let rx = ((bb.maxX - bb.minX) / 2) * 1.3 + 0.012;
    let ry = ((bb.maxY - bb.minY) / 2) * 1.3 + 0.012;
    if (cfg.extendDown) {
      cy += cfg.extendDown / 2;
      ry += cfg.extendDown / 2;
    }
    if (cfg.extendUp) {
      cy -= cfg.extendUp / 2;
      ry += cfg.extendUp / 2;
    }
    rx = Math.min(0.085, Math.max(0.035, rx));
    ry = Math.min(0.055, Math.max(0.028, ry));
    out.push({ cx: clamp01(cx), cy: clamp01(cy), rx, ry });
  }
  return out;
}

/**
 * Estimate which side of the face is toward the camera, from how much cheek is
 * visible on each side of the nose. On a turned (3/4 or profile) photo the
 * far-side bilateral markers bunch up and float, so the map shows only the
 * visible-side marker per area; a roughly front-facing photo returns "both".
 */
export function faceVisibleSide(
  landmarks: NormalizedPoint[],
): "left" | "right" | "both" {
  const nose = landmarks[1];
  const leftEdge = landmarks[234]; // image-left cheek extreme
  const rightEdge = landmarks[454]; // image-right cheek extreme
  if (!nose || !leftEdge || !rightEdge) return "both";
  const leftGap = nose.x - leftEdge.x;
  const rightGap = rightEdge.x - nose.x;
  if (leftGap <= 0.01 || rightGap <= 0.01) {
    return leftGap > rightGap ? "left" : "right";
  }
  const ratio = leftGap / rightGap;
  if (ratio > 1.5) return "left"; // image-left cheek more visible
  if (ratio < 1 / 1.5) return "right"; // image-right cheek more visible
  return "both";
}

/**
 * Map a free-text zone string from Claude's narrative (e.g. "forehead",
 * "upper lip", "under-eye") to a region key, or null if it isn't a region
 * we can map.
 */
export function toRegionKey(area: string): RegionKey | null {
  const a = area.toLowerCase();
  if (a.includes("forehead") || a.includes("brow") || a.includes("temple"))
    return "forehead";
  if (
    a.includes("eye") ||
    a.includes("tear") ||
    a.includes("periorbital") ||
    a.includes("under-eye")
  )
    return "undereye";
  if (a.includes("upper lip") || a.includes("upper-lip") || a.includes("lip"))
    return "upperlip";
  if (a.includes("nose") || a.includes("bridge")) return "nose";
  if (a.includes("jaw") || a.includes("jowl") || a.includes("chin"))
    return "jawline";
  if (a.includes("cheek") || a.includes("mid-face") || a.includes("mid face"))
    return "cheeks";
  return null;
}

/** Short label for the on-map marker. */
export const REGION_LABEL: Record<RegionKey, string> = {
  forehead: "Forehead",
  undereye: "Under-eye",
  nose: "Nose",
  cheeks: "Cheeks",
  upperlip: "Upper lip",
  jawline: "Jawline",
};

/**
 * Anatomical top-to-bottom order. The pigmentation map always presents the core
 * zones (forehead, under-eye, nose, cheeks, upper lip); the jawline is added
 * only when Claude flags it, so the map stays focused.
 */
export const REGION_ORDER: RegionKey[] = [
  "forehead",
  "undereye",
  "nose",
  "cheeks",
  "upperlip",
  "jawline",
];

/** Short, truthful "what the treatment does here" copy per zone. No guarantees. */
export const REGION_COPY: Record<RegionKey, { title: string; blurb: string }> = {
  forehead: {
    title: "Your forehead",
    blurb:
      "VirtueRF's pulsed energy helps break down sun-related spots and darker patches across the forehead, while exosomes support renewal for a brighter, more even canvas.",
  },
  undereye: {
    title: "Your under-eye area",
    blurb:
      "Gentle tone-evening for the delicate skin beneath the eyes — mesotherapy's vitamin and antioxidant blend helps brighten shadowy, uneven tone for a more rested look.",
  },
  nose: {
    title: "Your nose",
    blurb:
      "The bridge and sides of the nose catch the sun first. The protocol targets these small, stubborn spots so the centre of your face reads clear and even.",
  },
  cheeks: {
    title: "Your cheeks",
    blurb:
      "The cheeks are where uneven patches show most. VirtueRF works on the excess pigment while exosomes calm and renew, softening patchiness into a smoother, more uniform tone.",
  },
  upperlip: {
    title: "Your upper lip",
    blurb:
      "The band above the lip is a classic site of stubborn pigmentation. The protocol's combination approach gently fades this shadowing for a fresher, brighter look.",
  },
  jawline: {
    title: "Your jawline",
    blurb:
      "Marks left behind by blemishes often settle along the jaw. The protocol helps fade these lingering spots as the skin renews.",
  },
};
