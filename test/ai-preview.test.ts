import { describe, expect, it } from "vitest";
import { editLooksFaithful } from "@/lib/ai-preview";
import { buildPreviewPrompt } from "@/lib/prompts/preview-edit";

function grid(fn: (x: number, y: number) => number): Float32Array {
  const out = new Float32Array(48 * 48);
  for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) out[y * 48 + x] = fn(x, y);
  return out;
}

const face = grid((x, y) => 0.5 + 0.3 * Math.sin(x / 6) * Math.cos(y / 7));

describe("AI preview guard", () => {
  it("accepts an edit that only lightens a few spots", () => {
    const edited = face.map((v, i) => (i % 97 === 0 ? Math.min(1, v + 0.05) : v));
    expect(editLooksFaithful(face, edited)).toBe(true);
  });

  it("rejects an edit that shifts the face", () => {
    const shifted = grid((x, y) => 0.5 + 0.3 * Math.sin((x + 9) / 6) * Math.cos((y + 6) / 7));
    expect(editLooksFaithful(face, shifted)).toBe(false);
  });

  it("rejects a global brightening (beauty filter)", () => {
    const brighter = face.map((v) => Math.min(1, v + 0.1));
    expect(editLooksFaithful(face, brighter)).toBe(false);
  });
});

describe("preview edit prompt", () => {
  it("targets the client's pigmentation type and zones only", () => {
    const p = buildPreviewPrompt("melasma", ["cheeks", "upperlip"]);
    expect(p).toContain("melasma patches");
    expect(p).toContain("cheeks, upper lip");
    expect(p).toMatch(/Do NOT smooth, airbrush/);
  });

  it("never names a product or calls the treatment a peel", () => {
    const p = buildPreviewPrompt(null, []).toLowerCase();
    expect(p).not.toMatch(/peel|amiko|perfecta|auric/);
  });
});

describe("per-type preview strength", () => {
  it("asks for a gentler fade on melasma than on freckles", () => {
    expect(buildPreviewPrompt("ephelides", [])).toContain("half as visible");
    expect(buildPreviewPrompt("pih", [])).toContain("40% less visible");
    expect(buildPreviewPrompt("melasma", [])).toContain("a third less visible");
  });
});
