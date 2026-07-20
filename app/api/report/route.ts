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

// POST /api/report — generate-side report PDF arrives here as base64; we upload it
// into GoHighLevel, attach it to the contact (note) and email the client a copy.
// Always returns 200 with a status summary so it never blocks the lead flow.
export async function POST(request: Request): Promise<Response> {
  let body: ReportRequest;
  try {
    body = (await request.json()) as ReportRequest;
  } catch {
    return Response.json({ ok: false, error: "invalid json" });
  }

  const lead = body.lead;
  if (!lead?.email || !body.pdfBase64) {
    return Response.json({ ok: false, skipped: true });
  }

  const first = (lead.firstName ?? "").trim();
  const last = (lead.lastName ?? "").trim();
  const label = body.suitabilityLabel ?? "";
  const score = Number.isFinite(body.score) ? body.score : undefined;

  const safeName = (first || "client").replace(/[^\w-]/g, "");
  const fileName = `Pigmentation-Analysis-Report-${safeName}.pdf`;
  const subject = `${first || "Your"} pigmentation analysis report`;

  const emailHtml = `
    <div style="font-family:Helvetica,Arial,sans-serif;color:#1c1a16;line-height:1.6">
      <p>Hi ${first || "there"},</p>
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
    email: lead.email,
    phone: lead.phone ?? "",
    pdfBase64: body.pdfBase64,
    fileName,
    subject,
    emailHtml,
    noteBody,
  });

  // Surface failures in the server log without leaking the PDF.
  if (!result.ok && !result.skipped) {
    console.error("[api/report] GHL delivery failed:", result.error);
  }
  return Response.json(result);
}
