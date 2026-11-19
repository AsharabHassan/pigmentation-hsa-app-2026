import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/constants";
import MetaPixel from "@/components/analytics/MetaPixel";
import GoogleAds from "@/components/analytics/GoogleAds";
import GoogleTagManager from "@/components/analytics/GoogleTagManager";

const playfair = Cormorant_Garamond({
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const montserrat = Manrope({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Free AI Pigmentation & Dark Spot Analysis · Harley Street Aesthetics",
  description:
    "A 60-second AI analysis of dark spots, sun damage and uneven tone — and how our revolutionary new Signature Pigmentation Treatment can help. Harley Street Aesthetics, London & Glasgow.",
  openGraph: {
    title:
      "Free AI Pigmentation & Dark Spot Analysis · Harley Street Aesthetics",
    description:
      "Take the 60-second pigmentation analysis with London & Glasgow's premier aesthetic clinic and see what our revolutionary new Signature Pigmentation Treatment could do for your skin.",
    url: SITE_URL,
    siteName: "Harley Street Aesthetics",
    locale: "en_GB",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-GB"
      className={`${playfair.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
        <MetaPixel />
        <GoogleAds />
        <GoogleTagManager />
      </body>
    </html>
  );
}
