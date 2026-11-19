import { deliverReportToGhl } from "@/lib/ghl-report";
import { crmConfigured } from "@/lib/crm-api";
import { deliverReportToCrm } from "@/lib/crm-report";
import {
  CLINIC,
  getClinicLocation,
  isClinicLocationKey,
} from "@/lib/constants";
import type { ClinicLocationKey } from "@/lib/types";

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
  clinicLocation?: ClinicLocationKey;
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
 * this holds on localhost, previews and production alike. The app always sends
 * an Origin header for this JSON POST, so callers without one are rejected.
 */
export function isSameOriginReportRequest(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase();
  if (fetchSite && fetchSite !== "same-origin") return false;

  const originHeader = request.headers.get("origin")?.trim().toLowerCase();
  if (!originHeader) return false;

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
  const clinicLocation = isClinicLocationKey(body.clinicLocation)
    ? body.clinicLocation
    : "london";
  const clinic = getClinicLocation(clinicLocation);

  // Straight to the clinic's CRM booking page — not a contact form. The CRM
  // page reads no contact details from the link, so nothing is prefilled.
  const bookingLink = clinic.calendarUrl;

  const safeName = (first || "client").replace(/[^\w-]/g, "") || "client";
  const fileName = `Pigmentation-Analysis-Report-${safeName}.pdf`;
  const subject = `${first || "Your"} pigmentation analysis report`;

  // GoHighLevel attaches the PDF; the CRM sends the patient's private link to it.
  const reportEmailHtml = (reportUrl?: string) => `
    <div style="font-family:Helvetica,Arial,sans-serif;color:#1c1a16;line-height:1.6">
      <p>Hi ${emailFirst},</p>
      <p>Thank you for taking the pigmentation analysis at
      <strong>${CLINIC.name} ${clinic.city}</strong>. ${
        reportUrl
          ? `Your personalised report is ready: <a href="${escapeHtml(reportUrl)}" style="color:#b8902a">open your report (PDF)</a>.`
          : "Your personalised report is attached as a PDF."
      }</p>
      <p>It's a guide to help you prepare — your suitability is always confirmed by
      a practitioner. When you're ready, book your free online consultation and
      we'll talk you through everything.</p>
      <p style="margin:6px 0"><strong>On your free 15-minute online consultation:</strong></p>
      <ul style="margin:0 0 18px;padding-left:20px">
        <li>A practitioner has already reviewed this report</li>
        <li>You get your exact plan and price</li>
        <li>No obligation</li>
      </ul>
      <p><a href="${escapeHtml(bookingLink)}" style="display:inline-block;background:#b8902a;color:#ffffff;text-decoration:none;font-weight:bold;padding:13px 26px;border-radius:999px">Choose your consultation time</a></p>
      <p style="font-size:13px;color:#5c5852">Prefer to talk? Call us on ${clinic.phone}.</p>
      <p style="color:#5c5852">— ${CLINIC.name}, ${clinic.city}</p>
    </div>`;

  const noteParts = [`📄 ${clinic.city} pigmentation analysis report`];
  if (label) noteParts.push(`— ${label}`);
  if (score !== undefined) noteParts.push(`(${score}/100)`);
  const noteBody = `${noteParts.join(" ")}: {url}`;

  const delivery = {
    firstName: first,
    lastName: last,
    email,
    phone,
    pdfBase64: body.pdfBase64,
    fileName,
    subject,
    noteBody,
    source: `Pigmentation Analyzer · ${clinic.city}`,
    tags: [
      "pigmentation-analyzer",
      "hsa-pigmentation-lead",
      "hsa-source-pigmentation-app",
      `hsa-clinic-${clinic.key}`,
    ],
  };
  // The clinic CRM when CRM_API_KEY is set, else GoHighLevel as before.
  const destination = crmConfigured() ? "CRM" : "GHL";
  const result =
    destination === "CRM"
      ? await deliverReportToCrm({
          ...delivery,
          emailHtml: reportEmailHtml,
          fileLabel: `${clinic.city} pigmentation analysis report`,
        })
      : await deliverReportToGhl({ ...delivery, emailHtml: reportEmailHtml() });

  // Surface the failure category in the server log without leaking the PDF or
  // the patient's contact details.
  if (!result.ok && !result.skipped) {
    console.error(`[api/report] ${destination} delivery failed:`, result.error);
  } else if (result.ok && result.error) {
    console.warn(`[api/report] ${destination} delivery incomplete:`, result.error);
  }
  return Response.json(result);
}
