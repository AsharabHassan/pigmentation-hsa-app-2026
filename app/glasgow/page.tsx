import type { Metadata } from "next";
import { WizardShell } from "@/components/wizard/WizardShell";

export const metadata: Metadata = {
  title:
    "Free Cosmetic Pigmentation Analysis in Glasgow · Harley Street Aesthetics",
  description:
    "Upload a selfie for a personalised cosmetic report, then book a free online consultation with the doctor-led Harley Street Aesthetics Glasgow team.",
  alternates: { canonical: "/glasgow" },
  openGraph: {
    title:
      "Free Cosmetic Pigmentation Analysis in Glasgow · Harley Street Aesthetics",
    description:
      "Map visible tone variation in a personalised cosmetic report, then discuss a bespoke treatment plan with our doctor-led Glasgow team.",
    url: "/glasgow",
  },
};

export default function GlasgowPigmentationAnalysis() {
  return <WizardShell clinicLocation="glasgow" />;
}
