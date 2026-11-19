import "server-only";

// ─────────────────────────────────────────────────────────────────────────────
// HSA SkinScan — the clinic's own pigmentation model, served separately (see
// pigmentation-model/serve.py). Called before Claude; its reading is passed to
// Claude as a supporting signal. Optional: with SKINSCAN_URL unset, or on any
// error/timeout, the analysis simply runs on Claude alone. The image is sent
// only to the clinic's own service and never stored.
// ─────────────────────────────────────────────────────────────────────────────

export interface SkinScanReading {
  top: string;
  pattern: Record<string, number>;
  group: Record<string, number>;
  zones: Record<string, string>;
  quality: { issues?: string[] } | null;
  measures: { spots?: number; patches?: number; cheek_symmetry?: number | null } | null;
  version?: string;
}

const TIMEOUT_MS = 35_000;

export async function skinScan(imageBase64: string): Promise<SkinScanReading | null> {
  const url = process.env.SKINSCAN_URL;
  if (!url) return null;
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/pigmentation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Shared secret — required by the SkinScan server once it is public.
        ...(process.env.SKINSCAN_API_KEY ? { "x-skinscan-key": process.env.SKINSCAN_API_KEY } : {}),
      },
      body: JSON.stringify({ image_base64: imageBase64 }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as SkinScanReading & { ok?: boolean };
    return data.ok ? data : null;
  } catch (err) {
    console.error("[skinscan] unavailable — continuing with Claude alone:", err instanceof Error ? err.name : err);
    return null;
  }
}

/** The reading as a short note for Claude's user turn. */
export function skinScanNote(r: SkinScanReading): string {
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  const top3 = Object.entries(r.pattern).slice(0, 3).map(([k, v]) => `${k} ${pct(v)}`).join(", ");
  const groups = Object.entries(r.group).map(([k, v]) => `${k} ${pct(v)}`).join(", ");
  const zones = Object.entries(r.zones).map(([z, t]) => `${z}: ${t}`).join("; ");
  // Photo-quality warnings are deliberately NOT passed on: Claude judges framing
  // itself, and SkinScan's stricter lighting flags made it reject usable photos.
  const m = r.measures;
  const measured = m ? ` Measured ${m.spots ?? "?"} distinct spots and ${m.patches ?? "?"} larger patches.` : "";
  return (
    "HSA SkinScan reading for this photo (the clinic's own pigmentation model — a supporting signal; " +
    "use it to decide between patterns you find genuinely ambiguous, but trust what you clearly see in the photo when they disagree): " +
    `most likely patterns ${top3}. Pattern groups: ${groups}. Per zone: ${zones}.${measured}`
  );
}
