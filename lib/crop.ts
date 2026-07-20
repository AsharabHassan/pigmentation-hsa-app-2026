import type { NormRect } from "./face-regions";

// ─────────────────────────────────────────────────────────────────────────────
// Client-only canvas cropping. Takes the in-memory selfie (base64) plus a
// normalized rectangle and returns a cropped JPEG data URL. Nothing leaves the
// device — this is the same Canvas API the capture/overlay steps already use.
// ─────────────────────────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image-load-failed"));
    img.src = src;
  });
}

/**
 * Crop the source image around `rect` (normalized 0–1 coords) into a SQUARE JPEG
 * data URL. The report renders these thumbnails in a square cell, so we frame a
 * square region here (centred on the rect, grown to the rect's longer side and
 * clamped to the photo) rather than a rectangle — otherwise the square cell
 * stretches a non-square crop out of proportion. Returns null on failure.
 */
export async function cropImage(
  base64: string,
  mediaType: string,
  rect: NormRect,
): Promise<string | null> {
  try {
    const img = await loadImage(`data:${mediaType};base64,${base64}`);
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;

    // Square side (in px) = the rect's longer edge, never larger than the photo.
    let side = Math.max(rect.w * nw, rect.h * nh, 1);
    side = Math.min(side, nw, nh);

    // Centre the square on the rect, then clamp so it stays inside the photo.
    const cx = (rect.x + rect.w / 2) * nw;
    const cy = (rect.y + rect.h / 2) * nh;
    let sx = Math.round(cx - side / 2);
    let sy = Math.round(cy - side / 2);
    const s = Math.round(side);
    sx = Math.max(0, Math.min(sx, nw - s));
    sy = Math.max(0, Math.min(sy, nh - s));

    const canvas = document.createElement("canvas");
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, sx, sy, s, s, 0, 0, s, s);
    return canvas.toDataURL("image/jpeg", 0.9);
  } catch {
    return null;
  }
}
