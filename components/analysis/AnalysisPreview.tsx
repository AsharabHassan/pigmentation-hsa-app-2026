import Image from "next/image";
import { Check, ScanFace } from "lucide-react";
import styles from "./AnalysisPreview.module.css";

/** An explicitly illustrative sample, never a clinical finding about the model. */
export function AnalysisPreview() {
  return <figure className={styles.preview} aria-label="Illustrative preview of a personalised AI pigmentation report">
    <div className={styles.portrait}>
      <Image src="/assets/hsa-cinematic/source/pigmentation-model-pexels-24735911.jpg" alt="Licensed model illustrating the skin analysis experience" fill priority sizes="(max-width: 760px) 90vw, 520px" />
      <div className={styles.tint} />
      <div className={styles.topline}><ScanFace size={17} /><span>HSA SKIN INTELLIGENCE</span><span>AI</span></div>
      <svg className={styles.map} viewBox="0 0 400 540" fill="none" aria-hidden="true">
        <path d="M196 121C126 121 87 187 95 264c6 67 51 143 101 158 57-19 111-90 119-158 9-77-45-143-119-143Z" stroke="#f5d89b" strokeOpacity=".5" strokeDasharray="3 5" />
        <path d="M113 242l83-74 99 74-99 48-77 57 77 40 80-40-80-57V168" stroke="#f5d89b" strokeOpacity=".35" />
        {[[196,168],[130,253],[274,253],[196,290],[180,338],[250,373]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="14" stroke="#ffe2a5" strokeOpacity=".7" /><circle cx={x} cy={y} r="4" fill="#ffe2a5" /></g>)}
      </svg>
      <div className={styles.scanline} aria-hidden="true" />
      <div className={styles.zoneLabel}>VISIBLE TONE & DARK SPOTS <span>6 FACIAL ZONES</span></div>
    </div>
    <div className={styles.report}>
      <span className={styles.reportIcon}><ScanFace size={22} /></span>
      <div><span className={styles.eyebrow}>YOUR PERSONALISED REPORT</span><h3>Know your skin.<br /><em>Explore your next step.</em></h3><p><Check size={12} /> Pigmentation map <Check size={12} /> Treatment guide</p></div>
    </div>
    <span className={styles.free}><strong>60</strong><span>SECONDS<br />TO BEGIN</span></span>
    <figcaption>Illustrative preview · Model photograph · Not a patient result</figcaption>
  </figure>;
}
