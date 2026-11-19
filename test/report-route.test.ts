import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";

const { deliverReportToGhl, deliverReportToCrm } = vi.hoisted(() => ({
  deliverReportToGhl: vi.fn(),
  deliverReportToCrm: vi.fn(),
}));

vi.mock("@/lib/ghl-report", () => ({ deliverReportToGhl }));
vi.mock("@/lib/crm-report", () => ({ deliverReportToCrm }));

import { POST, isSameOriginReportRequest } from "@/app/api/report/route";

const ORIGIN = "https://pigmentation.harleystreetaesthetic.co.uk";

/** A minimal, structurally valid base64 PDF that passes the magic-byte check. */
const PDF_BASE64 = Buffer.from("%PDF-1.4\nreport bytes\n").toString("base64");

function reportRequest(
  overrides: Record<string, unknown> = {},
  headers: Record<string, string> = {},
): Request {
  return new Request(`${ORIGIN}/api/report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin: ORIGIN,
      "sec-fetch-site": "same-origin",
      ...headers,
    },
    body: JSON.stringify({
      lead: {
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        phone: "07700900123",
      },
      suitabilityLabel: "Strong candidate",
      score: 88,
      clinicLocation: "london",
      pdfBase64: PDF_BASE64,
      ...overrides,
    }),
  });
}

beforeEach(() => {
  delete process.env.CRM_API_KEY;
  deliverReportToGhl.mockReset();
  deliverReportToGhl.mockResolvedValue({ ok: true, emailed: true, noted: true });
  deliverReportToCrm.mockReset();
  deliverReportToCrm.mockResolvedValue({ ok: true, emailed: true, noted: true });
});

describe("POST /api/report", () => {
  it("delivers the report automatically, with no feature flag or opt-in", async () => {
    const response = await POST(reportRequest());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      emailed: true,
    });
    expect(deliverReportToGhl).toHaveBeenCalledTimes(1);

    const input = deliverReportToGhl.mock.calls[0][0];
    expect(input).toMatchObject({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      pdfBase64: PDF_BASE64,
    });
    // The patient email carries the PDF and the booking link.
    expect(input.subject).toContain("pigmentation analysis report");
    expect(input.emailHtml).toContain("Hi Jane");
    expect(input.fileName).toBe("Pigmentation-Analysis-Report-Jane.pdf");
    expect(input.tags).toContain("hsa-clinic-london");
  });

  it("escapes the name so a crafted lead cannot inject HTML into the email", async () => {
    await POST(
      reportRequest({
        lead: {
          firstName: "<img src=x onerror=alert(1)>",
          lastName: "Doe",
          email: "jane@example.com",
          phone: "07700900123",
        },
      }),
    );
    const { emailHtml } = deliverReportToGhl.mock.calls[0][0];
    expect(emailHtml).not.toContain("<img src=x");
    expect(emailHtml).toContain("&lt;img src=x");
  });

  it("uses the Glasgow clinic details for Glasgow campaign reports", async () => {
    await POST(reportRequest({ clinicLocation: "glasgow" }));

    const input = deliverReportToGhl.mock.calls[0][0];
    expect(input.emailHtml).toContain("Harley Street Aesthetics Glasgow");
    expect(input.emailHtml).toContain(
      'href="https://app.harleystreetaesthetic.co.uk/book/harley-street-aesthetic/free-online-consultation-with-aesthetic-"',
    );
    expect(input.emailHtml).not.toContain("first_name=");
    expect(input.emailHtml).not.toContain("already filled in");
    expect(input.emailHtml).toContain("0141 488 8985");
    expect(input.noteBody).toContain("Glasgow pigmentation analysis report");
    expect(input.source).toBe("Pigmentation Analyzer · Glasgow");
    expect(input.tags).toContain("hsa-clinic-glasgow");
  });

  it("skips delivery for a missing email or a non-PDF payload", async () => {
    const noEmail = await POST(
      reportRequest({ lead: { firstName: "Jane", email: "not-an-email" } }),
    );
    await expect(noEmail.json()).resolves.toMatchObject({ skipped: true });

    const notAPdf = await POST(
      reportRequest({ pdfBase64: Buffer.from("hello").toString("base64") }),
    );
    await expect(notAPdf.json()).resolves.toMatchObject({ skipped: true });

    expect(deliverReportToGhl).not.toHaveBeenCalled();
  });

  it("refuses a cross-site caller so the endpoint cannot be used as a mail relay", async () => {
    const response = await POST(
      reportRequest({}, {
        origin: "https://attacker.example",
        "sec-fetch-site": "cross-site",
      }),
    );
    expect(response.status).toBe(403);
    expect(deliverReportToGhl).not.toHaveBeenCalled();
  });
});

describe("same-origin report guard", () => {
  it("accepts the app's own origin on any host, not just production", () => {
    for (const origin of [
      ORIGIN,
      "http://localhost:3000",
      "https://preview-project.vercel.app",
    ]) {
      const request = new Request(`${origin}/api/report`, {
        method: "POST",
        headers: { origin, "sec-fetch-site": "same-origin" },
      });
      expect(isSameOriginReportRequest(request)).toBe(true);
    }
  });

  it("rejects a caller that sends no browser origin headers", () => {
    expect(
      isSameOriginReportRequest(
        new Request(`${ORIGIN}/api/report`, { method: "POST" }),
      ),
    ).toBe(false);
  });

  it("rejects a mismatched origin", () => {
    expect(
      isSameOriginReportRequest(
        new Request(`${ORIGIN}/api/report`, {
          method: "POST",
          headers: { origin: "https://attacker.example" },
        }),
      ),
    ).toBe(false);
  });
});

describe("POST /api/report through the clinic CRM", () => {
  afterEach(() => {
    delete process.env.CRM_API_KEY;
    delete process.env.GHL_API_TOKEN;
    delete process.env.GHL_LOCATION_ID;
  });

  it("uses the CRM, not GoHighLevel, when CRM_API_KEY is set", async () => {
    process.env.CRM_API_KEY = "crm-test-key";
    process.env.GHL_API_TOKEN = "ghl-token";
    process.env.GHL_LOCATION_ID = "ghl-location";
    const response = await POST(reportRequest());
    await expect(response.json()).resolves.toMatchObject({ ok: true });
    expect(deliverReportToGhl).not.toHaveBeenCalled();
    expect(deliverReportToCrm).toHaveBeenCalledTimes(1);

    const input = deliverReportToCrm.mock.calls[0][0];
    expect(input).toMatchObject({
      email: "jane@example.com",
      fileName: "Pigmentation-Analysis-Report-Jane.pdf",
      subject: "Jane pigmentation analysis report",
      fileLabel: "London pigmentation analysis report",
      tags: expect.arrayContaining(["hsa-pigmentation-lead", "hsa-clinic-london"]),
    });
    // Same email as GoHighLevel's, with the CRM's private link instead of an attachment.
    const link = "https://app.harleystreetaesthetic.co.uk/file/7/abc";
    const html: string = input.emailHtml(link);
    expect(html).toContain(`href="${link}"`);
    expect(html).toContain("Hi Jane");
    expect(html).toContain("Choose your consultation time");
    expect(html).toContain(
      'href="https://app.harleystreetaesthetic.co.uk/book/harley-street-aesthetic/free-online-consultation-with-aesthetic-"',
    );
    expect(html).not.toContain("attached as a PDF");
    expect(html).not.toContain("{{");
    expect(input.noteBody).toContain("{url}");
  });

  it("keeps GoHighLevel when only the GHL env is set", async () => {
    process.env.GHL_API_TOKEN = "ghl-token";
    process.env.GHL_LOCATION_ID = "ghl-location";
    await POST(reportRequest());
    expect(deliverReportToCrm).not.toHaveBeenCalled();
    expect(deliverReportToGhl).toHaveBeenCalledTimes(1);
    const input = deliverReportToGhl.mock.calls[0][0];
    expect(input.emailHtml).toContain("attached as a PDF");
  });

  it("still answers 200 when the CRM delivery fails", async () => {
    process.env.CRM_API_KEY = "crm-test-key";
    vi.spyOn(console, "error").mockImplementation(() => {});
    deliverReportToCrm.mockResolvedValue({ ok: false, error: "contact-upsert 503" });
    const response = await POST(reportRequest());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: false });
  });
});
