import { describe, it, expect } from "vitest";
import {
  buildResult,
  genericFallbackResult,
  scoreInBucket,
  scoreForBucket,
} from "@/lib/assessment";
import type { PhotoAssessment } from "@/lib/types";

const assessment: PhotoAssessment = {
  suitability: "great",
  score: 91,
  zonesObscured: ["forehead"],
  makeupDetected: true,
  zoneSeverity: { cheeks: 62, nose: 34 },
  zoneImprovement: { cheeks: 68, nose: 41 },
  framingAdequate: true,
  narrative: {
    headline: "h",
    narrative: "n",
    observedAreas: ["cheeks"],
    encouragement: "e",
  },
};

describe("scoreInBucket", () => {
  it("clamps into the bucket band", () => {
    expect(scoreInBucket("great", 91)).toBe(91);
    expect(scoreInBucket("great", 20)).toBe(80);
    expect(scoreInBucket("great", 120)).toBe(99);
    expect(scoreInBucket("alternative", 90)).toBe(62);
  });

  it("falls back to the band midpoint for invalid scores", () => {
    expect(scoreInBucket("consultation", NaN)).toBe(
      scoreForBucket("consultation"),
    );
  });
});

describe("buildResult", () => {
  it("carries the pigmentation fields through to the result", () => {
    const r = buildResult(assessment, true);
    expect(r.bucket).toBe("great");
    expect(r.score).toBe(91);
    expect(r.zonesObscured).toEqual(["forehead"]);
    expect(r.makeupDetected).toBe(true);
    expect(r.zoneSeverity).toEqual({ cheeks: 62, nose: 34 });
    expect(r.zoneImprovement).toEqual({ cheeks: 68, nose: 41 });
    expect(r.framingAdequate).toBe(true);
    expect(r.narrativeSource).toBe("claude");
    expect(r.usedPhoto).toBe(true);
  });
});

describe("genericFallbackResult", () => {
  it("routes safely to consultation with empty zone data", () => {
    const r = genericFallbackResult(true);
    expect(r.bucket).toBe("consultation");
    expect(r.narrativeSource).toBe("fallback");
    expect(r.zonesObscured).toEqual([]);
    expect(r.makeupDetected).toBe(false);
    expect(r.zoneSeverity).toEqual({});
    expect(r.zoneImprovement).toEqual({});
    // A failure isn't a framing problem — must not trigger a retake loop.
    expect(r.framingAdequate).toBe(true);
  });

  it("never names a medical condition in fallback copy", () => {
    const r = genericFallbackResult(false);
    const text = [
      r.narrative.headline,
      r.narrative.narrative,
      r.narrative.encouragement,
    ]
      .join(" ")
      .toLowerCase();
    for (const term of ["melasma", "lentigo", "hyperpigmentation disorder"]) {
      expect(text).not.toContain(term);
    }
  });
});
