import { act, cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LondonCamera from "@/app/camera/page";
import GlasgowCamera from "@/app/glasgow/camera/page";
import Home from "@/app/page";
import GlasgowHome from "@/app/glasgow/page";
import { analysisHref, StartAnalysisLink } from "@/components/landing/LandingActions";
import { useWizard } from "@/store/wizard-store";
import { getVisitContext } from "@/lib/visit-context";
import { LANDING_CONTENT } from "@/lib/landing-content";

vi.mock("@/components/screens/ScanScreen", () => ({ ScanScreen: () => <div>Scanning</div> }));
vi.mock("@/components/screens/ResultScreen", () => ({ ResultScreen: () => <div>Results</div> }));
vi.mock("@/components/screens/LeadGateScreen", () => ({ LeadGateScreen: () => <div>Lead details</div> }));
vi.mock("@/components/wizard/StepTransition", () => ({ StepTransition: ({ children }: { children: React.ReactNode }) => children }));

beforeEach(() => {
  useWizard.getState().reset();
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState({}, "", "/");
});

describe("Google Ads camera entry", () => {
  it.each([
    ["london", LondonCamera],
    ["glasgow", GlasgowCamera],
  ] as const)("opens %s at the photo step without granting consent", (_city, Page) => {
    const html = renderToString(<Page />);
    expect(html).toContain('data-analysis-step="consent"');
    expect(html).not.toContain("Stubborn spots.");
    render(<Page />);
    expect(screen.getByRole("heading", { name: "A quick photo to begin" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Use camera" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload photo" })).toBeInTheDocument();
    expect(useWizard.getState().step).toBe("consent");
    expect(useWizard.getState().imageConsent).toBe(false);
    expect(useWizard.getState().imageConsentAt).toBeNull();
    act(() => useWizard.getState().beginScan());
    expect(useWizard.getState().step).toBe("consent");
  });

  it.each([Home, GlasgowHome])("keeps the Meta entry introduction", (Page) => {
    render(<Page />);
    expect(screen.getByRole("heading", { name: /Stubborn spots/ })).toBeInTheDocument();
    expect(useWizard.getState().step).toBe("hero");
  });

  it.each(["london", "glasgow"] as const)("preserves %s attribution into camera entry", (city) => {
    const content = LANDING_CONTENT[city];
    const search = "?utm_source=google&utm_medium=cpc&utm_campaign=pigmentation&gclid=test-click&gbraid=test-braid&wbraid=test-web&fbclid=test-meta&lp=old";
    const href = analysisHref(content.analysisPath, content.landingId, search);
    const url = new URL(href, "https://example.com");
    for (const [key, value] of new URLSearchParams(search)) {
      if (key !== "lp") expect(url.searchParams.get(key)).toBe(value);
    }
    expect(url.pathname).toBe(city === "london" ? "/camera" : "/glasgow/camera");
    window.history.replaceState({}, "", href);
    expect(getVisitContext(city)).toMatchObject({ clinicLocation: city, fromGoogleAd: true, landingPath: content.landingId });
    render(<StartAnalysisLink analysisPath={content.analysisPath} landingId={content.landingId} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", `${content.analysisPath}?lp=${content.landingId}`);
  });

  it("does not reset an analysis already in progress", () => {
    useWizard.getState().goToLead();
    render(<GlasgowCamera />);
    expect(screen.getByText("Lead details")).toBeInTheDocument();
    expect(useWizard.getState().step).toBe("lead");
  });
});
