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
  /** "Spread the cost" illustration rows + its small print. */
  finance?: { heading: string; rows: { name: string; detail: string }[]; note: string };
  disclaimer: string;
  /** The pigmentation type the photo appeared consistent with, and its treatment plan. */
  spotType?: ReportSpotType | null;
  /** Closing statement printed after the booking panel. */
  endDisclaimer?: string;
  /** The doctors' recommendation that sells the Signature Treatment (strong/good candidates only). */
  recommendation?: ReportRecommendation | null;
}

export interface ReportRecommendation {
  title: string;
  subtitle: string;
  lead: string;
  comparisons: { alternative: string; limitation: string; ours: string }[];
  whyClinic: string[];
  priceLine: string;
  smallPrint: string;
}

export interface ReportSpotType {
  name: string;
  commonName: string;
  what: string;
  cause: string;
  /** One sentence on a second type, when the photo showed a mix. */
  secondaryNote?: string;
  steps: { step: string; title: string; how: string; why: string }[];
  outlook: string;
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

  // Their pigmentation — what they have and where it shows most — leads the cover.
  const cx = PW / 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...P.gold);
  centerSpaced("YOUR PIGMENTATION", cx, 70, 1.5);
  doc.setFont("times", "normal");
  doc.setFontSize(26);
  doc.setTextColor(...P.heading);
  doc.text(input.spotType ? input.spotType.name : "Areas of uneven tone", cx, 82, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...P.gold);
  doc.text(
    input.spotType ? `Often called ${input.spotType.commonName}` : "Your practitioner confirms the exact type",
    cx,
    89,
    { align: "center" },
  );
  const topAreas = input.areas
    .filter((a) => !a.covered && (typeof a.severity === "number" || a.flagged))
    .slice(0, 3)
    .map((a) => (typeof a.severity === "number" ? `${a.title} ${a.severity}%` : a.title));
  if (topAreas.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...P.body);
    doc.text(`Most visible: ${topAreas.join("   ·   ")}`, cx, 99, { align: "center" });
  }
  doc.setDrawColor(...P.gold);
  doc.setLineWidth(0.4);
  doc.line(cx - 14, 107, cx + 14, 107);

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

  // Wrapped paragraph with an optional bold lead-in label on its own line.
  const paragraph = (label: string | null, text: string, x: number, width: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(text, width) as string[];
    ensure((label ? 4.6 : 0) + lines.length * 4.3 + 3);
    if (label) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...P.goldLt);
      doc.text(label.toUpperCase(), x, y, { charSpace: 0.3 });
      y += 4.6;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...P.body);
    doc.text(lines, x, y);
    y += lines.length * 4.3 + 3;
  };

  const drawRecommendation = (r: ReportRecommendation) => {
    ensure(60);
    sectionTitle("Your recommended treatment", y);
    y += 10;
    doc.setFont("times", "normal");
    doc.setFontSize(17);
    doc.setTextColor(...P.heading);
    const t = doc.splitTextToSize(r.title, CW) as string[];
    doc.text(t, M, y);
    y += t.length * 6.8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...P.gold);
    doc.text(r.subtitle, M, y);
    y += 6.5;
    paragraph(null, r.lead, M, CW);
    paragraph("Why it goes further than a single treatment", "", M, CW);
    y -= 6;
    for (const c of r.comparisons) {
      paragraph(null, `${c.alternative} ${c.limitation}`, M + 4, CW - 4);
      y -= 1.5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...P.goldLt);
      const ours = doc.splitTextToSize(`Our programme: ${c.ours}`, CW - 4) as string[];
      ensure(ours.length * 4.3 + 4);
      doc.text(ours, M + 4, y);
      y += ours.length * 4.3 + 3.5;
    }
    paragraph("Why Harley Street Aesthetics", r.whyClinic.map((w) => `- ${w}`).join("\n"), M, CW);
    paragraph(null, r.priceLine, M, CW);
    doc.setFontSize(7.5);
    doc.setTextColor(...P.faint);
    const sp = doc.splitTextToSize(r.smallPrint, CW) as string[];
    ensure(sp.length * 3.6 + 4);
    doc.text(sp, M, y);
    y += sp.length * 3.6 + 6;
  };

  // Their face, their areas — drawn straight after "Your pigmentation type".
  const drawMapAndAreas = () => {
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
      // Room for the heading AND its first row, so the heading is never orphaned.
      ensure(50);
      sectionTitle("Where your pigmentation shows", y);
      y += 9;
      for (const a of input.areas) {
        // Measure using the same font that renders the description. Previous
        // rows leave a smaller bold font active, which otherwise under-wraps.
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
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
  };

  if (!input.spotType) {
    drawMapAndAreas();
    if (input.recommendation) drawRecommendation(input.recommendation);
  }

  if (input.spotType) {
    const st = input.spotType;
    ensure(40);
    sectionTitle("Your pigmentation type", y);
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...P.faint);
    doc.text("Your photo appears most consistent with", M, y);
    y += 7;
    doc.setFont("times", "normal");
    doc.setFontSize(18);
    doc.setTextColor(...P.heading);
    const nameLines = doc.splitTextToSize(st.name, CW) as string[];
    doc.text(nameLines, M, y);
    y += nameLines.length * 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...P.gold);
    doc.text(`Often called ${st.commonName}`, M, y);
    y += 7;
    paragraph("What it is", st.what, M, CW);
    paragraph("What causes it", st.cause, M, CW);
    if (st.secondaryNote) paragraph("Also noted", st.secondaryNote, M, CW);
    y += 3;

    drawMapAndAreas();
    if (input.recommendation) drawRecommendation(input.recommendation);

    ensure(30);
    sectionTitle(`Your treatment plan for ${st.name.toLowerCase()}`.slice(0, 70), y);
    y += 9;
    paragraph(
      null,
      "How each step of our 3R Programme (Reduce, Regulate, Reverse) addresses your type of pigmentation, and why it helps. Pigment cells sit at the junction between the two top layers of your skin. When that junction is weak, extra pigment leaks deeper, which is why it keeps coming back. We help regulate how pigment is made and strengthen that layer. Repair, don't damage.",
      M,
      CW,
    );
    for (const s of st.steps) {
      ensure(30);
      doc.setFont("times", "normal");
      doc.setFontSize(13);
      doc.setTextColor(...P.gold);
      doc.text(s.step, M, y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...P.heading);
      doc.text(s.title, M + 10, y);
      y += 5.5;
      paragraph("How we address it", s.how, M + 10, CW - 10);
      paragraph("Why it works", s.why, M + 10, CW - 10);
      y += 1.5;
    }
    paragraph("What to expect", st.outlook, M, CW);
    y += 4;
  }

  ensure(16);
  doc.setDrawColor(...P.line);
  doc.setLineWidth(0.2);
  doc.line(M, y, PW - M, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...P.body);
  doc.text(`${T}: `, M, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...P.heading);
  doc.text(input.priceFrom, M + doc.getTextWidth(`${T}: `), y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...P.faint);
  const pn = doc.splitTextToSize(input.priceNote, CW);
  doc.text(pn, M, y + 5);
  y += 5 + pn.length * 4 + 6;

  // ── Spread the cost ──────────────────────────────────────────────────────
  if (input.finance) {
    const fin = input.finance;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.6);
    const note = doc.splitTextToSize(fin.note, CW - 14);
    const panelH = 13 + fin.rows.length * 6.5 + note.length * 2.9 + 4;
    ensure(panelH + 6);
    doc.setFillColor(...P.panel);
    doc.setDrawColor(...P.line);
    doc.setLineWidth(0.2);
    doc.roundedRect(M, y, CW, panelH, 2.5, 2.5, "FD");
    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.setTextColor(...P.goldLt);
    doc.text(fin.heading, M + 7, y + 8);
    let fy = y + 15;
    for (const row of fin.rows) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...P.heading);
      doc.text(row.name, M + 7, fy);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...P.body);
      doc.text(row.detail, M + 42, fy);
      fy += 6.5;
    }
    doc.setFontSize(6.6);
    doc.setTextColor(...P.faint);
    doc.text(note, M + 7, fy + 0.5);
    y += panelH + 7;
  }

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
  // The booking address is ~100 characters: too long for this panel, so a
  // short label is printed and the full address is the tap target below.
  doc.text(`Tap here to choose your time online   ·   ${input.phone}`, M + 7, y + 12.5);
  // The whole panel is tappable — a printed URL nobody retypes books nobody.
  doc.link(M, y, CW, 17, { url: `https://${input.bookingUrl}` });
  y += 17;

  if (input.endDisclaimer) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    const lines = doc.splitTextToSize(input.endDisclaimer, CW - 10) as string[];
    ensure(lines.length * 4.2 + 8);
    y += 7;
    doc.setTextColor(...P.heading);
    doc.text(lines, PW / 2, y, { align: "center" });
    y += lines.length * 4.2;
  }

  footer();
  return doc.output("blob");
}
