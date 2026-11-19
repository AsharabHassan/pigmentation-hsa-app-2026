import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CRM_DEFAULT_ACCOUNT, CRM_DEFAULT_BASE, crmConfigured } from "@/lib/crm-api";
import { ensureLeadInCrm } from "@/lib/crm-lead";
import { deliverReportToCrm, reportExternalId } from "@/lib/crm-report";
import { CRM_REPORT_FIELD_KEY, crmLeadCustomFields } from "@/lib/crm-fields";
import { buildGhlPayload } from "@/lib/ghl";
import type { AnalyzeResult, Lead } from "@/lib/types";

const fetchMock = vi.fn();
const noWait = { wait: async () => {} };
const PUBLIC_URL = "https://app.harleystreetaesthetic.co.uk/file/7/4c9e0b2a7d5f3e8c06ad9b2f4e7c5a3d8b0f6e2a";
const PDF = Buffer.from("%PDF-1.4\nreport bytes\n").toString("base64");

const lead: Lead = { firstName: "Jane", lastName: "Doe", email: "jane@example.com", phone: "07700900123" };
const result: AnalyzeResult = {
  bucket: "great", score: 88, hardFlags: [], softFlagged: false, routedReason: "ideal",
  usedPhoto: true, zonesObscured: [], makeupDetected: false, zoneSeverity: {}, zoneImprovement: {},
  framingAdequate: true, narrativeSource: "claude", spotType: "melasma",
  narrative: { headline: "Soft patches on both cheeks", narrative: "n", observedAreas: ["cheeks", "forehead"], encouragement: "e" },
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const call = (i: number) => {
  const [url, init] = fetchMock.mock.calls[i] as [string, RequestInit];
  return { url, init, headers: init.headers as Record<string, string>, body: init.body ? JSON.parse(String(init.body)) : undefined };
};

beforeEach(() => {
  process.env.CRM_API_KEY = "crm-test-key";
  delete process.env.CRM_API_BASE;
  delete process.env.GHL_API_TOKEN;
  delete process.env.GHL_LOCATION_ID;
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.CRM_API_KEY;
  delete process.env.CRM_API_BASE;
});

describe("CRM configuration", () => {
  it("is used only when CRM_API_KEY is set", () => {
    expect(crmConfigured()).toBe(true);
    delete process.env.CRM_API_KEY;
    expect(crmConfigured()).toBe(false);
    process.env.CRM_API_KEY = "REPLACE_ME";
    expect(crmConfigured()).toBe(false);
  });
});

describe("ensureLeadInCrm", () => {
  const payload = buildGhlPayload(lead, result, {
    submittedAt: "2026-11-19T10:00:00.000Z",
    clinicLocation: "glasgow",
    imageProcessingConsent: true,
    metaTrackingConsent: false,
  });

  it("upserts the contact with its tags and the answers in CRM custom fields", async () => {
    fetchMock.mockResolvedValueOnce(json({ created: true, contact: { id: 4773 } }, 201));
    const out = await ensureLeadInCrm({ lead, source: "Pigmentation Analyzer · Glasgow", tags: payload.tags, custom: crmLeadCustomFields(payload) }, noWait);

    expect(out).toMatchObject({ ok: true, tagged: true, contactId: 4773 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const c = call(0);
    expect(c.url).toBe(`${CRM_DEFAULT_BASE}/contacts`);
    expect(c.init.method).toBe("POST");
    expect(c.headers.Authorization).toBe("Bearer crm-test-key");
    expect(c.headers["X-Account"]).toBe(CRM_DEFAULT_ACCOUNT);
    expect(c.headers["Idempotency-Key"]).toBeTruthy();
    expect(c.body).toMatchObject({
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@example.com",
      phone: "07700900123",
      source: "Pigmentation Analyzer · Glasgow",
      tags: expect.arrayContaining(["hsa-pigmentation-lead", "hsa-clinic-glasgow", "pigmentation-great"]),
      custom: {
        suitability_score: "88",
        assessment_label: "Strong candidate",
        assessment_zones: "cheeks, forehead",
        hsa_pigmentation_summary: "Soft patches on both cheeks",
        hsa_meta_tracking_consent: "false",
        primary_concern: "Melasma",
        time_of_form_submission: "2026-11-19T10:00:00.000Z",
        form_submitted_treatment: "Pigmentation Analysis",
      },
    });
  });

  it("saves the contact without custom fields when the CRM refuses them", async () => {
    fetchMock
      .mockResolvedValueOnce(json({ error: { code: "validation", message: "Gender: bad" } }, 400))
      .mockResolvedValueOnce(json({ created: false, contact: { id: 12 } }));
    const out = await ensureLeadInCrm({ lead, source: "s", tags: ["t"], custom: { assessment_label: "x" } }, noWait);
    expect(out).toMatchObject({ ok: true, contactId: 12, customDropped: true });
    expect(call(0).body.custom).toEqual({ assessment_label: "x" });
    expect(call(1).body.custom).toBeUndefined();
    expect(call(1).body.tags).toEqual(["t"]);
  });

  it("retries once on a 5xx answer, then gives up without throwing", async () => {
    fetchMock.mockResolvedValue(json({ error: { code: "internal" } }, 503));
    const out = await ensureLeadInCrm({ lead, source: "s", tags: [], custom: {} }, noWait);
    expect(out.ok).toBe(false);
    expect(out.error).toContain("503");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // the retry carries the same Idempotency-Key
    expect(call(1).headers["Idempotency-Key"]).toBe(call(0).headers["Idempotency-Key"]);
  });

  it("retries once after a timeout or network error", async () => {
    const abort = Object.assign(new Error("aborted"), { name: "AbortError" });
    fetchMock.mockRejectedValueOnce(abort).mockResolvedValueOnce(json({ created: true, contact: { id: 5 } }, 201));
    const out = await ensureLeadInCrm({ lead, source: "s", tags: [], custom: {} }, noWait);
    expect(out).toMatchObject({ ok: true, contactId: 5 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a 4xx answer", async () => {
    fetchMock.mockResolvedValue(json({ error: { code: "unauthorized" } }, 401));
    const out = await ensureLeadInCrm({ lead, source: "s", tags: [], custom: {} }, noWait);
    expect(out).toMatchObject({ ok: false, error: "contact-upsert 401 unauthorized" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("uses CRM_API_BASE when set and skips cleanly without a key", async () => {
    process.env.CRM_API_BASE = "https://crm.example/api/v1/";
    fetchMock.mockResolvedValueOnce(json({ created: true, contact: { id: 1 } }, 201));
    await ensureLeadInCrm({ lead, source: "s", tags: [], custom: {} }, noWait);
    expect(call(0).url).toBe("https://crm.example/api/v1/contacts");

    delete process.env.CRM_API_KEY;
    fetchMock.mockClear();
    await expect(ensureLeadInCrm({ lead, source: "s", tags: [], custom: {} })).resolves.toEqual({ ok: false, skipped: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("deliverReportToCrm", () => {
  const emailHtml = (url: string) => `<p>Hi Jane, <a href="${url}">open your report (PDF)</a></p>`;
  const input = {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    phone: "07700900123",
    pdfBase64: PDF,
    fileName: "Pigmentation-Analysis-Report-Jane.pdf",
    subject: "Jane pigmentation analysis report",
    emailHtml,
    noteBody: "📄 London pigmentation analysis report — Strong candidate (88/100): {url}",
    source: "Pigmentation Analyzer · London",
    tags: ["hsa-pigmentation-lead", "hsa-clinic-london"],
    fileLabel: "London pigmentation analysis report",
  };

  function happyPath() {
    fetchMock
      .mockResolvedValueOnce(json({ created: false, contact: { id: 4773 } }))
      .mockResolvedValueOnce(json({ created: true, file: { id: 51, public_url: PUBLIC_URL } }, 201))
      .mockResolvedValueOnce(json({ contact: { id: 4773 } }))
      .mockResolvedValueOnce(json({ note: { id: 1 } }, 201))
      .mockResolvedValueOnce(json({ message: { id: 2 } }, 201));
  }

  it("keeps the PDF on the contact, writes the link field, adds the note and emails the link", async () => {
    happyPath();
    const out = await deliverReportToCrm(input, noWait);
    expect(out).toMatchObject({ ok: true, fileUrl: PUBLIC_URL, contactId: "4773", noted: true, emailed: true, tagged: true });
    expect(out.error).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(5);

    const upsert = call(0);
    expect(upsert.url).toBe(`${CRM_DEFAULT_BASE}/contacts`);
    expect(upsert.body).toMatchObject({ email: "jane@example.com", tags: input.tags, source: input.source });

    const file = call(1);
    expect(file.url).toBe(`${CRM_DEFAULT_BASE}/contacts/4773/files`);
    expect(file.body).toEqual({
      filename: "Pigmentation-Analysis-Report-Jane.pdf",
      content_type: "application/pdf",
      data_base64: PDF,
      kind: "test_report",
      label: "London pigmentation analysis report",
      external_id: reportExternalId(PDF),
    });

    const field = call(2);
    expect(field.url).toBe(`${CRM_DEFAULT_BASE}/contacts/4773`);
    expect(field.init.method).toBe("PATCH");
    expect(field.body).toEqual({ custom: { [CRM_REPORT_FIELD_KEY]: PUBLIC_URL } });

    const note = call(3);
    expect(note.url).toBe(`${CRM_DEFAULT_BASE}/contacts/4773/notes`);
    expect(note.body.body).toContain(PUBLIC_URL);
    expect(note.body.body).not.toContain("{url}");

    const email = call(4);
    expect(email.url).toBe(`${CRM_DEFAULT_BASE}/contacts/4773/messages`);
    expect(email.body).toMatchObject({ channel: "email", subject: "Jane pigmentation analysis report" });
    expect(email.body.body).toContain(PUBLIC_URL);
    expect(email.body.body).not.toContain("{{");
  });

  it("uses the same external id for the same PDF, so a retry never duplicates the file", () => {
    expect(reportExternalId(PDF)).toBe(reportExternalId(PDF));
    expect(reportExternalId(PDF)).not.toBe(reportExternalId(Buffer.from("%PDF-1.4\nother").toString("base64")));
    expect(reportExternalId(PDF).length).toBeLessThanOrEqual(200);
  });

  it("never sends an email that still holds template braces", async () => {
    fetchMock
      .mockResolvedValueOnce(json({ created: false, contact: { id: 9 } }))
      .mockResolvedValueOnce(json({ created: true, file: { id: 1, public_url: PUBLIC_URL } }, 201))
      .mockResolvedValueOnce(json({}))
      .mockResolvedValueOnce(json({}, 201));
    const out = await deliverReportToCrm({ ...input, emailHtml: () => "<p>Hi {{contact.first_name}}</p>" }, noWait);
    expect(out).toMatchObject({ ok: true, emailed: false, noted: true });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("stops after a failed upload and never throws on network errors", async () => {
    fetchMock
      .mockResolvedValueOnce(json({ created: false, contact: { id: 9 } }))
      .mockResolvedValueOnce(json({ error: { code: "too_large" } }, 413));
    await expect(deliverReportToCrm(input, noWait)).resolves.toMatchObject({ ok: false, contactId: "9", error: "file-upload 413 too_large" });

    fetchMock.mockReset();
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    await expect(deliverReportToCrm(input, noWait)).resolves.toMatchObject({ ok: false, error: "contact-upsert network" });
  });

  it("reports a failed note or email without failing the delivery", async () => {
    fetchMock
      .mockResolvedValueOnce(json({ created: false, contact: { id: 9 } }))
      .mockResolvedValueOnce(json({ created: true, file: { id: 1, public_url: PUBLIC_URL } }, 201))
      .mockResolvedValueOnce(json({}))
      .mockResolvedValueOnce(json({ error: { code: "validation" } }, 400))
      .mockResolvedValueOnce(json({ error: { code: "dnd" } }, 422));
    const out = await deliverReportToCrm(input, noWait);
    expect(out).toMatchObject({ ok: true, noted: false, emailed: false, fileUrl: PUBLIC_URL });
    expect(out.error).toContain("note 400");
    expect(out.error).toContain("email 422");
  });

  it("is skipped when CRM_API_KEY is not set", async () => {
    delete process.env.CRM_API_KEY;
    await expect(deliverReportToCrm(input)).resolves.toEqual({ ok: false, skipped: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
