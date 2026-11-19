"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, ScanFace, Pause, Play, RotateCcw, Check } from "lucide-react";
import { StartAnalysisLink, BookConsultationButton } from "./LandingActions";
import { PigmentationFace3D } from "./PigmentationFace3D";
import styles from "./AnalysisExplainer.module.css";

const patterns = [
  { name: "Melasma-like patches", short: "Melasma-like", area: "Cheeks · forehead · upper lip", description: "Broader, soft-edged patches that may appear on both sides of the face. The photo can suggest this pattern; your history helps a clinician distinguish its cause.", features: ["Soft, irregular edges", "Broad areas of darker tone", "Distribution on both cheeks"], plan: "Discuss triggers, skin tone and previous treatments before choosing an approach to patches." },
  { name: "Sun-spot-like marks", short: "Sun spots", area: "Cheeks · temples · forehead", description: "Separate, more clearly defined darker spots. The AI compares their outline and distribution with the surrounding skin rather than treating all dark areas as one concern.", features: ["Defined spot outlines", "Separated darker marks", "Location across exposed areas"], plan: "Have individual spots assessed before deciding whether a targeted treatment is appropriate." },
  { name: "Post-blemish-like marks", short: "Post-blemish", area: "Cheeks · jawline · around the mouth", description: "Scattered darker marks that may resemble pigmentation left after blemishes or irritation. A photo alone cannot establish whether inflammation caused them.", features: ["Scattered individual marks", "Contrast with nearby skin", "Cheek and jaw distribution"], plan: "Discuss earlier blemishes or irritation and any ongoing skin concerns when planning care." },
  { name: "Freckle-like patterns", short: "Freckles", area: "Nose · upper cheeks", description: "Small, scattered flecks across the central face. The AI considers how fine and dispersed the marks look, alongside other visible patterns.", features: ["Small, fine flecks", "Scattered distribution", "Nose and cheek location"], plan: "Discuss which marks concern you, your goals and whether treatment is needed or suitable." },
  { name: "Diffuse uneven tone", short: "Uneven tone", area: "Forehead · cheeks · wider facial areas", description: "Mottled areas of tone rather than one distinct spot. The AI considers the spread and contrast of visible unevenness, while accounting for areas hidden by shadows or coverage.", features: ["Mottled colour variation", "Wider areas of unevenness", "Less distinct spot boundaries"], plan: "Review the wider pattern, skincare and exposure history to plan care around your skin." },
  { name: "Under-eye pigmentation", short: "Under-eye", area: "Beneath the eyes", description: "Visible darkness around the under-eye area. Pigment, lighting and natural shadows can look similar in a selfie, so this area needs careful interpretation.", features: ["Under-eye location", "Brown or grey-brown appearance", "Visibility and lighting limits"], plan: "Ask your clinician to assess the source of the darkness before discussing treatment options." },
];
const patternImages = ["melasma", "sun-spots", "post-blemish", "freckles", "uneven-tone", "under-eye"];

export function AnalysisExplainer({ analysisPath, landingId }: { analysisPath: string; landingId: string }) {
  const [active, setActive] = useState(0);
  const [angle, setAngle] = useState(-18);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(true);
  const section = useRef<HTMLElement>(null);
  const id = useId().replace(/:/g, "");
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    update();
    preference.addEventListener("change", update);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.12 });
    if (section.current) observer.observe(section.current);
    return () => { observer.disconnect(); preference.removeEventListener("change", update); };
  }, []);
  useEffect(() => {
    if (!playing || !visible || reduced) return;
    const timer = window.setInterval(() => setActive(value => (value + 1) % patterns.length), 9000);
    return () => window.clearInterval(timer);
  }, [playing, visible, reduced]);
  const current = patterns[active];
  return <section ref={section} className={styles.section} aria-labelledby={`${id}-title`}>
    <div className={styles.heading}><p className={styles.eyebrow}>EXPLORE YOUR SKIN IN A DIFFERENT DIMENSION</p><h2 id={`${id}-title`}>Different patterns.<br /><em>A more personal starting point.</em></h2><p>Explore six pigmentation patterns our AI can suggest — and the visible features behind each one.</p></div>
    <div className={`${styles.experience} ${styles.patternExperience}`}>
      <div className={styles.mapColumn}>
        <div className={styles.faceStage}>
          <div className={styles.stageLabel}><ScanFace size={16} /> HSA · 3D PATTERN EXPLORER <span>EXAMPLE</span></div>
          <div className={styles.halo} aria-hidden="true" />
          <div className={styles.orbit} aria-hidden="true" />
          <PigmentationFace3D pattern={active} angle={angle} running={playing && visible && !reduced} />
          <div className={styles.mapBadge}><span /> {current.name}<small>{current.area}</small></div>
          <div className={styles.stageBottom}><span>ILLUSTRATIVE FACE · EXAMPLE OVERLAYS</span><span>0{active + 1} / 06</span></div>
        </div>
        <div className={styles.rotation}><label htmlFor={`${id}-rotation`}>Rotate the face</label><input id={`${id}-rotation`} type="range" min="-50" max="50" value={angle} onChange={event => { setAngle(Number(event.target.value)); setPlaying(false); }} aria-valuetext={`${angle} degrees`} /><button type="button" aria-label="Reset face rotation" onClick={() => { setAngle(0); setPlaying(false); }}><RotateCcw size={16} /></button></div>
        <p className={styles.overlayNote}>Raised overlays make the examples easier to see. Their height does not represent skin texture or pigment depth.</p>
      </div>
      <div className={`${styles.explanation} ${styles.patternExplanation}`}>
        <div className={styles.toolbar}><span>CHOOSE A PATTERN TO EXPLORE</span>{!reduced && <button type="button" onClick={() => setPlaying(value => !value)} aria-label={playing ? "Pause pattern tour" : "Play pattern tour"}>{playing ? <Pause size={15} /> : <Play size={15} />}{playing ? "Pause" : "Play"}</button>}</div>
        <div className={`${styles.patterns} ${styles.pictureOptions}`} role="group" aria-label="Six example pigmentation patterns">{patterns.map((pattern, index) => <button type="button" key={pattern.short} aria-pressed={active === index} onClick={() => { setActive(index); setPlaying(false); }}><Image src={`/illustrations/pigmentation/${patternImages[index]}-v1.png`} alt="" width={80} height={80} sizes="56px" /><span>0{index + 1}</span>{pattern.short}</button>)}</div>
        <div className={styles.patternCopy} key={active}><p className={styles.eyebrow}>WHAT THE AI LOOKS FOR</p><h3>{current.name}</h3><figure className={styles.selectedExample}><Image src={`/illustrations/pigmentation/${patternImages[active]}-v1.png`} alt={`AI-generated illustration of ${current.name.toLowerCase()}`} width={384} height={384} sizes="(max-width: 760px) 120px, 150px" /><figcaption><strong>Illustrative example</strong><span>{current.area}</span><small>AI-generated person.<br />Not a patient or treatment result.</small></figcaption></figure><p>{current.description}</p><ul>{current.features.map(feature => <li key={feature}><Check size={13} />{feature}</li>)}</ul><div className={styles.plan}><span>FROM YOUR PATTERN TO YOUR PLAN</span><p>{current.plan} Your clinician uses the report alongside a consultation to build a treatment plan around your concern, skin tone and suitability.</p></div></div>
        <StartAnalysisLink analysisPath={analysisPath} landingId={landingId} className={styles.cta}>Find my suggested pattern <ArrowUpRight size={17} /></StartAnalysisLink>
      </div>
    </div>
    <div className={styles.aiContext}><div><p className={styles.eyebrow}>AI INSIGHT. CLINICIAN-LED CARE.</p><h3>A detailed report.<br /><em>A plan built with you.</em></h3><p>Your photo analysis brings together visible patterns, affected areas and an explanation tailored to your result. Bring it to your free consultation to discuss the right next step.</p></div><div><ol><li><strong>01</strong><span><b>Check the photo</b>Lighting, blur, makeup and hidden areas affect what can be assessed.</span></li><li><strong>02</strong><span><b>Compare visible features</b>Pattern, tone contrast, shape and facial distribution guide the suggested result.</span></li><li><strong>03</strong><span><b>Plan with your clinician</b>Confirm the concern and suitability before choosing treatment.</span></li></ol><BookConsultationButton className={styles.consultCta} /></div></div>
    <details className={styles.modelNote}><summary>About the dermatology AI component</summary><p>Our optional SkinScan component uses Google’s Derm Foundation, a model fine-tuned on clinical dermatology images, together with a classifier trained on labelled pigmentation examples. When available, it provides a supporting signal for the photo analysis. The analysis can continue without this component, and its suggestions still need clinician review. <a href="https://developers.google.com/health-ai-developer-foundations/derm-foundation/model-card" target="_blank" rel="noopener noreferrer">Read about Derm Foundation ↗</a></p></details>
    <p className={styles.caption}>An educational 3D model, not a scan of your face. Your assessment uses a single photo and may be unclear or show mixed patterns. AI suggestions do not establish a diagnosis or guarantee treatment results.</p>
  </section>;
}
