"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, Sparkles } from "lucide-react";
import styles from "./ReportLoadingScreen.module.css";

export function ReportLoadingScreen({ stage }: { stage: "analysis" | "saving" }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [takingLonger, setTakingLonger] = useState(false);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView?.({ block: "center", behavior: "instant" });
    const timer = window.setTimeout(() => setTakingLonger(true), 12000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section className={styles.screen} aria-labelledby="report-loading-heading">
      <div className={styles.art} aria-hidden="true">
        <div className={styles.orbit} />
        <div className={styles.report}>
          <Sparkles size={22} strokeWidth={1.3} />
          <span className={styles.reportTitle}>YOUR SKIN GUIDE</span>
          <div className={styles.face}>
            <span /><span /><span />
          </div>
          <div className={styles.line} /><div className={styles.shortLine} />
          <div className={styles.scan} />
        </div>
        <span className={styles.badge}><FileText size={20} strokeWidth={1.5} /></span>
      </div>
      <p className={styles.eyebrow}>A little clarity for your skin</p>
      <h2 ref={heading} tabIndex={-1} id="report-loading-heading" className={styles.heading}>
        Preparing your<br />personalised report
      </h2>
      <p className={styles.intro}>
        Your pigmentation guide and next steps will appear here as soon as they’re ready.
      </p>
      <div role="status" aria-live="polite" aria-atomic="true" className={styles.status}>
        <Loader2 size={18} className={styles.spinner} aria-hidden="true" />
        <span>{stage === "analysis" ? "Finishing your photo analysis…" : "Saving your enquiry before opening your report…"}</span>
      </div>
      <p className={styles.note}>
        {takingLonger
          ? "This is taking a little longer. Please keep this page open while we finish."
          : "Please keep this page open. You don’t need to submit again."}
      </p>
      <p className={styles.caveat}>Your guide supports a consultation. A clinician confirms the findings and suitable treatment.</p>
    </section>
  );
}
