import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LeadGateScreen } from "@/components/screens/LeadGateScreen";
import { useWizard } from "@/store/wizard-store";
import { genericFallbackResult } from "@/lib/assessment";
import { ClinicLocationProvider } from "@/components/clinic/ClinicLocationContext";
import { ClinicChooser } from "@/components/clinic/ClinicChooser";

const mocks = vi.hoisted(() => ({
  submit: vi.fn(), report: vi.fn(), conversion: vi.fn(), analysis: vi.fn(),
}));
vi.mock("@/lib/api-client", () => ({
  submitLead: mocks.submit, submitReportToGhl: mocks.report,
  requestAnalysis: mocks.analysis,
}));
vi.mock("@/lib/google-ads", () => ({ trackCompletedGoogleLead: mocks.conversion }));
vi.mock("@/lib/meta-pixel", () => ({ getMetaAttribution: () => ({}) }));
vi.mock("@/lib/meta-consent", () => ({ hasMetaTrackingConsent: () => false }));

beforeEach(() => {
  vi.clearAllMocks();
  useWizard.getState().reset();
  useWizard.getState().setResult(genericFallbackResult(false));
  useWizard.getState().goToLead();
  mocks.report.mockResolvedValue(undefined);
});
afterEach(cleanup);

function fillLead(location: "london" | "glasgow" = "london") {
  render(<ClinicLocationProvider location={location}><LeadGateScreen /></ClinicLocationProvider>);
  for (const [label, value] of [
    ["First name", "Test"], ["Last name", "Preview"],
    ["Email", "test@example.test"], ["Best number for your consultation call", "07700900123"],
  ]) fireEvent.change(screen.getByLabelText(label), { target: { value } });
  return screen.getByRole("button", { name: "See my report" });
}

describe("clinic chooser", () => {
  it("lets a visitor on the London page pick Glasgow, and the lead follows", async () => {
    mocks.submit.mockResolvedValue(true);
    render(
      <ClinicLocationProvider location="london">
        <ClinicChooser />
        <LeadGateScreen />
      </ClinicLocationProvider>,
    );
    expect(screen.getByText(/Our London team will call you/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Glasgow" }));
    expect(screen.getByRole("button", { name: "Glasgow" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Our Glasgow team will call you/)).toBeInTheDocument();
    for (const [label, value] of [
      ["First name", "Test"], ["Last name", "Preview"],
      ["Email", "test@example.test"], ["Best number for your consultation call", "07700900123"],
    ]) fireEvent.change(screen.getByLabelText(label), { target: { value } });
    fireEvent.click(screen.getByRole("button", { name: "See my report" }));
    await waitFor(() => expect(mocks.submit).toHaveBeenCalledWith(
      expect.objectContaining({ clinicLocation: "glasgow" }),
    ));
  });
});

describe("consultation call request", () => {
  it("sends the consent wording, time and preferred call time with the lead", async () => {
    mocks.submit.mockResolvedValue(true);
    useWizard.getState().setContactConsent(true);
    const button = fillLead("glasgow");
    expect(screen.getByText(/will call you within minutes/)).toBeInTheDocument();
    expect(screen.queryByText(/0141 488 8985|020 4628 3165/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Afternoon" }));
    fireEvent.click(button);
    await waitFor(() => expect(mocks.submit).toHaveBeenCalledTimes(1));
    expect(mocks.submit).toHaveBeenCalledWith(expect.objectContaining({
      consultationContactConsent: true,
      consultationContactConsentAt: expect.stringMatching(/^\d{4}-/),
      consultationContactStatement: expect.stringContaining("call, text or WhatsApp me"),
      consultationContactConsentVersion: "consultation-contact-v1",
      preferredCallTime: "afternoon",
    }));
  });
});

describe("accepted-lead gate", () => {
  it.each(["london", "glasgow"] as const)("%s: keeps failed delivery gated, then tracks an accepted retry once with the correct report routing", async (location) => {
    mocks.submit.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    fireEvent.click(fillLead(location));
    await screen.findByText(/couldn't save your enquiry/);
    expect(screen.queryByRole("status")).toBeNull();
    expect((screen.getByLabelText("Email") as HTMLInputElement).value).toBe("test@example.test");
    expect(useWizard.getState().step).toBe("lead");
    expect(mocks.conversion).not.toHaveBeenCalled();
    expect(mocks.report).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "See my report" }));
    await waitFor(() => expect(mocks.conversion).toHaveBeenCalledTimes(1));
    expect(mocks.report).toHaveBeenCalledTimes(1);
    expect(mocks.submit).toHaveBeenLastCalledWith(expect.objectContaining({ clinicLocation: location }));
    expect(mocks.report).toHaveBeenCalledWith(expect.objectContaining({ clinicLocation: location }));
    expect(useWizard.getState().step).toBe("result");
  });

  it("does not send simultaneous repeated submissions or count before acceptance", async () => {
    let accept!: (value: boolean) => void;
    mocks.submit.mockReturnValue(new Promise<boolean>(resolve => { accept = resolve; }));
    const button = fillLead();
    fireEvent.click(button);
    fireEvent.click(button);
    expect(screen.getByRole("status").textContent).toContain("Saving your enquiry");
    expect(screen.queryByLabelText("Email")).toBeNull();
    expect(mocks.submit).toHaveBeenCalledTimes(1);
    expect(mocks.conversion).not.toHaveBeenCalled();
    accept(true);
    await waitFor(() => expect(mocks.conversion).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows actual analysis and saving stages, then restores the form on a request error", async () => {
    useWizard.getState().reset();
    useWizard.getState().goToLead();
    let finishAnalysis!: (value: ReturnType<typeof genericFallbackResult>) => void;
    let failSaving!: (reason: Error) => void;
    mocks.analysis.mockReturnValue(new Promise(resolve => { finishAnalysis = resolve; }));
    mocks.submit.mockReturnValue(new Promise((_, reject) => { failSaving = reject; }));
    fireEvent.click(fillLead());
    expect(screen.getByRole("status").textContent).toContain("Finishing your photo analysis");
    expect(mocks.submit).not.toHaveBeenCalled();
    finishAnalysis(genericFallbackResult(false));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Saving your enquiry"));
    expect(mocks.conversion).not.toHaveBeenCalled();
    failSaving(new Error("offline"));
    await screen.findByRole("alert");
    expect(screen.queryByRole("status")).toBeNull();
    expect((screen.getByLabelText("First name") as HTMLInputElement).value).toBe("Test");
    expect(mocks.conversion).not.toHaveBeenCalled();
    expect(useWizard.getState().step).toBe("lead");
  });
});
