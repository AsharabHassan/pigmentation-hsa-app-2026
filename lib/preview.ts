// ─────────────────────────────────────────────────────────────────────────────
// Client-only illustrative "after" preview for a zone close-up.
//
// Each pixel is compared with the CLEAR skin immediately around it (a local skin
// average that ignores the darker pigment itself), and only marks that are both
// darker AND browner than that clear skin are faded toward it. Skin keeps its own
// tone, shading and texture; hair, beard, lips, lashes and background are left
// alone. Validated on real clinic photos across skin tones. Nothing leaves the
// device, and the UI always labels the result as an illustration.
// ─────────────────────────────────────────────────────────────────────────────

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image-load-failed"));
    img.src = src;
  });
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Weighted block-average downscale by `f`, then bilinear upsample back to w×h.
 * `rgb` is interleaved RGB (3 floats per pixel); `wt` is a per-pixel weight.
 */
function blockAvg(rgb: Float32Array, wt: Float32Array, w: number, h: number, f: number): Float32Array {
  const sw = Math.max(2, Math.floor(w / f));
  const sh = Math.max(2, Math.floor(h / f));
  const num = new Float32Array(sw * sh * 3);
  const den = new Float32Array(sw * sh);
  for (let y = 0; y < h; y++) {
    const by = Math.min(sh - 1, Math.floor((y * sh) / h));
    for (let x = 0; x < w; x++) {
      const bx = Math.min(sw - 1, Math.floor((x * sw) / w));
      const p = y * w + x;
      const b = by * sw + bx;
      const k = wt[p];
      num[b * 3] += rgb[p * 3] * k;
      num[b * 3 + 1] += rgb[p * 3 + 1] * k;
      num[b * 3 + 2] += rgb[p * 3 + 2] * k;
      den[b] += k;
    }
  }
  const small = new Float32Array(sw * sh * 3);
  for (let b = 0; b < sw * sh; b++) {
    const dd = den[b] > 1e-4 ? den[b] : 1e-4;
    small[b * 3] = num[b * 3] / dd;
    small[b * 3 + 1] = num[b * 3 + 1] / dd;
    small[b * 3 + 2] = num[b * 3 + 2] / dd;
  }
  const out = new Float32Array(w * h * 3);
  for (let y = 0; y < h; y++) {
    const fy = Math.max(0, Math.min(sh - 1, ((y + 0.5) * sh) / h - 0.5));
    const y0 = Math.floor(fy);
    const y1 = Math.min(sh - 1, y0 + 1);
    const ty = fy - y0;
    for (let x = 0; x < w; x++) {
      const fx = Math.max(0, Math.min(sw - 1, ((x + 0.5) * sw) / w - 0.5));
      const x0 = Math.floor(fx);
      const x1 = Math.min(sw - 1, x0 + 1);
      const tx = fx - x0;
      const p = (y * w + x) * 3;
      for (let c = 0; c < 3; c++) {
        const a = small[(y0 * sw + x0) * 3 + c] * (1 - tx) + small[(y0 * sw + x1) * 3 + c] * tx;
        const bb = small[(y1 * sw + x0) * 3 + c] * (1 - tx) + small[(y1 * sw + x1) * 3 + c] * tx;
        out[p + c] = a * (1 - ty) + bb * ty;
      }
    }
  }
  return out;
}

// sRGB <-> CIE Lab (D65). Lab separates lightness (L*) from yellow-brown (b*),
// which is how skin pigment is measured and works the same on every skin tone.
const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const fLab = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
const fInv = (t: number) => (t > 0.206893 ? t * t * t : (t - 16 / 116) / 7.787);
const XN = 0.95047, ZN = 1.08883;

function rgbToLab(r: number, g: number, b: number, out: Float32Array, o: number) {
  const R = toLin(r / 255), G = toLin(g / 255), B = toLin(b / 255);
  const x = fLab((0.4124 * R + 0.3576 * G + 0.1805 * B) / XN);
  const y = fLab(0.2126 * R + 0.7152 * G + 0.0722 * B);
  const z = fLab((0.0193 * R + 0.1192 * G + 0.9505 * B) / ZN);
  out[o] = 116 * y - 16;
  out[o + 1] = 500 * (x - y);
  out[o + 2] = 200 * (y - z);
}

function labToRgb(L: number, A: number, Bv: number, d: Uint8ClampedArray, i: number) {
  const y = (L + 16) / 116;
  const X = XN * fInv(y + A / 500), Y = fInv(y), Z = ZN * fInv(y - Bv / 200);
  const r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z;
  const g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
  const b = 0.0557 * X - 0.204 * Y + 1.057 * Z;
  d[i] = Math.round(255 * toSrgb(Math.max(0, Math.min(1, r))));
  d[i + 1] = Math.round(255 * toSrgb(Math.max(0, Math.min(1, g))));
  d[i + 2] = Math.round(255 * toSrgb(Math.max(0, Math.min(1, b))));
}

/**
 * The pixel step on its own (pure, no DOM) so it can be tested on real photos.
 * Works in Lab: a pixel is pigment when it is darker (lower L*) AND more
 * yellow-brown (higher b*) than the clear skin around it; only L* and b* are
 * eased back toward that clear skin, so redness, texture, hair and lips stay.
 * Validated on very fair to deep skin. Modifies `d` (RGBA) in place.
 */
export function fadePigmentPixels(d: Uint8ClampedArray, w: number, h: number, strength: number): void {
  const { lab, base, mask: m } = analysePigment(d, w, h);
  const n = w * h;
  const s = clamp01(strength);
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    const k = s * m[p];
    if (k <= 0.005) continue;
    const L = lab[p * 3], A = lab[p * 3 + 1], Bv = lab[p * 3 + 2];
    const dL = base[p * 3] - L;
    const db = Bv - base[p * 3 + 2];
    labToRgb(L + dL * k, A, Bv - Math.max(0, db) * k, d, i);
  }
}

export interface PigmentAnalysis {
  /** Lab per pixel (3 floats). */
  lab: Float32Array;
  /** Local CLEAR-skin Lab per pixel — what the skin around each mark looks like. */
  base: Float32Array;
  /** 0–1 per pixel: how strongly this pixel is a brown pigment mark (softened). */
  mask: Float32Array;
  /** 1 where the pixel looks like skin (not hair, lips, eyes or background). */
  skin: Float32Array;
}

/**
 * Where the pigment is (pure, no DOM): Lab, the local clear-skin reference and a
 * soft pigment mask. Shared by the on-device fade and the AI-guided preview.
 */
export function analysePigment(d: Uint8ClampedArray, w: number, h: number): PigmentAnalysis {
  const n = w * h;
  const lab = new Float32Array(n * 3);
  const skin = new Float32Array(n);
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    rgbToLab(r, g, b, lab, p * 3);
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cr = (r - y) * 0.713 + 128;
    const cb = (b - y) * 0.564 + 128;
    skin[p] = cr > 133 && cr < 178 && cb > 77 && cb < 130 && lab[p * 3] > 12 ? 1 : 0;
  }

  const f = Math.max(6, Math.floor(Math.max(w, h) / 10));
  // Pass 1: local skin tone. Pass 2: local CLEAR skin (mid-tone, pigment excluded).
  let base = blockAvg(lab, skin, w, h, f);
  const clear = new Float32Array(n);
  for (let p = 0; p < n; p++) {
    const L = lab[p * 3], bl = base[p * 3];
    clear[p] = skin[p] * (L >= bl - 1.5 && L <= bl + 3 ? 1 : 0) + 1e-3 * skin[p];
  }
  base = blockAvg(lab, clear, w, h, f);

  const m = new Float32Array(n);
  for (let p = 0; p < n; p++) {
    if (!skin[p]) continue;
    const dL = base[p * 3] - lab[p * 3]; // darker than clear skin
    if (dL <= 0.5 || dL >= 25) continue; // not darker, or hair/lash-dark
    const db = lab[p * 3 + 2] - base[p * 3 + 2]; // more yellow-brown
    m[p] = clamp01((dL - 0.5) / 4) * clamp01((db + 4) / 6);
  }
  // Soften mask edges (two 3×3 box passes ≈ small Gaussian) so marks blend in.
  const tmp = new Float32Array(n);
  for (let pass = 0; pass < 2; pass++) {
    const src = pass === 0 ? m : tmp;
    const dst = pass === 0 ? tmp : m;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let acc = 0, cnt = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const yy = y + dy;
          if (yy < 0 || yy >= h) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx;
            if (xx < 0 || xx >= w) continue;
            acc += src[yy * w + xx];
            cnt++;
          }
        }
        dst[y * w + x] = acc / cnt;
      }
    }
  }

  return { lab, base, mask: m, skin };
}

export { rgbToLab, labToRgb };

/**
 * @param src      zone close-up (data URL)
 * @param strength 0–1, how far pigment fades toward the surrounding clear skin
 */
export async function pigmentFadePreview(src: string, strength: number): Promise<string | null> {
  try {
    const img = await load(src);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    const px = ctx.getImageData(0, 0, w, h);
    fadePigmentPixels(px.data, w, h, strength);
    ctx.putImageData(px, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.92);
  } catch {
    return null;
  }
}
