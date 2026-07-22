import { deliverReportToGhl } from "@/lib/ghl-report";
import { CLINIC, BOOKING_URL } from "@/lib/constants";

export const runtime = "nodejs";

interface ReportRequest {
  lead?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  suitabilityLabel?: string;
  score?: number;
  pdfBase64?: string;
  /** Explicit consent to store a face-containing PDF in the clinic CRM. */
  reportStorageConsent?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_BASE64_LENGTH = Math.ceil(MAX_PDF_BYTES / 3) * 4;

function summaryOnly(reason: string): Response {
  return Response.json({
    ok: true,
    skipped: true,
    mode: "summary-only",
    reason,
  });
}

function cleanText(value: string | undefined, maxLength: number): string {
  return (value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, maxLength);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function validPdfBase64(value: string): boolean {
  if (
    !value ||
    value.length > MAX_BASE64_LENGTH ||
    value.length % 4 !== 0 ||
    !BASE64_RE.test(value)
  ) {
    return false;
  }
  const bytes = Buffer.from(value, "base64");
  return (
    bytes.byteLength <= MAX_PDF_BYTES &&
    bytes.subarray(0, 5).toString("ascii") === "%PDF-"
  );
}

// POST /api/report — a browser-generated report arrives here as base64. A full
// face-containing PDF may enter GHL only when the visitor explicitly consents
// and operations has enabled the server-side flag after verifying its deletion
// workflow. Otherwise the request is deliberately kept in summary-only mode.
export async function POST(request: Request): Promise<Response> {
  let body: ReportRequest;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new TypeError("invalid report request");
    }
    body = parsed as ReportRequest;
  } catch {
    return Response.json(
      { ok: false, skipped: true, mode: "summary-only", error: "invalid-json" },
      { status: 400 },
    );
  }

  if (process.env.GHL_FULL_REPORT_STORAGE_ENABLED !== "true") {
    return summaryOnly("full-report-storage-disabled");
  }
  if (body.reportStorageConsent !== true) {
    return summaryOnly("report-storage-consent-required");
  }

  const lead = body.lead;
  const email = cleanText(lead?.email, 254);
  if (!EMAIL_RE.test(email) || !body.pdfBase64 || !validPdfBase64(body.pdfBase64)) {
    return Response.json(
      {
        ok: false,
        skipped: true,
        mode: "summary-only",
        error: "invalid-report-request",
      },
      { status: 400 },
    );
  }

  const first = cleanText(lead?.firstName, 80);
  const last = cleanText(lead?.lastName, 80);
  const phone = cleanText(lead?.phone, 40);
  const label = cleanText(body.suitabilityLabel, 120);
  const score = Number.isFinite(body.score) ? body.score : undefined;
  const emailFirst = escapeHtml(first || "there");

  const safeName = (first || "client").replace(/[^\w-]/g, "") || "client";
  const fileName = `Pigmentation-Analysis-Report-${safeName}.pdf`;
  const subject = `${first || "Your"} pigmentation analysis report`;

  const emailHtml = `
    <div style="font-family:Helvetica,Arial,sans-serif;color:#1c1a16;line-height:1.6">
      <p>Hi ${emailFirst},</p>
      <p>Thank you for taking the pigmentation analysis at
      <strong>${CLINIC.name}</strong>. Your personalised report is attached as a PDF.</p>
      <p>It's a guide to help you prepare — your suitability is always confirmed by
      a practitioner. When you're ready, book your free online consultation and
      we'll talk you through everything.</p>
      <p><a href="${BOOKING_URL}" style="color:#b8902a">Book your free online consultation →</a></p>
      <p style="color:#5c5852">— ${CLINIC.name}, ${CLINIC.byline}</p>
    </div>`;

  const noteParts = ["📄 Pigmentation analysis report"];
  if (label) noteParts.push(`— ${label}`);
  if (score !== undefined) noteParts.push(`(${score}/100)`);
  const noteBody = `${noteParts.join(" ")}: {url}`;

  const result = await deliverReportToGhl({
    firstName: first,
    lastName: last,
    email,
    phone,
    pdfBase64: body.pdfBase64,
    fileName,
    subject,
    emailHtml,
    noteBody,
  });

  // Log only the failure category; never include contact details or report data.
  if (!result.ok && !result.skipped) {
    console.error("[api/report] GHL full-report delivery failed");
  }
  return Response.json({ ...result, mode: "full-report" });
}
