import type { Metadata } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/constants";
import MetaPixel from "@/components/analytics/MetaPixel";

const playfair = Playfair_Display({
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Free AI Pigmentation & Dark Spot Analysis · Harley Street Aesthetics",
  description:
    "A 60-second AI analysis of dark spots, sun damage and uneven tone — and how our Signature Pigmentation Removal Treatment can help. Harley Street Aesthetics, London & Glasgow.",
  openGraph: {
    title:
      "Free AI Pigmentation & Dark Spot Analysis · Harley Street Aesthetics",
    description:
      "Take the 60-second pigmentation analysis with London's premier aesthetic centre and see what our Signature Pigmentation Removal Treatment could do for your skin.",
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
      </body>
    </html>
  );
}
