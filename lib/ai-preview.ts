// ─────────────────────────────────────────────────────────────────────────────
// Client side of the AI "after" preview (see app/api/preview/route.ts).
//
// One full-face edit per result, shared by every zone close-up: the edited image
// is resized back onto the original photo's exact pixel grid, so the face-map
// zone rectangles crop the same skin from both. Before it is shown, the edit is
// checked against the original — if the model moved the face, changed the
// framing or shifted the overall brightness, it is rejected and the caller keeps
// the on-device preview instead. A preview must never misrepresent the result.
// ─────────────────────────────────────────────────────────────────────────────

import type { SpotTypeKey } from "@/lib/spot-types";

const GRID = 48;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image-load-failed"));
    img.src = src;
  });
}

/** Downscaled luminance grid, for a cheap structural comparison. */
function lumaGrid(img: CanvasImageSource, w: number, h: number): Float32Array {
  const c = document.createElement("canvas");
  c.width = GRID;
  c.height = GRID;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h, 0, 0, GRID, GRID);
  const d = ctx.getImageData(0, 0, GRID, GRID).data;
  const out = new Float32Array(GRID * GRID);
  for (let i = 0; i < out.length; i++) {
    out[i] = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255;
  }
  return out;
}

function mean(a: Float32Array): number {
  let s = 0;
  for (const v of a) s += v;
  return s / a.length;
}

function correlation(a: Float32Array, b: Float32Array): number {
  const ma = mean(a);
  const mb = mean(b);
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i] - ma;
    const y = b[i] - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

/**
 * True when the edit is the same photograph: same structure (high correlation of
 * the luminance layout) and no global brightening/darkening beyond what fading
 * pigment alone can cause.
 */
export function editLooksFaithful(original: Float32Array, edited: Float32Array): boolean {
  return correlation(original, edited) >= 0.93 && Math.abs(mean(edited) - mean(original)) <= 0.04;
}

export interface AfterImage {
  base64: string;
  mediaType: string;
}

let cache: { key: string; promise: Promise<AfterImage | null> } | null = null;

/**
 * The validated full-face "after" image (same pixel size as the original), or
 * null when unavailable — callers then fall back to the on-device preview.
 */
export function aiAfterImage(
  imageBase64: string,
  imageMediaType: string,
  spotType: SpotTypeKey | null | undefined,
  zones: string[],
): Promise<AfterImage | null> {
  const key = `${imageBase64.length}:${imageBase64.slice(-64)}:${spotType ?? ""}:${zones.join(",")}`;
  if (cache?.key === key) return cache.promise;
  const promise = (async () => {
    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ imageBase64, imageMediaType, imageConsent: true, spotType, zones }),
      });
      if (!res.ok) return null;
      const json = (await res.json()) as { imageBase64?: string; imageMediaType?: string };
      if (!json.imageBase64) return null;

      const [orig, edit] = await Promise.all([
        loadImage(`data:${imageMediaType};base64,${imageBase64}`),
        loadImage(`data:${json.imageMediaType ?? "image/png"};base64,${json.imageBase64}`),
      ]);
      const w = orig.naturalWidth;
      const h = orig.naturalHeight;

      // Put the edit on the original's pixel grid so zone crops line up.
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d")!.drawImage(edit, 0, 0, w, h);

      if (!editLooksFaithful(lumaGrid(orig, w, h), lumaGrid(c, w, h))) {
        console.warn("[preview] AI edit rejected: drifted from the original photo");
        return null;
      }
      const mediaType = imageMediaType === "image/png" ? "image/png" : "image/jpeg";
      const dataUrl = c.toDataURL(mediaType, 0.92);
      return { base64: dataUrl.slice(dataUrl.indexOf(",") + 1), mediaType };
    } catch {
      return null;
    }
  })();
  cache = { key, promise };
  return promise;
}
