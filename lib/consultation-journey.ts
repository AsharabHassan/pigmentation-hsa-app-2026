import type { Step } from "@/store/wizard-store";

/**
 * The client journey shown on every screen. The AI report is step 2 of 4, so
 * the result never reads as the end: the consultation is the step that counts.
 */
export const JOURNEY = [
  {
    key: "scan",
    label: "Photo scan",
    short: "Scan",
    detail: "A clear selfie in natural light.",
  },
  {
    key: "report",
    label: "Pre-consultation report",
    short: "Report",
    detail: "Your personal pigmentation map, prepared for our clinicians.",
  },
  {
    key: "consultation",
    label: "Free consultation",
    short: "Consultation",
    detail: "We call you to book 15 minutes online with our doctor-led team.",
  },
  {
    key: "plan",
    label: "Your treatment plan",
    short: "Plan",
    detail: "Confirmed treatment, sessions and price.",
  },
] as const;

/** Index of the journey stage the client is currently on, or -1 on the hero. */
export function journeyIndex(step: Step): number {
  switch (step) {
    case "consent":
    case "scan":
    case "retake":
      return 0;
    case "lead":
      return 1;
    case "result":
      return 2;
    default:
      return -1;
  }
}
