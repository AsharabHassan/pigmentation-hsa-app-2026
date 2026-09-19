import { after } from "next/server";
import type { AnalyzeRequest, AnalyzeResult } from "@/lib/types";
import { assessPhoto } from "@/lib/anthropic";
import { buildResult, genericFallbackResult } from "@/lib/assessment";
import { deviceFromUserAgent, visitContextSchema } from "@/lib/insights";
import { recordAnalysis } from "@/lib/insights-store";

export const runtime = "nodejs";

// POST /api/analyze — photo-only AI suitability read.
// Claude assesses the selfie, chooses the cosmetic outcome, and writes the copy.
// On any error (or a missing/declined photo) we return a safe consultation result.
// The image lives only in this request scope and is never persisted or logged.
//
// Every outcome is also written to the insights database (scores, verdict and
// visit source only — never the image) after the response has been sent, so the
// write can neither slow the reveal nor fail it.
export async function POST(request: Request): Promise<Response> {
  let body: AnalyzeRequest;
  try {
    body = (await request.json()) as AnalyzeRequest;
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const { imageBase64, imageMediaType = "image/jpeg", imageConsent } = body;
  const usedPhoto = Boolean(imageBase64) && imageConsent === true;

  const context = visitContextSchema.safeParse(body.context ?? {});
  const device = deviceFromUserAgent(request.headers.get("user-agent"));
  const respond = (outcome: AnalyzeResult): Response => {
    const result: AnalyzeResult = { ...outcome, analysisId: crypto.randomUUID() };
    if (context.success) {
      after(() =>
        recordAnalysis({
          id: result.analysisId!,
          clinicLocation: context.data.clinicLocation,
          result,
          context: context.data,
          device,
        }),
      );
    }
    return Response.json(result);
  };

  if (!usedPhoto) {
    return respond(genericFallbackResult(false));
  }

  try {
    const assessment = await assessPhoto({
      imageBase64: imageBase64!,
      imageMediaType,
    });
    return respond(buildResult(assessment, true));
  } catch (err) {
    // Surface WHY the AI read failed (invalid API key, rate limit, bad request,
    // etc.) so a misconfiguration doesn't silently masquerade as the user's photo
    // being unreadable. We log only the error — never the image, which stays in
    // this request scope and is never persisted. The user still gets a safe,
    // on-brand consultation result so the flow never blocks.
    console.error(
      "[api/analyze] assessPhoto failed — returning consultation fallback:",
      err instanceof Error ? `${err.name}: ${err.message}` : err,
    );
    return respond(genericFallbackResult(true));
  }
  // imageBase64 goes out of scope here — never written anywhere.
}
