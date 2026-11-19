import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Server-only environment access. Validated lazily so the bundle never leaks
// secrets to the client and missing config fails fast at request time, with a
// clear message, rather than as a cryptic SDK error.
// ─────────────────────────────────────────────────────────────────────────────

const serverSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-sonnet-5-5"),
  GHL_WEBHOOK_URL: z
    .string()
    .url("GHL_WEBHOOK_URL must be a valid URL")
    .optional(),
  // The Strategy Guys CRM workflow's inbound webhook. It gets the same payload
  // as GoHighLevel and sends the Meta Lead itself (with the page URL, which
  // Meta needs for this health-category business).
  CRM_LEAD_WEBHOOK_URL: z
    .string()
    .url("CRM_LEAD_WEBHOOK_URL must be a valid URL")
    .refine((v) => v.startsWith("https://"), "CRM_LEAD_WEBHOOK_URL must use https")
    .optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

/** Validate and return server env. Throws if required vars are missing. */
export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => i.message).join("; ");
    throw new Error(`Invalid server environment: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}
