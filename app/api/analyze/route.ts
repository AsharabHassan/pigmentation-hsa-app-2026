import type { AnalyzeRequest } from "@/lib/types";
import { assessPhoto } from "@/lib/anthropic";
import { buildResult, genericFallbackResult } from "@/lib/assessment";

export const runtime = "nodejs";

// POST /api/analyze — photo-only AI suitability read.
// Claude assesses the selfie, chooses the cosmetic outcome, and writes the copy.
// On any error (or a missing/declined photo) we return a safe consultation result.
// The image lives only in this request scope and is never persisted or logged.
export async function POST(request: Request): Promise<Response> {
  let body: AnalyzeRequest;
  try {
    body = (await request.json()) as AnalyzeRequest;
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const { imageBase64, imageMediaType = "image/jpeg", imageConsent } = body;
  const usedPhoto = Boolean(imageBase64) && imageConsent === true;

  if (!usedPhoto) {
    return Response.json(genericFallbackResult(false));
  }

  try {
    const assessment = await assessPhoto({
      imageBase64: imageBase64!,
      imageMediaType,
    });
    return Response.json(buildResult(assessment, true));
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
    return Response.json(genericFallbackResult(true));
  }
  // imageBase64 goes out of scope here — never written anywhere.
}
