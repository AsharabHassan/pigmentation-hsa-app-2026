import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";
import { LANDING_CONTENT } from "@/lib/landing-content";

const content = LANDING_CONTENT.glasgow;

export const metadata: Metadata = {
  title: content.metaTitle,
  description: content.metaDescription,
  alternates: { canonical: content.path },
  openGraph: {
    title: content.metaTitle,
    description: content.metaDescription,
    url: content.path,
  },
};

export default function Page() {
  return <LandingPage location="glasgow" />;
}
