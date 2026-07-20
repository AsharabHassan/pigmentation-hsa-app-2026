"use client";

import type { AnalyzeResult, Lead } from "./types";
import type { NormalizedPoint } from "@/components/scan/useFaceLandmarker";
import {
  regionMarkers,
  regionRect,
  faceVisibleSide,
  toRegionKey,
  REGION_ORDER,
  REGION_COPY,
  REGION_LABEL,
  type RegionKey,
} from "./face-regions";
import { cropImage } from "./crop";
import {
  BUCKET_META,
  CLINIC,
  BOOKING_URL,
  PRICE_GUIDE,
  DISCLAIMER,
} from "./constants";
import { buildReportPdf, type ReportArea } from "./report-pdf";

// Mirrors the on-screen FaceConcernMap so the PDF matches what the client saw.
const CORE: RegionKey[] = ["forehead", "undereye", "nose", "cheeks", "upperlip"];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image-load-failed"));
    img.src = src;
  });
}

function coveredBlurb(r: RegionKey): string {
  return `Hair, facial hair, glasses or shadow covers this area, so we couldn't read it from your photo. The treatment still works beautifully here — your practitioner will assess your ${REGION_LABEL[
    r
  ].toLowerCase()} properly at your consultation.`;
}

/** Region plan shared by the annotated image and the area list (consistent numbering). */
function planRegions(
  landmarks: NormalizedPoint[],
  result: AnalyzeResult,
): { region: RegionKey; num: number; flagged: boolean; covered: boolean }[] {
  const flagged = new Set(
    (result.narrative.observedAreas ?? [])
      .map(toRegionKey)
      .filter((r): r is RegionKey => r !== null),
  );
  const jawlineWanted =
    flagged.has("jawline") ||
    typeof result.zoneSeverity?.jawline === "number" ||
    result.zonesObscured.includes("jawline");
  const wanted = [...CORE, ...(jawlineWanted ? (["jawline"] as const) : [])];
  const regions = REGION_ORDER.filter(
    (r) => wanted.includes(r) && regionMarkers(r, landmarks).length > 0,
  );
  return regions.map((region, i) => ({
    region,
    num: i + 1,
    flagged: flagged.has(region),
    covered: result.zonesObscured.includes(region),
  }));
}

async function renderAnnotatedFace(
  imageBase64: string,
  mediaType: string,
  landmarks: NormalizedPoint[],
  result: AnalyzeResult,
): Promise<{ url: string; aspect: number } | null> {
  try {
    const img = await loadImage(`data:${mediaType};base64,${imageBase64}`);
    const W = 620;
    const H = Math.max(1, Math.round((W * img.naturalHeight) / img.naturalWidth));
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, W, H);

    const vs = faceVisibleSide(landmarks);
    for (const { region, num, covered } of planRegions(landmarks, result)) {
      let markers = regionMarkers(region, landmarks);
      if (markers.length === 2 && vs !== "both") {
        const sorted = [...markers].sort((a, b) => a.cx - b.cx);
        markers = [vs === "right" ? sorted[1] : sorted[0]];
      }
      for (const e of markers) {
        const cx = e.cx * W;
        const cy = e.cy * H;
        // marker ring
        ctx.beginPath();
        ctx.ellipse(cx, cy, e.rx * W, e.ry * H, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(212,175,55,0.9)";
        ctx.lineWidth = 2;
        ctx.setLineDash(covered ? [6, 5] : []);
        ctx.stroke();
        ctx.setLineDash([]);
        // numbered pin
        ctx.beginPath();
        ctx.arc(cx, cy, 11, 0, Math.PI * 2);
        ctx.fillStyle = "#d4af37";
        ctx.fill();
        ctx.fillStyle = "#0a0a0a";
        ctx.font = "bold 13px Helvetica, Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(num), cx, cy + 0.5);
      }
    }
    return { url: canvas.toDataURL("image/png"), aspect: W / H };
  } catch {
    return null;
  }
}

/**
 * Build the branded suitability report PDF entirely in the browser (renders the
 * annotated face + area crops, then lays them out via buildReportPdf). Returns a
 * PDF Blob. Works with or without a photo (quiz-only → verdict-only report).
 */
export async function generateReportPdf(opts: {
  result: AnalyzeResult;
  imageBase64: string | null;
  imageMediaType: string;
  landmarks: NormalizedPoint[] | null;
  lead: Lead | null;
}): Promise<Blob> {
  const { result, imageBase64, imageMediaType, landmarks, lead } = opts;
  const meta = BUCKET_META[result.bucket];

  let faceImageDataUrl: string | null = null;
  let faceImageAspect: number | undefined;
  let areas: ReportArea[] = [];

  if (result.usedPhoto && imageBase64 && landmarks) {
    const face = await renderAnnotatedFace(
      imageBase64,
      imageMediaType,
      landmarks,
      result,
    );
    faceImageDataUrl = face?.url ?? null;
    faceImageAspect = face?.aspect;
    const plan = planRegions(landmarks, result);
    areas = await Promise.all(
      plan.map(async ({ region, num, flagged, covered }) => {
        const rect = regionRect(region, landmarks);
        const cropDataUrl = rect
          ? await cropImage(imageBase64, imageMediaType, rect)
          : null;
        return {
          num,
          title: REGION_COPY[region].title,
          blurb: covered ? coveredBlurb(region) : REGION_COPY[region].blurb,
          cropDataUrl,
          covered,
          flagged,
          enhancement: covered
            ? null
            : (result.zoneImprovement?.[region] ?? null),
          severity: covered ? null : (result.zoneSeverity?.[region] ?? null),
        } satisfies ReportArea;
      }),
    );
  }

  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return buildReportPdf({
    clinicName: CLINIC.name,
    treatmentName: "Pigmentation Removal",
    byline: CLINIC.byline,
    mono: "H S A",
    palette: {
      bg: [9, 9, 9],
      panel: [22, 19, 15],
      gold: [212, 175, 55],
      goldLt: [231, 198, 104],
      heading: [245, 241, 230],
      body: [198, 191, 178],
      faint: [138, 132, 122],
      line: [62, 57, 48],
      badgeText: [9, 9, 9],
    },
    phone: CLINIC.phone,
    email: CLINIC.email,
    bookingUrl: BOOKING_URL.replace(/^https?:\/\//, ""),
    addressLines: [...CLINIC.addressLines],
    preparedFor: lead?.firstName?.trim() || undefined,
    dateStr,
    verdictLabel: meta.label,
    headline: result.narrative.headline,
    score: result.score,
    narrative: result.narrative.narrative,
    encouragement: result.narrative.encouragement,
    usedPhoto: result.usedPhoto,
    obscuredNotice: result.zonesObscured.length > 0,
    makeupNotice: result.makeupDetected,
    faceImageDataUrl,
    faceImageAspect,
    areas,
    priceFrom: PRICE_GUIDE.from,
    priceNote: PRICE_GUIDE.note,
    disclaimer: DISCLAIMER,
  });
}
