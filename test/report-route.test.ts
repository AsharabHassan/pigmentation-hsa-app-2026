import { afterEach, describe, expect, it, vi } from "vitest";

const { deliverReportToGhl } = vi.hoisted(() => ({
  deliverReportToGhl: vi.fn(),
}));

vi.mock("@/lib/ghl-report", () => ({ deliverReportToGhl }));

import { POST } from "@/app/api/report/route";

const validPdfBase64 = Buffer.from("%PDF-1.4\n%%EOF").toString("base64");

function reportRequest(overrides: Record<string, unknown> = {}): Request {
  return new Request("https://pigmentation.harleystreetaesthetic.co.uk/api/report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin: "https://pigmentation.harleystreetaesthetic.co.uk",
      "sec-fetch-site": "same-origin",
    },
    body: JSON.stringify({
      lead: {
        firstName: "Ava",
        lastName: "Example",
        email: "ava@example.com",
        phone: "+44 7700 900000",
      },
      suitabilityLabel: "Good candidate",
      score: 82,
      pdfBase64: validPdfBase64,
      reportStorageConsent: true,
      ...overrides,
    }),
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("POST /api/report", () => {
  it("stays in summary-only mode when server-side storage is disabled", async () => {
    vi.stubEnv("GHL_FULL_REPORT_STORAGE_ENABLED", "false");

    const response = await POST(reportRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      skipped: true,
      mode: "summary-only",
      reason: "full-report-storage-disabled",
    });
    expect(deliverReportToGhl).not.toHaveBeenCalled();
  });

  it("requires explicit report-storage consent even when the server flag is on", async () => {
    vi.stubEnv("GHL_FULL_REPORT_STORAGE_ENABLED", "true");

    const response = await POST(reportRequest({ reportStorageConsent: false }));

    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      skipped: true,
      mode: "summary-only",
      reason: "report-storage-consent-required",
    });
    expect(deliverReportToGhl).not.toHaveBeenCalled();
  });

  it("rejects a cross-origin full-report relay request", async () => {
    vi.stubEnv("GHL_FULL_REPORT_STORAGE_ENABLED", "true");
    const request = reportRequest();
    request.headers.set("origin", "https://attacker.example");
    request.headers.set("sec-fetch-site", "cross-site");

    const response = await POST(request);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      skipped: true,
      mode: "summary-only",
      error: "forbidden-report-origin",
    });
    expect(deliverReportToGhl).not.toHaveBeenCalled();
  });

  it("delivers a validated PDF only when both safety gates pass", async () => {
    vi.stubEnv("GHL_FULL_REPORT_STORAGE_ENABLED", "true");
    deliverReportToGhl.mockResolvedValue({ ok: true, emailed: true });

    const response = await POST(reportRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      mode: "full-report",
    });
    expect(deliverReportToGhl).toHaveBeenCalledOnce();
    expect(deliverReportToGhl).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "ava@example.com",
        pdfBase64: validPdfBase64,
        deleteAfter: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
      }),
    );
  });

  it("rejects malformed report data without attempting a GHL upload", async () => {
    vi.stubEnv("GHL_FULL_REPORT_STORAGE_ENABLED", "true");

    const response = await POST(reportRequest({ pdfBase64: "not base64" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      skipped: true,
      mode: "summary-only",
      error: "invalid-report-request",
    });
    expect(deliverReportToGhl).not.toHaveBeenCalled();
  });
});
