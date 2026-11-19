import { buildPreviewPrompt } from "@/lib/prompts/preview-edit";
import { isSpotTypeKey } from "@/lib/spot-types";

export const runtime = "nodejs";
// GPT-Image-2.5 edits take tens of seconds at high quality.
export const maxDuration = 120;

// POST /api/preview — AI "after" preview of the client's own selfie.
// Sends the photo to OpenAI's image-edit endpoint with a strict "lighten the
// pigmentation only" instruction and returns the edited image. Optional: with
// OPENAI_API_KEY unset, or on any error, it answers 503 and the client keeps
// its on-device preview. The image is never persisted or logged here.

const MAX_BASE64 = 8_000_000; // ~6 MB image

interface PreviewRequest {
  imageBase64?: string;
  imageMediaType?: string;
  imageConsent?: boolean;
  spotType?: unknown;
  zones?: unknown;
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({ error: "preview-unavailable" }, { status: 503 });

  let body: PreviewRequest;
  try {
    body = (await request.json()) as PreviewRequest;
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const { imageBase64, imageMediaType = "image/jpeg", imageConsent } = body;
  if (!imageBase64 || imageConsent !== true) {
    return Response.json({ error: "photo consent required" }, { status: 400 });
  }
  if (imageBase64.length > MAX_BASE64) {
    return Response.json({ error: "image too large" }, { status: 413 });
  }

  const spotType = isSpotTypeKey(body.spotType) ? body.spotType : null;
  const zones = Array.isArray(body.zones)
    ? body.zones.filter((z): z is string => typeof z === "string").slice(0, 6)
    : [];

  const form = new FormData();
  form.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-sunburst");
  form.append(
    "image",
    new Blob([Buffer.from(imageBase64, "base64")], { type: imageMediaType }),
    imageMediaType === "image/png" ? "selfie.png" : "selfie.jpg",
  );
  form.append("prompt", buildPreviewPrompt(spotType, zones));
  form.append("size", "auto");
  form.append("quality", process.env.OPENAI_IMAGE_QUALITY || "high");
  form.append("n", "1");

  try {
    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(110_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[preview] openai", res.status, detail.slice(0, 300));
      return Response.json({ error: "preview-failed" }, { status: 502 });
    }
    const json = (await res.json()) as { data?: { b64_json?: string }[]; output_format?: string };
    const out = json.data?.[0]?.b64_json;
    if (!out) return Response.json({ error: "preview-empty" }, { status: 502 });
    const format = json.output_format ?? "png";
    return Response.json({ imageBase64: out, imageMediaType: `image/${format}` });
  } catch (err) {
    console.error("[preview] request failed", err instanceof Error ? err.message : err);
    return Response.json({ error: "preview-failed" }, { status: 502 });
  }
}
