import Image from "next/image";

import { Cormorant_Garamond, Manrope } from "next/font/google";

import { ArrowUpRight, Check, MapPin, Phone, Star } from "lucide-react";

import { ClinicLocationProvider } from "@/components/clinic/ClinicLocationContext";

import { ResultsGallery } from "@/components/result/ResultsGallery";

import { FinanceCalculator } from "@/components/result/FinanceCalculator";

import { BookingCalendar } from "@/components/result/BookingCalendar";

import { CLINIC, DISCLAIMER, PRICE_GUIDE, PROGRAMME_MECHANISM, PROTOCOL_STEPS, PROTOCOL_SUPPORT, RESULTS_VARY, SESSIONS_GUIDE, TREATMENT_CONCERNS, getClinicLocation } from "@/lib/constants";

import { PRICE_PER_SESSION } from "@/lib/finance";

import { LANDING_CONTENT, LANDING_STEPS } from "@/lib/landing-content";

import type { ClinicLocationKey } from "@/lib/types";

import { BookConsultationButton, LandingStickyBar, StartAnalysisLink } from "./LandingActions";

import { AnalysisPreview } from "@/components/analysis/AnalysisPreview";
import { AnalysisExplainer } from "./AnalysisExplainer";

import { SampleReportMock } from "./SampleReportMock";


import styles from "./LandingPage.module.css";
import { ProgrammeStory } from "@/components/result/ProgrammeStory";



const editorial = Cormorant_Garamond({ weight: ["400", "500", "600"], style: ["normal", "italic"], subsets: ["latin"], variable: "--font-editorial", display: "swap" });

const sans = Manrope({ subsets: ["latin"], variable: "--font-landing-sans", display: "swap" });

const points = ["Talk through your skin concerns with our doctor-led team", "You leave with your exact plan and price", "No obligation. It is a conversation, not a commitment"];



export function PremiumLandingPage({ location }: { location: ClinicLocationKey }) {

  const content = LANDING_CONTENT[location];

  const clinic = getClinicLocation(location);

  const cta = { analysisPath: content.analysisPath, landingId: content.landingId };

  const facts = [

    { value: "Free", label: "your personal skin analysis" },
    { value: "60 sec", label: "to begin understanding your skin" },
    { value: "6 zones", label: "visible pigmentation, mapped" },
    { value: "1:1", label: "free online consultation" },
  ];

  return <ClinicLocationProvider location={location}>

    <div className={`${styles.page} ${editorial.variable} ${sans.variable}`} data-landing-route={content.path}>

      <a className={styles.skip} href="#main">Skip to content</a>

      <div className={styles.announcement}>YOUR SKIN, UNDERSTOOD. YOUR FIRST STEP, FREE. <span>LONDON & GLASGOW</span></div>

      <header className={styles.header}>

        <a href={content.path} className={styles.brand} aria-label="Harley Street Aesthetics home"><Image src="/landing/hsa-logo.png" width={76} height={76} alt="HSA — Harley Street Aesthetics" priority /><span>HARLEY STREET<small>A E S T H E T I C S</small></span></a>

        <nav aria-label="Page navigation" className={styles.nav}><a href="#approach">The approach</a><a href="#results">Real results</a><a href="#clinic">Our clinic</a></nav>

        <a href={clinic.phoneHref} className={styles.headerPhone} aria-label={`Call our ${clinic.city} clinic on ${clinic.phone}`}><Phone size={15} /><span>{clinic.phone}</span></a>

        <StartAnalysisLink {...cta} className={styles.headerCta}>Try my free analysis <ArrowUpRight size={15} /></StartAnalysisLink>

      </header>

      <main id="main">

        <section className={`${styles.wrap} ${styles.hero}`} aria-labelledby="hero-title">

          <div className={styles.heroCopy}>

            <p className={styles.eyebrow}><span /> {content.eyebrow.toUpperCase()}</p>
            <h1 id="hero-title">{content.h1Lead}<em>{content.h1Accent}</em></h1>

            <p className={styles.intro}>{content.intro}</p>

            <ul className={styles.proof}>{content.localProof.map(item => <li key={item}><Check size={14} />{item}</li>)}</ul>

            <div className={styles.heroActions}><StartAnalysisLink {...cta} className={styles.primary}>Get my free skin analysis <ArrowUpRight size={19} /></StartAnalysisLink><BookConsultationButton className={styles.secondary} /></div>

            <p className={styles.micro}>Free · About 60 seconds · No obligation · Or call <a href={clinic.phoneHref}>{clinic.phone}</a></p>

            <div className={styles.trust}><span className={styles.stars} aria-label="Google rating">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={12} fill="currentColor" />)}</span><span><strong>{content.googleRating.score}/5</strong> on Google{content.googleRating.reviews ? ` · ${content.googleRating.reviews} reviews` : ""}</span><span className={styles.trustDivider} /><span>Doctor-led care</span></div>

          </div>

          <div className={styles.analysisHeroArt}><AnalysisPreview /></div>

        </section>

        <AnalysisExplainer {...cta} />

        <section className={`${styles.wrap} ${styles.facts}`} aria-label="Treatment at a glance">{facts.map(fact => <div key={fact.label}><strong>{fact.value}</strong><span>{fact.label}</span></div>)}</section>

        <section id="approach" className={`${styles.wrap} ${styles.journey}`}>

          <div><p className={styles.eyebrow}>01 / UNDERSTAND YOUR SKIN</p><h2>A little insight.<br /><em>A clearer next step.</em></h2></div>

          <div><p className={styles.lead}>Great care starts with understanding. Map your visible pigmentation, then explore your options with our doctor-led team.</p><ol className={styles.steps}>{LANDING_STEPS.map(step => <li key={step.step}><span>{step.step}</span><div><h3>{step.title}</h3><p>{step.blurb}</p></div><ArrowUpRight size={19} /></li>)}</ol><p className={styles.smallPrint}>The AI analysis is a cosmetic guide, not a diagnosis. Your practitioner confirms suitability before treatment.</p></div>

          <div className={styles.reportPanel}><div className={styles.reportMock}><SampleReportMock /></div><div><p className={styles.eyebrow}>YOUR PATTERN, YOUR NEXT STEP</p><h3>More than a dark-spot map.<br /><em>A report about your skin.</em></h3><p>Your analysis can suggest melasma-like patches, sun spots, post-blemish marks, freckles, diffuse sun-related unevenness or under-eye pigmentation. It explains the closest visible pattern and affected areas, so you can bring focused questions to your consultation.</p><p>A single photo cannot establish the cause or confirm a diagnosis. Your clinician reviews your history, skin tone and suitability before recommending treatment.</p><StartAnalysisLink {...cta} className={styles.primary}>Explore my pigmentation pattern <ArrowUpRight size={17} /></StartAnalysisLink></div></div>

        </section>

        <section id="clinic" className={styles.clinicSection}>

          <div className={`${styles.wrap} ${styles.clinicHeading}`}><div><p className={styles.eyebrow}>02 / THE CLINIC EXPERIENCE</p><h2>Clinical expertise.<br /><em>A considered setting.</em></h2></div><div><p>{content.aboutBody[0]}</p><address><MapPin size={17} /><span>{clinic.lines.join(", ")}</span></address></div></div>

          <div className={`${styles.wrap} ${styles.clinicGallery}`}><figure className={styles.reception}><Image src="/clinic/glasgow-reception-wide.webp" alt="Reception and waiting area at the Glasgow clinic, Ingram House" fill sizes="(max-width: 760px) 92vw, 70vw" /><figcaption>INGRAM HOUSE · GLASGOW</figcaption></figure><figure className={styles.clinicDetail}><Image src="/clinic/glasgow-waiting-area.webp" alt="Seating and interior details at our Glasgow clinic" fill sizes="(max-width: 760px) 44vw, 28vw" /><figcaption>A LITTLE SPACE TO EXHALE</figcaption></figure></div>

          <div className={`${styles.wrap} ${styles.clinicCaption}`}><span>Photography from our Glasgow clinic, featured across our London and Glasgow pages.</span><a href={clinic.phoneHref}>Speak to our {clinic.city} team ↗</a></div>

        </section>

        <section className={`${styles.wrap} ${styles.protocol}`}>

          <div><p className={styles.eyebrow}>03 / OUR SIGNATURE TREATMENT</p><h2>The 3R Programme.<br /><em>Repair, don’t damage.</em></h2><p className={styles.lead}>{PROGRAMME_MECHANISM}</p><p className={styles.price}>£{PRICE_PER_SESSION}<small>per session · or {PRICE_GUIDE.course}</small></p><p className={styles.smallPrint}>{SESSIONS_GUIDE.note} {RESULTS_VARY}</p><StartAnalysisLink {...cta} className={styles.primary}>Try my free skin analysis <ArrowUpRight size={17} /></StartAnalysisLink></div>

          <ol className={styles.protocolSteps}>{PROTOCOL_STEPS.map((step, i) => <li key={step.title}><span>0{i + 1}</span><div><h3>{step.title}</h3><p>{step.blurb}</p></div></li>)}<li className={styles.support}>{PROTOCOL_SUPPORT}</li></ol>

        </section>

        <section className={styles.wrap}><div className={styles.darkWidget}><ProgrammeStory /></div></section>

{/* Treatment films removed: the footage showed laser and VirtueRF, which are not part of the Signature Treatment. Add new treatment footage here once filmed. */}

        <section id="results" className={`${styles.wrap} ${styles.results}`}>

          <div className={styles.splitHeading}><div><p className={styles.eyebrow}>04 / REAL PATIENTS</p><h2>The difference is<br /><em>in the detail.</em></h2></div><p>Explore our patients’ pigmentation results. Drag each image to compare. Individual results vary; your likely outcome is discussed at consultation.</p></div>

          <div className={styles.darkWidget}><ResultsGallery wide /></div><p className={styles.smallPrint}>Clinical images are shown with patient consent. Individual results vary.</p>

          <div className={styles.concerns}><span>LET’S TALK ABOUT</span>{[...TREATMENT_CONCERNS, "Sun spots & age spots", "Melasma-type patches"].map(c => <span key={c}>{c}</span>)}</div><p className={styles.smallPrint}>New, changing or worrying marks should be checked by a doctor before cosmetic treatment.</p>

        </section>

        <section className={styles.teamSection}><div className={styles.wrap}><div className={styles.splitHeading}><div><p className={styles.eyebrow}>05 / THE PEOPLE BEHIND YOUR CARE</p><h2>Expert hands.<br /><em>A personal connection.</em></h2></div><p>Meet the medical team in {clinic.city}. A practitioner confirms your suitability before any treatment begins.</p></div>

          <ul className={styles.doctors}>{content.doctors.map(doctor => <li key={doctor.name}><div className={styles.doctorPortrait}>{doctor.photo ? <Image src={doctor.photo} alt={doctor.name} fill sizes="(max-width: 640px) 44vw, 280px" /> : <span aria-hidden="true">DF</span>}</div><p className={styles.doctorRole}>{doctor.role}</p><h3>{doctor.name}</h3><p>{doctor.bio}</p></li>)}</ul>

        </div></section>

        <section className={`${styles.wrap} ${styles.finance}`}><div><p className={styles.eyebrow}>06 / CARE, AT YOUR PACE</p><h2>Invest in your skin.<br /><em>On your terms.</em></h2><p className={styles.lead}>Explore payment options before you decide. Your exact treatment plan and price are confirmed at your free consultation.</p><p className={styles.smallPrint}>Klarna · Clearpay · Ideal4Finance<br />Finance is subject to status and affordability. 18+.</p></div><div className={styles.darkWidget}><FinanceCalculator /></div></section>

        <section className={styles.faqSection}><div className={`${styles.wrap} ${styles.faqLayout}`}><div><p className={styles.eyebrow}>07 / A LITTLE CLARITY</p><h2>Good questions.<br /><em>Thoughtful answers.</em></h2><p>Pigmentation removal in {clinic.city}, explained.</p></div><div>{content.faqs.map(faq => <details key={faq.question}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}</div></div></section>

        <section className={`${styles.wrap} ${styles.booking}`}><div><p className={styles.eyebrow}>YOUR NEXT CHAPTER</p><h2>Let’s start<br />with <em>you.</em></h2><p className={styles.lead}>Book a free 15-minute online consultation with our {clinic.city} team. Your questions, your skin, your next step.</p><ul>{points.map(point => <li key={point}><Check size={16} />{point}</li>)}</ul><a className={styles.textLink} href={clinic.phoneHref}><Phone size={15} /> {clinic.phone}</a><div className={styles.bookingAnalysis}><StartAnalysisLink {...cta} className={styles.primary}>Try my free skin analysis <ArrowUpRight size={17} /></StartAnalysisLink></div></div><div className={styles.darkWidget}><BookingCalendar points={points} /></div></section>

      </main>

      <footer className={styles.footer}><div className={styles.wrap}><div className={styles.footerTop}><Image src="/landing/hsa-logo.png" width={100} height={100} alt="Harley Street Aesthetics" /><p>Science-led care.<br /><em>Beautifully personal.</em></p><a href="#main" aria-label="Back to top">↑</a></div>

        <div className={styles.footerClinics}>{[clinic, ...CLINIC.locations.filter(item => item.key !== location)].map(item => <div key={item.key}><h3>{item.city}</h3><p>{item.lines.join(", ")}</p><a href={item.phoneHref}>{item.phone}</a></div>)}<div><h3>Let’s talk.</h3><a href={CLINIC.whatsappHref}>WhatsApp {CLINIC.whatsapp}</a><a href={`mailto:${CLINIC.email}`}>{CLINIC.email}</a><p>{CLINIC.hours}</p></div></div>

        <p className={styles.footerDisclaimer}>{DISCLAIMER}</p><div className={styles.footerBottom}><span>© {new Date().getFullYear()} {CLINIC.name}</span><span>{CLINIC.byline}</span><a href={clinic.phoneHref}>{clinic.phone}</a></div></div></footer>

      <div className={styles.darkWidget}><LandingStickyBar {...cta} /></div>

    </div>

  </ClinicLocationProvider>;

}

