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
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_BASE64_LENGTH = Math.ceil(MAX_PDF_BYTES / 3) * 4;

function cleanText(value: string | undefined, maxLength: number): string {
  // Strip control characters (including NUL and DEL) without embedding raw
  // control bytes in this source file.
  let out = "";
  for (const ch of value ?? "") {
    const code = ch.codePointAt(0) ?? 0;
    out += code < 0x20 || code === 0x7f ? " " : ch;
  }
  return out.trim().slice(0, maxLength);
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

/**
 * Keep the endpoint from being driven cross-site as a mail relay: an attacker
 * could otherwise POST any address + PDF and have the clinic's own GHL account
 * send it. Compared against the request's OWN origin, never a hardcoded one, so
 * this holds on localhost, previews and production alike. A caller with no
 * browser origin headers at all is allowed through — this guard must never be
 * the reason a real patient's report fails to send.
 */
export function isSameOriginReportRequest(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase();
  if (fetchSite && fetchSite !== "same-origin") return false;

  const originHeader = request.headers.get("origin")?.trim().toLowerCase();
  if (!originHeader) return true;

  try {
    return originHeader === new URL(request.url).origin.toLowerCase();
  } catch {
    return false;
  }
}

// POST /api/report — the browser-generated report PDF arrives here as base64.
// We upload it into GoHighLevel, write the hosted URL onto the contact, pin a
// note, and email the patient their copy with the PDF attached. This is the
// automatic report delivery: it runs on every lead, with no feature flag and no
// separate opt-in. Always returns 200 with a status summary so it never blocks
// the lead flow, and no-ops cleanly when the GHL env isn't configured.
export async function POST(request: Request): Promise<Response> {
  let body: ReportRequest;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new TypeError("invalid report request");
    }
    body = parsed as ReportRequest;
  } catch {
    return Response.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  if (!isSameOriginReportRequest(request)) {
    return Response.json(
      { ok: false, skipped: true, error: "forbidden-report-origin" },
      { status: 403 },
    );
  }

  const lead = body.lead;
  const email = cleanText(lead?.email, 254);
  if (!EMAIL_RE.test(email) || !body.pdfBase64 || !validPdfBase64(body.pdfBase64)) {
    return Response.json({ ok: false, skipped: true });
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

  // Surface the failure category in the server log without leaking the PDF or
  // the patient's contact details.
  if (!result.ok && !result.skipped) {
    console.error("[api/report] GHL delivery failed:", result.error);
  }
  return Response.json(result);
}
