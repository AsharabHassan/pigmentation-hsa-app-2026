import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Bucket, PhotoAssessment, ZoneKey } from "./types";
import { serverEnv } from "./env";
import { SYSTEM_PIGMENTATION } from "./prompts/system-pigmentation";
import { RESULT_SCHEMA } from "./prompts/result-schema";
import type { MediaType } from "@/store/wizard-store";

// ─────────────────────────────────────────────────────────────────────────────
// Server-only Claude Vision call. The system prompt is sent as a cached prefix;
// the photo goes in the user turn. Claude both chooses the cosmetic suitability
// outcome and writes the narrative; the route maps `suitability` to a Bucket.
// Zone geometry stays on-device — Claude only returns zone-level figures keyed
// to a fixed enum, never coordinates.
// ─────────────────────────────────────────────────────────────────────────────

const VALID: Bucket[] = ["great", "good", "consultation", "alternative"];
const MAP: Record<string, Bucket> = {
  strong: "great",
  good: "good",
  consultation: "consultation",
  alternative: "alternative",
};

/** Strict schema-enum → region-key lookup (the schema's zone values are fixed). */
const ZONE_MAP: Record<string, ZoneKey> = {
  forehead: "forehead",
  "under-eye": "undereye",
  nose: "nose",
  cheeks: "cheeks",
  "upper-lip": "upperlip",
  jawline: "jawline",
};

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: serverEnv().ANTHROPIC_API_KEY });
  return client;
}

export async function assessPhoto(params: {
  imageBase64: string;
  imageMediaType: MediaType;
}): Promise<PhotoAssessment> {
  const env = serverEnv();

  const message = await getClient().messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 700,
    thinking: { type: "disabled" },
    system: [
      {
        type: "text",
        text: SYSTEM_PIGMENTATION,
        cache_control: { type: "ephemeral" },
      },
    ],
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: RESULT_SCHEMA },
    },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: params.imageMediaType,
              data: params.imageBase64,
            },
          },
          {
            type: "text",
            text: "Assess this selfie for facial pigmentation and produce the personalised result as the structured fields.",
          },
        ],
      },
    ],
  });

  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("no text block");
  const raw = JSON.parse(block.text) as {
    suitability: string;
    pigmentClarity: number;
    skinQuality: number;
    toneUniformity: number;
    zonesObscured: string[];
    makeupDetected: boolean;
    zoneFindings: {
      zone: string;
      severityPercent: number;
      improvementPercent: number;
    }[];
    framingAdequate: boolean;
    headline: string;
    narrative: string;
    observedAreas: string[];
    encouragement: string;
  };
  const bucket = MAP[raw.suitability];
  if (
    !bucket ||
    !VALID.includes(bucket) ||
    typeof raw.headline !== "string" ||
    typeof raw.narrative !== "string" ||
    !Array.isArray(raw.observedAreas) ||
    typeof raw.encouragement !== "string"
  ) {
    throw new Error("malformed assessment");
  }

  // The score is the sum of Claude's three observed factors (0–100). Summing
  // independently-judged parts gives a genuine, face-specific number that varies
  // photo-to-photo, instead of anchoring to a band midpoint. Missing/invalid
  // factors → NaN, and buildResult falls back to the bucket midpoint.
  const factors = [raw.pigmentClarity, raw.skinQuality, raw.toneUniformity];
  const score = factors.every((n) => typeof n === "number" && Number.isFinite(n))
    ? factors.reduce((a, b) => a + b, 0)
    : NaN;

  // Map Claude's per-zone figures onto our region keys, clamped 0–100. Keep the
  // strongest figure when duplicates map to the same zone.
  const zoneSeverity: Record<string, number> = {};
  const zoneImprovement: Record<string, number> = {};
  if (Array.isArray(raw.zoneFindings)) {
    for (const item of raw.zoneFindings) {
      const zone = ZONE_MAP[String(item?.zone ?? "")];
      if (!zone) continue;
      const sev = Number(item?.severityPercent);
      const imp = Number(item?.improvementPercent);
      if (Number.isFinite(sev)) {
        const v = Math.max(0, Math.min(100, Math.round(sev)));
        if (zoneSeverity[zone] === undefined || v > zoneSeverity[zone]) {
          zoneSeverity[zone] = v;
        }
      }
      if (Number.isFinite(imp)) {
        const v = Math.max(0, Math.min(100, Math.round(imp)));
        if (zoneImprovement[zone] === undefined || v > zoneImprovement[zone]) {
          zoneImprovement[zone] = v;
        }
      }
    }
  }

  const zonesObscured: ZoneKey[] = Array.isArray(raw.zonesObscured)
    ? raw.zonesObscured
        .map((z) => ZONE_MAP[String(z ?? "")])
        .filter((z): z is ZoneKey => Boolean(z))
    : [];

  return {
    suitability: bucket,
    score,
    zonesObscured,
    makeupDetected: raw.makeupDetected === true,
    zoneSeverity,
    zoneImprovement,
    framingAdequate: raw.framingAdequate !== false,
    narrative: {
      headline: raw.headline,
      narrative: raw.narrative,
      observedAreas: raw.observedAreas,
      encouragement: raw.encouragement,
    },
  };
}
