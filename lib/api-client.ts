import type { AnalyzeRequest, AnalyzeResult, LeadRequest } from "./types";
import { genericFallbackResult } from "./assessment";

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

// The report PDF is generated in the browser for the visitor's own download
// only (see components/screens/ResultScreen.tsx). It is never uploaded: the CRM
// receives the written result summary in the lead payload above and nothing
// face-containing.
