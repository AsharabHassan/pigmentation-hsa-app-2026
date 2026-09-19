import { z } from "zod";
import { EVENT_TYPES } from "@/lib/insights";
import { recordEvent } from "@/lib/insights-store";

export const runtime = "nodejs";

const eventSchema = z
  .object({
    analysisId: z.string().uuid(),
    type: z.enum(EVENT_TYPES),
    detail: z.string().trim().max(120).nullish(),
  })
  .strict();

// POST /api/event — what the visitor did on the result page (saw the calendar,
// tapped a booking button, downloaded the report). First-party, keyed to the
// analysis id only, and always answers 204 so it can never disturb the page.
export async function POST(request: Request): Promise<Response> {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") {
    return new Response(null, { status: 204 });
  }

  try {
    const parsed = eventSchema.safeParse(await request.json());
    if (parsed.success) {
      const { analysisId, type, detail } = parsed.data;
      await recordEvent(analysisId, type, detail ?? null);
    }
  } catch {
    /* malformed beacon — ignore */
  }
  return new Response(null, { status: 204 });
}
