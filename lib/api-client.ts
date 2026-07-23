import type {
  AnalyzeRequest,
  AnalyzeResult,
  Lead,
  LeadRequest,
} from "./types";
import type { NormalizedPoint } from "@/components/scan/useFaceLandmarker";
import { genericFallbackResult } from "./assessment";
import { BUCKET_META } from "./constants";

/**
 * Request the photo-only suitability analysis. The server route already degrades
 * to a safe consultation result on errors; this adds a final client-side net for
 * hard network failures so the user is never left without a result.
 */
export async function requestAnalysis(
  body: AnalyzeRequest,
): Promise<AnalyzeResult> {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`analyze ${res.status}`);
    return (await res.json()) as AnalyzeResult;
  } catch {
    return genericFallbackResult(Boolean(body.imageBase64));
  }
}

/** Fire the lead to GoHighLevel. Never throws — lead delivery must not block. */
export async function submitLead(body: LeadRequest): Promise<void> {
  try {
    await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch {
    /* swallowed: server-side retry + logging owns reliability */
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result);
      resolve(s.slice(s.indexOf(",") + 1)); // strip the data: prefix
    };
    reader.onerror = () => reject(new Error("blob-read-failed"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Generate the report PDF in the browser and send it to /api/report, which
 * uploads it to GoHighLevel, attaches it to the contact and emails the patient
 * their copy. This runs automatically for every lead — there is no feature flag
 * and no separate opt-in. Fire-and-forget: never throws, never blocks the
 * result reveal, and no-ops server-side if the GHL integration isn't configured.
 */
export async function submitReportToGhl(opts: {
  result: AnalyzeResult;
  lead: Lead;
  imageBase64: string | null;
  imageMediaType: string;
  landmarks: NormalizedPoint[] | null;
}): Promise<void> {
  try {
    const { generateReportPdf } = await import("./report");
    const blob = await generateReportPdf({
      result: opts.result,
      imageBase64: opts.imageBase64,
      imageMediaType: opts.imageMediaType,
      landmarks: opts.landmarks,
      lead: opts.lead,
    });
    const pdfBase64 = await blobToBase64(blob);
    await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead: opts.lead,
        suitabilityLabel: BUCKET_META[opts.result.bucket].label,
        score: opts.result.score,
        pdfBase64,
      }),
    });
  } catch {
    /* swallowed — report delivery is best-effort and must not block */
  }
}
