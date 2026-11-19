import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Bucket, PhotoAssessment, ZoneKey } from "./types";
import { isSpotTypeKey } from "./spot-types";
import { serverEnv } from "./env";
import { SYSTEM_PIGMENTATION } from "./prompts/system-pigmentation";
import { RESULT_SCHEMA } from "./prompts/result-schema";
import { skinScan, skinScanNote } from "./skinscan";
import { reportAgreement } from "./skinscan-agreement";
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
  const scan = await skinScan(params.imageBase64);

  const message = await getClient().messages.create({
    model: env.ANTHROPIC_MODEL,
    // Thinking counts toward max_tokens, so leave room beyond the ~500-token JSON.
    // Claude Sonnet 5.5 rejects thinking {type:"disabled"}; it runs adaptive
    // thinking by default and effort controls how much.
    max_tokens: 8000,
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
          ...(scan ? [{ type: "text" as const, text: skinScanNote(scan) }] : []),
        ],
      },
    ],
  });

  if (message.stop_reason === "refusal") {
    throw new Error(`refusal: ${message.stop_details?.category ?? "unspecified"}`);
  }
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
    primarySpotType: string;
    secondarySpotType: string;
    framingAdequate: boolean;
    decisionReason?: string;
    headline: string;
    narrative: string;
    observedAreas: string[];
    encouragement: string;
  };
  // Decision trail for the server log only — scores and reasons, never the image.
  console.info("[analyze] decision", {
    suitability: raw.suitability,
    primary: raw.primarySpotType,
    framingAdequate: raw.framingAdequate,
    skinScan: scan?.top ?? null,
    reason: raw.decisionReason,
  });
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

  // Anything outside the fixed list ("none", or an unexpected value) is unclassified.
  const spotType = isSpotTypeKey(raw.primarySpotType) ? raw.primarySpotType : null;
  const secondarySpotType =
    spotType && isSpotTypeKey(raw.secondarySpotType) && raw.secondarySpotType !== spotType
      ? raw.secondarySpotType
      : null;

  // SkinScan agreement log (no effect on the result): only for readable photos.
  if (scan && raw.framingAdequate !== false) {
    const primary = spotType ?? "none";
    const top2 = Object.keys(scan.pattern ?? {}).slice(0, 2);
    reportAgreement(
      "pigmentation",
      { top: scan.top, top2, pattern: scan.pattern, version: scan.version },
      { primary, secondary: secondarySpotType },
      { agree_top: scan.top === primary, agree_claude_in_skinscan_top2: top2.includes(primary) },
    );
  }

  return {
    suitability: bucket,
    score,
    spotType,
    secondarySpotType,
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
