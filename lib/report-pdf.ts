import { jsPDF } from "jspdf";

// ─────────────────────────────────────────────────────────────────────────────
// Premium, cinematic report — theme-driven so each clinic gets its own palette
// (HSA dark-gold / MEDfacials warm-cream). Pure jsPDF (no browser canvas) so it's
// unit-testable; the browser helper (lib/report.ts) renders the face + crops.
// ─────────────────────────────────────────────────────────────────────────────

type RGB = [number, number, number];

export interface ReportPalette {
  bg: RGB;
  panel: RGB;
  gold: RGB;
  goldLt: RGB;
  heading: RGB;
  body: RGB;
  faint: RGB;
  line: RGB;
  badgeText: RGB; // number colour on a gold badge
}

export interface ReportArea {
  num: number;
  title: string;
  blurb: string;
  cropDataUrl?: string | null;
  covered: boolean;
  flagged: boolean;
  /** Indicative improvement potential (0–100) — drives the gold bar. */
  enhancement?: number | null;
  /** Pigmentation visibility in this zone (0–100), shown alongside the bar. */
  severity?: number | null;
}

export interface ReportInput {
  clinicName: string;
  treatmentName: string;
  byline: string;
  mono?: string;
  palette: ReportPalette;
  phone: string;
  email: string;
  bookingUrl: string;
  addressLines: string[];
  preparedFor?: string;
  dateStr: string;
  verdictLabel: string;
  headline: string;
  score: number;
  narrative: string;
  encouragement: string;
  usedPhoto: boolean;
  /** True when some zones couldn't be read (hair, beard, glasses, shadow). */
  obscuredNotice: boolean;
  /** True when makeup appeared to soften the tone read. */
  makeupNotice?: boolean;
  faceImageDataUrl?: string | null;
  faceImageAspect?: number; // width / height — preserved so the photo isn't stretched
  areas: ReportArea[];
  priceFrom: string;
  priceNote: string;
  disclaimer: string;
}

const PW = 210;
const PH = 297;
const M = 17;
const CW = PW - M * 2;
// Comfortable measure for centered body copy on the cover. The full content
// width (CW) makes ~155mm lines that crowd the decorative frame and get clipped
// by phone PDF viewers that over-zoom; a narrower column reads better and stays
// clear of the edges.
const BODYW = 132;

export function buildReportPdf(input: ReportInput): Blob {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const T = input.treatmentName;
  const P = input.palette;
  let page = 1;

  const pageBg = () => {
    doc.setFillColor(...P.bg);
    doc.rect(0, 0, PW, PH, "F");
  };
  const footer = () => {
    doc.setDrawColor(...P.line);
    doc.setLineWidth(0.2);
    doc.line(M, PH - 14, PW - M, PH - 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.2);
    doc.setTextColor(...P.faint);
    doc.text(input.disclaimer, M, PH - 10, { maxWidth: CW - 16 });
    doc.text(String(page), PW - M, PH - 10, { align: "right" });
  };
  const runningHeader = () => {
    doc.setFont("times", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...P.gold);
    doc.text(input.clinicName.toUpperCase(), M, 14);
    doc.setTextColor(...P.faint);
    doc.setFontSize(7);
    doc.text(`${T} Analysis Report`, PW - M, 14, { align: "right" });
    doc.setDrawColor(...P.line);
    doc.setLineWidth(0.2);
    doc.line(M, 18, PW - M, 18);
  };
  const sectionTitle = (text: string, yy: number) => {
    doc.setFont("times", "normal");
    doc.setFontSize(14);
    doc.setTextColor(...P.heading);
    doc.text(text, M, yy);
    doc.setDrawColor(...P.gold);
    doc.setLineWidth(0.6);
    doc.line(M, yy + 2.5, M + 16, yy + 2.5);
  };
  const tagPill = (text: string, x: number, yy: number, color: RGB) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    const w = doc.getTextWidth(text) + 4;
    doc.setFillColor(...color);
    doc.roundedRect(x, yy, w, 4.6, 1, 1, "F");
    doc.setTextColor(...P.bg);
    doc.text(text, x + 2, yy + 3.2);
  };
  // jsPDF's align:"center" computes the anchor from the un-spaced text width, so
  // letter-spaced (charSpace) lines drift right of true centre. Centre them
  // ourselves using the real rendered width. Caller sets font/size/colour first.
  const centerSpaced = (text: string, cx: number, yy: number, charSpace: number) => {
    const w = doc.getTextWidth(text) + charSpace * Math.max(0, text.length - 1);
    doc.text(text, cx - w / 2, yy, { charSpace });
  };

  let y = 0;
  const ensure = (need: number) => {
    if (y + need > PH - 20) {
      footer();
      doc.addPage();
      page += 1;
      pageBg();
      runningHeader();
      y = 28;
    }
  };

  // ══ COVER ══════════════════════════════════════════════════════════════
  pageBg();
  doc.setDrawColor(...P.gold);
  doc.setLineWidth(0.3);
  doc.rect(8, 8, PW - 16, PH - 16, "S");

  if (input.mono) {
    doc.setFont("times", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...P.gold);
    centerSpaced(input.mono, PW / 2, 25, 1);
  }
  doc.setFont("times", "normal");
  doc.setFontSize(20);
  doc.setTextColor(...P.heading);
  doc.text(input.clinicName.toUpperCase(), PW / 2, 33, { align: "center" });
  doc.setFontSize(7.5);
  doc.setTextColor(...P.gold);
  doc.text(input.byline.toUpperCase(), PW / 2, 39, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...P.faint);
  centerSpaced(`${T.toUpperCase()} · ANALYSIS REPORT`, PW / 2, 48, 1.2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...P.body);
  const who = input.preparedFor ? `Prepared for ${input.preparedFor}` : "";
  doc.text([who, input.dateStr].filter(Boolean).join("   ·   "), PW / 2, 54, {
    align: "center",
  });

  // score dial — a premium gold progress arc sweeping from 12 o'clock, not just
  // a lone dot on a dull ring. Drawn as many short segments so we can taper the
  // colour from deep gold into light gold and give it rounded ends + an end knob.
  const cx = PW / 2;
  const cy = 86;
  const rr = 20;
  const score = Math.max(0, Math.min(100, input.score));
  const START = -Math.PI / 2; // 12 o'clock
  const END = START + (score / 100) * Math.PI * 2;

  // faint full track
  doc.setDrawColor(...P.line);
  doc.setLineWidth(1.1);
  doc.circle(cx, cy, rr, "S");

  // subtle tick hairlines
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    doc.setDrawColor(...P.line);
    doc.setLineWidth(0.3);
    doc.line(
      cx + Math.cos(a) * (rr + 2.5),
      cy + Math.sin(a) * (rr + 2.5),
      cx + Math.cos(a) * (rr + 4),
      cy + Math.sin(a) * (rr + 4),
    );
  }

  // gold progress arc (deep gold → light gold, rounded caps)
  doc.setLineWidth(2.3);
  doc.setLineCap(1); // round
  const SEG = Math.max(24, Math.round((score / 100) * 90));
  for (let i = 0; i < SEG; i++) {
    const t = (i + 0.5) / SEG;
    const a0 = START + (i / SEG) * (END - START);
    const a1 = START + ((i + 1) / SEG) * (END - START);
    doc.setDrawColor(
      Math.round(P.gold[0] + (P.goldLt[0] - P.gold[0]) * t),
      Math.round(P.gold[1] + (P.goldLt[1] - P.gold[1]) * t),
      Math.round(P.gold[2] + (P.goldLt[2] - P.gold[2]) * t),
    );
    doc.line(
      cx + Math.cos(a0) * rr,
      cy + Math.sin(a0) * rr,
      cx + Math.cos(a1) * rr,
      cy + Math.sin(a1) * rr,
    );
  }
  doc.setLineCap(0); // reset to butt

  // end knob — a bright filled dot ringed in gold
  const kx = cx + Math.cos(END) * rr;
  const ky = cy + Math.sin(END) * rr;
  doc.setFillColor(...P.goldLt);
  doc.circle(kx, ky, 2.3, "F");
  doc.setDrawColor(...P.gold);
  doc.setLineWidth(0.5);
  doc.circle(kx, ky, 2.3, "S");

  doc.setFont("times", "normal");
  doc.setFontSize(30);
  doc.setTextColor(...P.heading);
  doc.text(String(input.score), cx, cy + 2, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.6);
  doc.setTextColor(...P.gold);
  centerSpaced("SUITABILITY", cx, cy + 9, 1);

  // verdict + headline
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...P.gold);
  centerSpaced(input.verdictLabel.toUpperCase(), cx, 120, 1.5);
  doc.setFont("times", "normal");
  doc.setFontSize(20);
  doc.setTextColor(...P.heading);
  const hl = doc.splitTextToSize(input.headline, CW - 24);
  doc.text(hl, cx, 130, { align: "center" });
  y = 130 + hl.length * 8 + 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...P.body);
  const narr = doc.splitTextToSize(input.narrative, BODYW);
  doc.text(narr, cx, y, { align: "center" });
  y += narr.length * 5.6 + 4;
  if (input.encouragement) {
    doc.setTextColor(...P.heading);
    const enc = doc.splitTextToSize(input.encouragement, BODYW);
    doc.text(enc, cx, y, { align: "center" });
    y += enc.length * 5.6 + 4;
  }

  const noticePanel = (title: string, text: string) => {
    y += 2;
    doc.setFillColor(...P.panel);
    doc.roundedRect(M + 6, y, CW - 12, 17, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...P.goldLt);
    doc.text(title, M + 11, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...P.body);
    const bn = doc.splitTextToSize(text, CW - 22);
    doc.text(bn, M + 11, y + 11);
    y += 17;
  };
  if (input.usedPhoto && input.obscuredNotice) {
    noticePanel(
      "Some areas were covered",
      "Hair, facial hair, glasses or shadow hid part of the face, so those reads were kept light. The treatment works just as well there — assessed properly at your consultation.",
    );
  }
  if (input.usedPhoto && input.makeupNotice) {
    noticePanel(
      "Makeup noticed",
      "Foundation or concealer may be softening how the pigmentation appears in the photo, so real results could be even better than this read suggests.",
    );
  }
  footer();

  // ══ CONTENT — face map + areas ════════════════════════════════════════
  doc.addPage();
  page += 1;
  pageBg();
  runningHeader();
  y = 28;

  if (input.usedPhoto && input.faceImageDataUrl) {
    // Fit the photo into a max box preserving its true aspect ratio — never
    // stretch it (a tall phone screenshot must stay tall, not squashed).
    const aspect =
      input.faceImageAspect && input.faceImageAspect > 0
        ? input.faceImageAspect
        : 0.8;
    const maxH = 96;
    const maxW = Math.min(CW, 118);
    let imgW = maxH * aspect;
    let imgH = maxH;
    if (imgW > maxW) {
      imgW = maxW;
      imgH = maxW / aspect;
    }
    ensure(imgH + 18);
    sectionTitle("Your pigmentation map", y);
    y += 9;
    const ix = (PW - imgW) / 2;
    doc.setDrawColor(...P.gold);
    doc.setLineWidth(0.4);
    doc.roundedRect(ix - 1.5, y - 1.5, imgW + 3, imgH + 3, 2, 2, "S");
    try {
      doc.addImage(input.faceImageDataUrl, "PNG", ix, y, imgW, imgH);
    } catch {
      /* ignore */
    }
    y += imgH + 9;
  }

  if (input.areas.length > 0) {
    ensure(14);
    sectionTitle("The zones we focused on", y);
    y += 9;
    for (const a of input.areas) {
      const blurbLines = doc.splitTextToSize(a.blurb, CW - 30);
      const hasBar = !a.covered && typeof a.enhancement === "number";
      const rowH = Math.max(24, blurbLines.length * 4.6 + (hasBar ? 17 : 9));
      ensure(rowH + 3);
      doc.setDrawColor(...P.line);
      doc.setLineWidth(0.3);
      if (a.cropDataUrl) {
        try {
          doc.addImage(a.cropDataUrl, "JPEG", M, y, 21, 21);
        } catch {
          doc.setFillColor(...P.panel);
          doc.rect(M, y, 21, 21, "F");
        }
      } else {
        doc.setFillColor(...P.panel);
        doc.rect(M, y, 21, 21, "F");
      }
      doc.rect(M, y, 21, 21, "S");
      doc.setFillColor(...P.gold);
      doc.circle(M + 2.6, y + 2.6, 2.6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...P.badgeText);
      doc.text(String(a.num), M + 2.6, y + 3.6, { align: "center" });

      const tx = M + 27;
      doc.setFont("times", "normal");
      doc.setFontSize(12);
      doc.setTextColor(...P.heading);
      doc.text(a.title, tx, y + 4);
      const tagX = tx + doc.getTextWidth(a.title) + 3;
      if (a.covered) tagPill("COVERED IN PHOTO", tagX, y + 0.8, P.faint);
      else if (a.flagged) tagPill("FOCUS", tagX, y + 0.8, P.gold);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...P.body);
      doc.text(blurbLines, tx, y + 9.5);
      let by = y + 9.5 + blurbLines.length * 4.6 + 1;

      if (hasBar) {
        const pct = Math.max(0, Math.min(100, a.enhancement as number));
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(...P.faint);
        doc.text("IMPROVEMENT POTENTIAL", tx, by, { charSpace: 0.5 });
        doc.setTextColor(...P.goldLt);
        const sev =
          typeof a.severity === "number"
            ? Math.max(0, Math.min(100, a.severity))
            : null;
        doc.text(
          sev !== null ? `visibility ${sev}%   ·   +${pct}%` : `+${pct}%`,
          PW - M,
          by,
          { align: "right" },
        );
        by += 1.6;
        const barW = CW - 27;
        doc.setFillColor(...P.panel);
        doc.roundedRect(tx, by, barW, 1.8, 0.9, 0.9, "F");
        doc.setFillColor(...P.gold);
        doc.roundedRect(tx, by, (barW * pct) / 100, 1.8, 0.9, 0.9, "F");
      }
      y += rowH;
    }
  }

  ensure(16);
  doc.setDrawColor(...P.line);
  doc.setLineWidth(0.2);
  doc.line(M, y, PW - M, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...P.body);
  doc.text(`${T} from `, M, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...P.heading);
  doc.text(input.priceFrom, M + doc.getTextWidth(`${T} from `), y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...P.faint);
  const pn = doc.splitTextToSize(input.priceNote, CW);
  doc.text(pn, M, y + 5);
  y += 5 + pn.length * 4 + 6;

  ensure(20);
  doc.setFillColor(...P.panel);
  doc.setDrawColor(...P.gold);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, y, CW, 17, 2.5, 2.5, "FD");
  doc.setFont("times", "normal");
  doc.setFontSize(13);
  doc.setTextColor(...P.goldLt);
  doc.text("Book your free online consultation", M + 7, y + 7.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...P.body);
  doc.text(`${input.bookingUrl}   ·   ${input.phone}`, M + 7, y + 12.5);

  footer();
  return doc.output("blob");
}
