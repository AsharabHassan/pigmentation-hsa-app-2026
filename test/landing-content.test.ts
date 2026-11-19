import { describe, expect, it } from "vitest";
import { LANDING_CONTENT } from "@/lib/landing-content";

describe("ads landing pages", () => {
  it.each(["london", "glasgow"] as const)("%s content is search-ready", (key) => {
    const content = LANDING_CONTENT[key];
    const city = key === "london" ? "London" : "Glasgow";
    expect(content.metaTitle).toContain(`Pigmentation Removal ${city}`);
    expect(content.metaTitle.length).toBeLessThanOrEqual(80);
    expect(content.metaDescription.length).toBeLessThanOrEqual(240);
    expect(content.h1Lead).toContain(city);
    expect(content.faqs.length).toBeGreaterThanOrEqual(6);
    expect(new Set(content.faqs.map((f) => f.question)).size).toBe(
      content.faqs.length,
    );
  });

  it("sends each city to its own analyzer route with its own landing id", () => {
    expect(LANDING_CONTENT.london.analysisPath).toBe("/camera");
    expect(LANDING_CONTENT.glasgow.analysisPath).toBe("/glasgow/camera");
    expect(LANDING_CONTENT.london.landingId).not.toBe(
      LANDING_CONTENT.glasgow.landingId,
    );
  });

  it("never names a price the calculator would contradict", () => {
    const cost = LANDING_CONTENT.london.faqs.find((f) => /cost/i.test(f.question));
    expect(cost?.answer).toContain("£299 per session");
    expect(cost?.answer).toContain("£999 for a course of 4 sessions");
  });

  it.each(["london", "glasgow"] as const)("%s copy follows the 3R wording rules", (key) => {
    const content = LANDING_CONTENT[key];
    const faqs = content.faqs.map((f) => `${f.question} ${f.answer}`).join(" ");
    expect(faqs).toContain("3R Programme");
    expect(faqs).toMatch(/Reduce/);
    expect(faqs).toMatch(/Regulate/);
    expect(faqs).toMatch(/Reverse/);
    expect(faqs).toContain("4 sessions, two weeks apart");
    const copy = `${faqs} ${content.metaDescription} ${content.localProof.join(" ")}`.toLowerCase();
    expect(copy).not.toMatch(/amiko|cmca|perfecta|auric|peel|brighten|lighten|whiten|needle|painless|guarantee|permanent|\bcure|three-phase|2–3 sessions/);
  });
});
