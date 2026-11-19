import { CLINIC, SITE_URL, getClinicLocation } from "@/lib/constants";
import { COURSE_PRICE, COURSE_SESSIONS, PRICE_PER_SESSION } from "@/lib/finance";
import { LANDING_CONTENT } from "@/lib/landing-content";
import type { ClinicLocationKey } from "@/lib/types";
import { PremiumLandingPage } from "./PremiumLandingPage";

function structuredData(location: ClinicLocationKey) {
  const content = LANDING_CONTENT[location];
  const clinic = getClinicLocation(location);
  const url = `${SITE_URL}${content.path}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "MedicalBusiness",
      "@id": `${url}#clinic`,
      name: `${CLINIC.name} ${clinic.city}`,
      url,
      image: `${SITE_URL}${content.heroPhoto.src}`,
      telephone: clinic.phoneHref.replace("tel:", ""),
      email: CLINIC.email,
      priceRange: "££",
      address: {
        "@type": "PostalAddress",
        streetAddress: clinic.lines[0],
        addressLocality: clinic.city,
        postalCode: clinic.lines[1]?.match(
          /[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}/,
        )?.[0],
        addressCountry: "GB",
      },
      employee: content.doctors.map((doctor) => ({
        "@type": "Person",
        name: doctor.name,
        jobTitle: doctor.role,
      })),
      makesOffer: {
        "@type": "Offer",
        name: "Signature Pigmentation Treatment",
        price: PRICE_PER_SESSION,
        priceCurrency: "GBP",
        description: `Price per session. A course of ${COURSE_SESSIONS} sessions is £${COURSE_PRICE}. Results vary.`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: content.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ];
}

export function LandingPage({ location }: { location: ClinicLocationKey }) {
  return <>
    {structuredData(location).map((data, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />)}
    <PremiumLandingPage location={location} />
  </>;
}
