import { create } from "zustand";
import type { AnalyzeResult, Lead } from "@/lib/types";
import type { NormalizedPoint } from "@/components/scan/useFaceLandmarker";

// ─────────────────────────────────────────────────────────────────────────────
// The wizard is a small, explicit state machine: hero → consent → scan → lead →
// result. The result cannot be revealed until a lead is captured. The selfie and
// its on-device face landmarks are kept in memory (never persisted, never sent to
// a server beyond the stateless /api/analyze call) so the result screen can show
// the user their own cropped treatment areas; reset() drops everything.
// ─────────────────────────────────────────────────────────────────────────────

export type Step = "hero" | "consent" | "scan" | "retake" | "lead" | "result";

export type MediaType = "image/jpeg" | "image/png" | "image/webp";

interface WizardState {
  step: Step;
  imageConsent: boolean;
  imageBase64: string | null;
  imageMediaType: MediaType;
  landmarks: NormalizedPoint[] | null;
  lead: Lead | null;
  result: AnalyzeResult | null;
  error: string | null;

  // transitions
  start: () => void;
  setImageConsent: (v: boolean) => void;
  setImage: (base64: string, mediaType: MediaType) => void;
  setLandmarks: (pts: NormalizedPoint[] | null) => void;
  beginScan: () => void;
  completeScan: () => void;
  goToLead: () => void;
  setLead: (lead: Lead) => void;
  setResult: (result: AnalyzeResult) => void;
  reveal: () => void;
  clearImage: () => void;
  setError: (msg: string | null) => void;
  goToStep: (step: Step) => void;
  retakePhoto: () => void;
  reset: () => void;
}

const initial = {
  step: "hero" as Step,
  imageConsent: false,
  imageBase64: null as string | null,
  imageMediaType: "image/jpeg" as MediaType,
  landmarks: null as NormalizedPoint[] | null,
  lead: null as Lead | null,
  result: null as AnalyzeResult | null,
  error: null as string | null,
};

export const useWizard = create<WizardState>((set, get) => ({
  ...initial,

  start: () => set({ step: "consent" }),

  setImageConsent: (v) => set({ imageConsent: v }),

  setImage: (base64, mediaType) =>
    set({ imageBase64: base64, imageMediaType: mediaType }),

  setLandmarks: (landmarks) => set({ landmarks }),

  beginScan: () => {
    const { imageConsent, imageBase64 } = get();
    if (!imageConsent || !imageBase64) return; // blocked
    set({ step: "scan" });
  },

  completeScan: () => set({ step: "lead" }),

  goToLead: () => set({ step: "lead" }),

  setLead: (lead) => set({ lead }),

  // Store the analysis result as soon as it's computed (during the scan), without
  // advancing the step — the result stays hidden until the lead gate is passed.
  setResult: (result) => set({ result }),

  reveal: () => {
    // Gated behind lead capture; the result is already computed during the scan.
    // The selfie + landmarks are kept (in memory only) so the result screen can
    // show the user their own cropped treatment areas. reset() drops them.
    if (!get().lead || !get().result) return;
    set({ step: "result" });
  },

  clearImage: () => set({ imageBase64: null }),

  setError: (msg) => set({ error: msg }),

  goToStep: (step) => set({ step }),

  // Drop the current photo + read and return to the capture step for a retake
  // (e.g. when the lower face / neck wasn't framed well enough to assess).
  retakePhoto: () =>
    set({
      imageBase64: null,
      landmarks: null,
      result: null,
      step: "consent",
    }),

  reset: () => set({ ...initial }),
}));
