import type { Metadata } from "next";
import { WizardShell } from "@/components/wizard/WizardShell";

export const metadata: Metadata = {
  title: "Your Photo · Glasgow Pigmentation Analysis · HSA",
  robots: { index: false, follow: true },
};

export default function GlasgowCameraAnalysis() {
  return <WizardShell clinicLocation="glasgow" startAtCamera />;
}
