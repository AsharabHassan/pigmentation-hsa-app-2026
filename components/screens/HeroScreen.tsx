"use client";

import { ArrowUpRight, Check, MapPin, ScanFace } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalysisPreview } from "@/components/analysis/AnalysisPreview";
import { useWizard } from "@/store/wizard-store";
import { JOURNEY } from "@/lib/consultation-journey";
import styles from "./HeroScreen.module.css";

export function HeroScreen() {
  const start = useWizard(s => s.start);
  return <section className={styles.hero}>
    <div className={styles.copy}>
      <p className={styles.eyebrow}><ScanFace size={16} /> STEP 1 OF YOUR FREE PIGMENTATION CONSULTATION</p>
      <h1>Stubborn spots.<br />Meet your<br /><em>next step.</em></h1>
      <p className={styles.strap}>AI insight. Doctor-led expertise.</p>
      <p className={styles.intro}>Start your consultation with a selfie. Our AI maps your visible dark spots and uneven tone into a pre-consultation report. Our team then calls you to go through it and book your free 15-minute online consultation, where our doctor-led team confirms the right plan for your skin.</p>
      <Button size="lg" onClick={start} className={styles.start}>Start my pre-consultation scan <ArrowUpRight size={19} /></Button>
      <p className={styles.micro}>About 60 seconds · Includes a call from our team · No obligation</p>
      <ul className={styles.benefits}>
        <li><Check size={16} /> See where visible pigmentation sits across six facial zones</li>
        <li><Check size={16} /> Get a pre-consultation report, saved to your clinic record</li>
        <li><Check size={16} /> A call from our team to book your free 15-minute consultation</li>
      </ul>
      <p className={styles.location}><MapPin size={13} /> Doctor-led clinics in London &amp; Glasgow</p>
      <p className={styles.note}>A cosmetic guide, not a diagnosis. Your clinician confirms the right treatment plan for your skin.</p>
    </div>
    <div className={styles.visual}><AnalysisPreview /></div>
    <div className={styles.journey}>
      {JOURNEY.map((stage, i) => (
        <div key={stage.key}><span>0{i + 1}</span><p>{stage.label}<small>{stage.detail}</small></p></div>
      ))}
    </div>
  </section>;
}
