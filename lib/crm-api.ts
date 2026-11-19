import "server-only";

import { randomUUID } from "node:crypto";
import { CRM_APP_SOURCE } from "./crm-fields";

// ─────────────────────────────────────────────────────────────────────────────
// The clinic's own CRM (API v1, docs/api.md in the CRM repo). Replaces the
// direct GoHighLevel API calls when CRM_API_KEY is set. Small and dependency
// free: every call has a timeout and ONE retry on a 5xx answer, a timeout or a
// network error. Nothing here throws — callers get { ok, status, data, error }
// and carry on, because a CRM problem must never fail the patient's request.
// The key is only ever sent in the Authorization header, never logged.
// ─────────────────────────────────────────────────────────────────────────────

/** The CRM's main address. File uploads go here (clinic domains cap uploads at 5 MB). */
export const CRM_DEFAULT_BASE = "https://app.crm.strategyguys.agency/api/v1";
/** The Harley Street Aesthetics sub-account (X-Account header). */
export const CRM_DEFAULT_ACCOUNT = "harley-street-aesthetic";

const TIMEOUT_MS = 8_000;
const UPLOAD_TIMEOUT_MS = 20_000;
const RETRY_DELAY_MS = 400;

export interface CrmConfig {
  base: string;
  key: string;
  account: string;
}

/** The CRM connection from the environment, or null when CRM_API_KEY is not set. */
export function crmConfig(): CrmConfig | null {
  const key = process.env.CRM_API_KEY?.trim();
  if (!key || key.includes("REPLACE")) return null;
  const base = (process.env.CRM_API_BASE?.trim() || CRM_DEFAULT_BASE).replace(/\/+$/, "");
  const account = process.env.CRM_ACCOUNT?.trim() || CRM_DEFAULT_ACCOUNT;
  return { base, key, account };
}

/** True when leads and reports go to the CRM instead of GoHighLevel. */
export function crmConfigured(): boolean {
  return crmConfig() !== null;
}

export interface CrmResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  /** "<status> <code>" (or "timeout" / "network") — never the key or the patient's details. */
  error?: string;
  attempts: number;
}

export interface CrmRequestOptions {
  timeoutMs?: number;
  /** Waits between the first attempt and the retry (tests pass a no-op). */
  wait?: (ms: number) => Promise<void>;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function errorCode(status: number, data: unknown): string {
  const code = (data as { error?: { code?: unknown } } | null)?.error?.code;
  return typeof code === "string" && /^[\w.-]{1,40}$/.test(code) ? `${status} ${code}` : String(status);
}

/**
 * One CRM API call. Retries once on a 5xx answer, a timeout or a network
 * error; the same Idempotency-Key goes with the retry, so a POST that did land
 * the first time is not done twice.
 */
export async function crmRequest<T>(
  config: CrmConfig,
  method: "GET" | "POST" | "PATCH",
  path: string,
  body?: unknown,
  options: CrmRequestOptions = {},
): Promise<CrmResult<T>> {
  const wait = options.wait ?? sleep;
  const timeoutMs = options.timeoutMs ?? TIMEOUT_MS;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.key}`,
    "X-Account": config.account,
    "X-Source": CRM_APP_SOURCE,
    Accept: "application/json",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") headers["Idempotency-Key"] = randomUUID();
  const payload = body === undefined ? undefined : JSON.stringify(body);

  let last: CrmResult<T> = { ok: false, status: 0, data: null, error: "network", attempts: 0 };
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${config.base}${path}`, {
        method,
        headers,
        body: payload,
        signal: controller.signal,
      });
      const data = (await res.json().catch(() => null)) as T | null;
      last = res.ok
        ? { ok: true, status: res.status, data, attempts: attempt }
        : { ok: false, status: res.status, data, error: errorCode(res.status, data), attempts: attempt };
      if (res.status < 500) return last;
    } catch (error) {
      const timedOut = controller.signal.aborted || (error instanceof Error && error.name === "AbortError");
      last = { ok: false, status: 0, data: null, error: timedOut ? "timeout" : "network", attempts: attempt };
    } finally {
      clearTimeout(timer);
    }
    if (attempt < 2) await wait(RETRY_DELAY_MS);
  }
  return last;
}

// ── contacts ────────────────────────────────────────────────────────────────

export interface CrmContactInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source?: string;
  tags?: string[];
  /** CRM custom field key → value. Overwrites only the keys sent. */
  custom?: Record<string, string>;
}

export interface CrmUpsertResult {
  ok: boolean;
  contactId?: number;
  created?: boolean;
  /** True when the CRM refused the custom fields and the contact was saved without them. */
  customDropped?: boolean;
  error?: string;
}

interface CrmContactBody {
  created?: boolean;
  contact?: { id?: number };
}

/**
 * POST /contacts — finds the contact by email/phone (name, email and phone
 * only fill blanks), overwrites the custom keys sent and adds the tags. If the
 * CRM refuses the custom fields (400: a field changed type or options), the
 * contact is saved again without them so the lead itself is never lost.
 */
export async function upsertCrmContact(
  config: CrmConfig,
  input: CrmContactInput,
  options: CrmRequestOptions = {},
): Promise<CrmUpsertResult> {
  const base: Record<string, unknown> = {
    first_name: input.firstName || undefined,
    last_name: input.lastName || undefined,
    email: input.email || undefined,
    phone: input.phone || undefined,
    ...(input.source ? { source: input.source } : {}),
    ...(input.tags?.length ? { tags: input.tags } : {}),
  };
  const custom = input.custom && Object.keys(input.custom).length ? input.custom : undefined;
  let res = await crmRequest<CrmContactBody>(config, "POST", "/contacts", custom ? { ...base, custom } : base, options);
  let customDropped = false;
  if (!res.ok && custom && res.status === 400) {
    customDropped = true;
    res = await crmRequest<CrmContactBody>(config, "POST", "/contacts", base, options);
  }
  const contactId = res.data?.contact?.id;
  if (!res.ok || typeof contactId !== "number") {
    return { ok: false, customDropped, error: `contact-upsert ${res.error ?? res.status}` };
  }
  return { ok: true, contactId, created: res.data?.created === true, customDropped };
}

/** PATCH /contacts/{id} {custom} — merges the keys sent. */
export async function updateCrmContactCustom(
  config: CrmConfig,
  contactId: number,
  custom: Record<string, string>,
  options: CrmRequestOptions = {},
): Promise<CrmResult<unknown>> {
  return crmRequest(config, "PATCH", `/contacts/${contactId}`, { custom }, options);
}

/** POST /contacts/{id}/notes. */
export async function addCrmNote(
  config: CrmConfig,
  contactId: number,
  body: string,
  options: CrmRequestOptions = {},
): Promise<CrmResult<unknown>> {
  return crmRequest(config, "POST", `/contacts/${contactId}/notes`, { body: body.slice(0, 10_000) }, options);
}

export interface CrmFileInput {
  filename: string;
  pdfBase64: string;
  label: string;
  /** The report's own id: a retry with the same id returns the file already kept. */
  externalId: string;
}

interface CrmFileBody {
  created?: boolean;
  file?: { id?: number; public_url?: string | null };
}

/** POST /contacts/{id}/files — keeps the PDF on the contact and returns the patient's private link. */
export async function addCrmContactFile(
  config: CrmConfig,
  contactId: number,
  file: CrmFileInput,
  options: CrmRequestOptions = {},
): Promise<{ ok: boolean; publicUrl?: string; fileId?: number; error?: string }> {
  const res = await crmRequest<CrmFileBody>(
    config,
    "POST",
    `/contacts/${contactId}/files`,
    {
      filename: file.filename,
      content_type: "application/pdf",
      data_base64: file.pdfBase64,
      kind: "test_report",
      label: file.label,
      external_id: file.externalId,
    },
    { timeoutMs: UPLOAD_TIMEOUT_MS, ...options },
  );
  const publicUrl = res.data?.file?.public_url;
  if (!res.ok || typeof publicUrl !== "string" || !/^https:\/\//.test(publicUrl)) {
    return { ok: false, error: `file-upload ${res.error ?? res.status}` };
  }
  return { ok: true, publicUrl, fileId: res.data?.file?.id };
}

/**
 * POST /contacts/{id}/messages {channel: "email"} — sent from the clinic's CRM
 * mailbox (HTML is detected; Do Not Disturb and opt-outs are respected). The
 * CRM refuses any leftover "{{", so the body is checked here first.
 */
export async function sendCrmEmail(
  config: CrmConfig,
  contactId: number,
  subject: string,
  html: string,
  options: CrmRequestOptions = {},
): Promise<{ ok: boolean; error?: string }> {
  if (subject.includes("{{") || html.includes("{{")) return { ok: false, error: "email-template-braces" };
  const res = await crmRequest(config, "POST", `/contacts/${contactId}/messages`, { channel: "email", subject, body: html }, options);
  return res.ok ? { ok: true } : { ok: false, error: `email ${res.error ?? res.status}` };
}
