"use client";

import { ArrowUpRight, Check, MapPin, ScanFace } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalysisPreview } from "@/components/analysis/AnalysisPreview";
import { useWizard } from "@/store/wizard-store";
import { useClinicLocation } from "@/components/clinic/ClinicLocationContext";
import styles from "./HeroScreen.module.css";

export function HeroScreen() {
  const start = useWizard(s => s.start);
  const clinic = useClinicLocation();
  return <section className={styles.hero}>
    <div className={styles.copy}>
      <p className={styles.eyebrow}><ScanFace size={16} /> YOUR FREE AI PIGMENTATION ANALYSIS</p>
      <h1>Stubborn spots.<br />Meet your<br /><em>next step.</em></h1>
      <p className={styles.strap}>AI insight. Doctor-led expertise.</p>
      <p className={styles.intro}>You’ve tried covering them. Now take a closer look. One selfie gives you a personalised map of visible dark spots and uneven tone, with a guide to the clinic’s treatment options.</p>
      <Button size="lg" onClick={start} className={styles.start}>Try my free skin analysis <ArrowUpRight size={19} /></Button>
      <p className={styles.micro}>About 60 seconds · No app to download · No obligation</p>
      <ul className={styles.benefits}>
        <li><Check size={16} /> See where visible pigmentation sits across six facial zones</li>
        <li><Check size={16} /> Explore how our pigmentation treatments could help</li>
        <li><Check size={16} /> Get your personal report by email, ready for a clinician review</li>
      </ul>
      <p className={styles.location}><MapPin size={13} /> Doctor-led care in {clinic.city}</p>
      <p className={styles.note}>A cosmetic guide, not a diagnosis. Your clinician confirms the right treatment plan for your skin.</p>
    </div>
    <div className={styles.visual}><AnalysisPreview /></div>
    <div className={styles.journey}>
      <div><span>01</span><p>Your selfie<small>A clear photo in natural light.</small></p></div>
      <div><span>02</span><p>Your insight<small>A personal pigmentation map & report.</small></p></div>
      <div><span>03</span><p>Your next step<small>Explore options with our doctor-led team.</small></p></div>
    </div>
  </section>;
}
