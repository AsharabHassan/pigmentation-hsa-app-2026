import type { Metadata } from "next";
import { WizardShell } from "@/components/wizard/WizardShell";

export const metadata: Metadata = {
  title: "Your Photo · London Pigmentation Analysis · HSA",
  robots: { index: false, follow: true },
};

export default function LondonCameraAnalysis() {
  return <WizardShell clinicLocation="london" startAtCamera />;
}
