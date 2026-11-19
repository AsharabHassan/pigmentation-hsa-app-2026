import "server-only";

import { crmConfig, upsertCrmContact, type CrmRequestOptions } from "./crm-api";
import type { Lead } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Every lead into the clinic's own CRM (the CRM twin of lib/ghl-contact.ts):
// one upsert with the campaign/clinic tags and the lead's answers and results
// in their custom fields (lib/crm-fields.ts). Never throws.
// ─────────────────────────────────────────────────────────────────────────────

export interface CrmLeadResult {
  ok: boolean;
  skipped?: boolean;
  tagged?: boolean;
  contactId?: number;
  /** Custom fields written (keys only — never values). */
  fields?: number;
  customDropped?: boolean;
  error?: string;
}

export async function ensureLeadInCrm(
  input: {
    lead: Lead;
    source: string;
    tags: string[];
    custom: Record<string, string>;
  },
  options: CrmRequestOptions = {},
): Promise<CrmLeadResult> {
  const config = crmConfig();
  if (!config) return { ok: false, skipped: true };
  try {
    const result = await upsertCrmContact(
      config,
      {
        firstName: input.lead.firstName,
        lastName: input.lead.lastName,
        email: input.lead.email,
        phone: input.lead.phone,
        source: input.source,
        tags: input.tags,
        custom: input.custom,
      },
      options,
    );
    if (!result.ok) return { ok: false, error: result.error };
    return {
      ok: true,
      tagged: input.tags.length > 0,
      contactId: result.contactId,
      fields: result.customDropped ? 0 : Object.keys(input.custom).length,
      ...(result.customDropped ? { customDropped: true, error: "custom fields refused; contact saved without them" } : {}),
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "crm-lead-error" };
  }
}
