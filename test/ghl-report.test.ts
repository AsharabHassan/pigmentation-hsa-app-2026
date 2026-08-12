import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deliverReportToGhl } from "@/lib/ghl-report";

const fetchMock = vi.fn();

beforeEach(() => {
  process.env.GHL_API_TOKEN = "test-token";
  process.env.GHL_LOCATION_ID = "test-location";
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GHL_API_TOKEN;
  delete process.env.GHL_LOCATION_ID;
});

describe("deliverReportToGhl", () => {
  it("adds Glasgow campaign tags without overwriting existing contact tags", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ url: "https://cdn.example/report.pdf" }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ contact: { id: "contact-1" } }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(new Response("{}", { status: 200 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    const result = await deliverReportToGhl({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      phone: "07700900123",
      pdfBase64: Buffer.from("%PDF-1.4\nreport").toString("base64"),
      fileName: "report.pdf",
      subject: "Your report",
      emailHtml: "<p>Your report</p>",
      noteBody: "Glasgow report: {url}",
      source: "Pigmentation Analyzer · Glasgow",
      tags: ["hsa-pigmentation-lead", "hsa-clinic-glasgow"],
    });

    expect(result).toMatchObject({
      ok: true,
      contactId: "contact-1",
      tagged: true,
      noted: true,
      emailed: true,
    });

    const upsert = fetchMock.mock.calls[1];
    expect(upsert[0]).toBe(
      "https://services.leadconnectorhq.com/contacts/upsert",
    );
    expect(JSON.parse(upsert[1].body)).toMatchObject({
      source: "Pigmentation Analyzer · Glasgow",
      customFields: [
        {
          key: "facial_app_report_pdf",
          fieldValue: "https://cdn.example/report.pdf",
        },
      ],
    });

    const addTags = fetchMock.mock.calls[2];
    expect(addTags[0]).toBe(
      "https://services.leadconnectorhq.com/contacts/contact-1/tags",
    );
    expect(JSON.parse(addTags[1].body)).toEqual({
      tags: ["hsa-pigmentation-lead", "hsa-clinic-glasgow"],
    });
  });
});
