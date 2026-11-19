"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowUpRight, Play } from "lucide-react";
import styles from "./LandingPage.module.css";

export function ClinicFilm({ title, subtitle, src, poster, source, number }: {
  title: string; subtitle: string; src: string; poster: string; source: string; number: string;
}) {
  const [active, setActive] = useState(false);
  return (
    <article className={styles.film}>
      <div className={styles.filmFrame}>
        {active ? (
          <video src={src} poster={poster} controls autoPlay playsInline muted
            aria-label={`${title}. Silent clinical treatment footage.`}>
            Your browser does not support video. <a href={source}>Watch the original on Instagram</a>.
          </video>
        ) : (
          <button type="button" onClick={() => setActive(true)} className={styles.filmPlay} aria-label={`Play ${title}`}>
            <Image src={poster} alt={title} fill sizes="(max-width: 640px) 85vw, 360px" />
            <span className={styles.playCircle}><Play size={23} fill="currentColor" /></span>
            <span className={styles.filmLabel}>WATCH THE TREATMENT <span>↗</span></span>
          </button>
        )}
        <span className={styles.filmNumber}>{number}</span>
      </div>
      <h3>{title}</h3>
      <p>{subtitle}</p>
      <a href={source} target="_blank" rel="noopener noreferrer">Original on @harleystreetmedic <ArrowUpRight size={14} /></a>
    </article>
  );
}
