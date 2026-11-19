import "server-only";

import { createHash } from "node:crypto";
import {
  addCrmContactFile,
  addCrmNote,
  crmConfig,
  sendCrmEmail,
  updateCrmContactCustom,
  upsertCrmContact,
  type CrmRequestOptions,
} from "./crm-api";
import { CRM_APP_SOURCE, CRM_REPORT_FIELD_KEY } from "./crm-fields";
import type { DeliverInput, DeliverResult } from "./ghl-report";

// ─────────────────────────────────────────────────────────────────────────────
// Delivers the report PDF through the clinic's own CRM (the CRM twin of
// lib/ghl-report.ts): upserts the contact, keeps the PDF on it (Files and
// pictures) with a private patient link, writes that link into the report
// field, adds the note and emails the patient the link. No-ops when
// CRM_API_KEY isn't set, and never throws.
// ─────────────────────────────────────────────────────────────────────────────

export interface CrmDeliverInput extends Omit<DeliverInput, "emailHtml" | "tags" | "source"> {
  source?: string;
  tags?: string[];
  /** The patient email, built around the report's private link. */
  emailHtml: (reportUrl: string) => string;
  /** Shown on the contact's file ("Pigmentation analysis report"). */
  fileLabel: string;
}

/**
 * The report's own id for the CRM (external_id): the same PDF always gets the
 * same id, so a retried upload returns the file already kept.
 */
export function reportExternalId(pdfBase64: string): string {
  const digest = createHash("sha256").update(Buffer.from(pdfBase64, "base64")).digest("hex");
  return `${CRM_APP_SOURCE}:report:${digest.slice(0, 40)}`;
}

export async function deliverReportToCrm(
  input: CrmDeliverInput,
  options: CrmRequestOptions = {},
): Promise<DeliverResult> {
  const config = crmConfig();
  if (!config) return { ok: false, skipped: true };

  try {
    // 1 ── the contact (found by email/phone; tags added, nothing overwritten)
    const contact = await upsertCrmContact(
      config,
      {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        source: input.source,
        tags: input.tags,
      },
      options,
    );
    if (!contact.ok || contact.contactId === undefined) {
      return { ok: false, error: contact.error ?? "contact-upsert" };
    }
    const contactId = contact.contactId;

    // 2 ── keep the PDF on the contact → the patient's private link
    const file = await addCrmContactFile(
      config,
      contactId,
      {
        filename: input.fileName,
        pdfBase64: input.pdfBase64,
        label: input.fileLabel,
        externalId: reportExternalId(input.pdfBase64),
      },
      options,
    );
    if (!file.ok || !file.publicUrl) {
      return { ok: false, contactId: String(contactId), tagged: Boolean(input.tags?.length), error: file.error };
    }
    const fileUrl = file.publicUrl;

    // 3 ── the link in the report field (the consultation tools read it)
    const field = await updateCrmContactCustom(config, contactId, { [CRM_REPORT_FIELD_KEY]: fileUrl }, options);

    // 4 ── the note with the link
    const note = await addCrmNote(config, contactId, input.noteBody.replace("{url}", fileUrl), options);

    // 5 ── email the patient their link
    const email = await sendCrmEmail(config, contactId, input.subject, input.emailHtml(fileUrl), options);

    const errors = [field.ok ? "" : `report-field ${field.error ?? field.status}`, note.ok ? "" : `note ${note.error ?? note.status}`, email.error ?? ""].filter(Boolean);
    return {
      ok: true,
      fileUrl,
      contactId: String(contactId),
      emailed: email.ok,
      noted: note.ok,
      tagged: Boolean(input.tags?.length),
      ...(errors.length ? { error: errors.join("; ") } : {}),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "crm-error" };
  }
}
