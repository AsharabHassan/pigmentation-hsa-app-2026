import { timingSafeEqual } from "node:crypto";
import { dbConfigured } from "@/lib/db";
import {
  SEGMENTS,
  loadFunnel,
  loadPeople,
  loadSegment,
  type Funnel,
  type PersonRow,
  type SegmentRow,
} from "@/lib/insights-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /admin — booking insights for the clinic team. HTTP Basic auth: any
// username, password = ADMIN_PASSWORD. Contains patient contact details, so it
// is never cached, never indexed, and disabled entirely without a password.

function authorized(request: Request): boolean {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected || expected.length < 12) return false;
  const header = request.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("basic ")) return false;
  let password: string;
  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    password = decoded.slice(decoded.indexOf(":") + 1);
  } catch {
    return false;
  }
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pct(part: number, whole: number): string {
  return whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : "–";
}

function funnelHtml(f: Funnel): string {
  const steps: [string, number, number][] = [
    ["Analyses completed", f.analyses, f.analyses],
    ["Left their details", f.leads, f.analyses],
    ["Saw the calendar", f.calendarViewed, f.leads],
    ["Tapped a booking button", f.ctaClicked, f.leads],
    ["Booked a consultation", f.booked, f.leads],
  ];
  return `<div class="cards">${steps
    .map(
      ([label, value, of], i) => `<div class="card"><div class="num">${value}</div>
        <div class="lbl">${esc(label)}</div>
        <div class="sub">${i === 0 ? "&nbsp;" : `${pct(value, of)} of ${i === 1 ? "analyses" : "leads"}`}</div></div>`,
    )
    .join("")}</div>
    <p class="note">Median time from lead to booking: <b>${
      f.medianHoursToBook == null
        ? "–"
        : f.medianHoursToBook < 1
          ? `${Math.round(f.medianHoursToBook * 60)} min`
          : `${f.medianHoursToBook.toFixed(1)} h`
    }</b> · Bookings on this calendar from people who never used the analyzer: <b>${f.unmatchedBookings}</b></p>`;
}

/** Segments that book clearly above or below the average — the "why". */
function takeaways(
  segments: [string, SegmentRow[]][],
  f: Funnel,
): string {
  if (f.leads < 20 || f.booked < 3) {
    return `<p class="note">Takeaways appear once there are at least 20 leads and 3 bookings in the period — below that the differences are noise.</p>`;
  }
  const average = f.booked / f.leads;
  const found: { text: string; lift: number }[] = [];
  for (const [label, rows] of segments) {
    for (const row of rows) {
      if (row.leads < 10) continue;
      const rate = row.booked / row.leads;
      const lift = average > 0 ? rate / average : 0;
      if (lift >= 1.3 || lift <= 0.7) {
        found.push({
          lift,
          text: `<b>${esc(label)}: ${esc(row.value)}</b> books at ${pct(row.booked, row.leads)} vs ${pct(f.booked, f.leads)} average (${row.leads} leads)`,
        });
      }
    }
  }
  if (found.length === 0) {
    return `<p class="note">No segment with 10+ leads differs from the average by 30% or more yet.</p>`;
  }
  found.sort((x, y) => y.lift - x.lift);
  return `<ul class="take">${found
    .slice(0, 10)
    .map(
      (t) =>
        `<li class="${t.lift >= 1 ? "up" : "down"}">${t.lift >= 1 ? "▲" : "▼"} ${t.text}</li>`,
    )
    .join("")}</ul>`;
}

function segmentHtml(label: string, rows: SegmentRow[]): string {
  const best = Math.max(
    0.0001,
    ...rows.map((r) => (r.leads > 0 ? r.booked / r.leads : 0)),
  );
  return `<section><h3>${esc(label)}</h3><table>
    <tr><th></th><th>Analyses</th><th>Leads</th><th>Booked</th><th colspan="2">Booked / leads</th></tr>
    ${rows
      .map((r) => {
        const rate = r.leads > 0 ? r.booked / r.leads : 0;
        return `<tr><td>${esc(r.value)}</td><td>${r.analyses}</td><td>${r.leads}</td><td>${r.booked}</td>
          <td>${pct(r.booked, r.leads)}</td>
          <td class="barcell"><div class="bar" style="width:${Math.round((rate / best) * 100)}%"></div></td></tr>`;
      })
      .join("")}</table></section>`;
}

function peopleHtml(people: PersonRow[]): string {
  const when = (v: string | null) =>
    v
      ? new Date(v).toLocaleString("en-GB", {
          timeZone: "Europe/London",
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";
  return `<table class="people"><tr><th>When</th><th>Name</th><th>Contact</th><th>Clinic</th>
    <th>Verdict</th><th>Score</th><th>Main zone</th><th>Campaign</th><th>Button taps</th><th>Consultation</th></tr>
    ${people
      .map(
        (p) => `<tr class="${p.booking_status ? "booked" : ""}"><td>${esc(when(p.created_at))}</td>
        <td>${esc(p.name)}</td><td>${esc(p.email)}<br>${esc(p.phone)}</td><td>${esc(p.clinic_location)}</td>
        <td>${esc(p.bucket)}</td><td>${p.score}</td><td>${esc(p.top_zone)}</td><td>${esc(p.campaign)}</td>
        <td>${p.cta_clicks}</td>
        <td>${p.booking_status ? `${esc(p.booking_status)} ${esc(when(p.booking_start))}` : "—"}</td></tr>`,
      )
      .join("")}</table>`;
}

const STYLE = `
  :root{color-scheme:dark}
  body{margin:0;background:#090909;color:#c6bfb2;font:14px/1.5 system-ui,sans-serif}
  main{max-width:1100px;margin:0 auto;padding:28px 16px 80px}
  h1{font:600 26px Georgia,serif;color:#f5f1e6;margin:0 0 4px}
  h2{font:600 18px Georgia,serif;color:#d4af37;margin:36px 0 12px}
  h3{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#f5f1e6;margin:0 0 8px}
  a{color:#d4af37} .range a{margin-right:12px} .range a.on{font-weight:700;text-decoration:none;color:#f5f1e6}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:16px}
  .card,section{background:#16130f;border:1px solid #3e3930;border-radius:14px;padding:16px}
  .num{font:600 30px Georgia,serif;color:#f5f1e6} .lbl{color:#f5f1e6} .sub,.note{color:#8a847a;font-size:13px}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,480px),1fr));gap:12px}
  table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
  th{color:#8a847a;font-weight:500;font-size:12px;text-align:left;padding:4px 6px}
  td{padding:5px 6px;border-top:1px solid #2a261f;vertical-align:top}
  .barcell{width:30%} .bar{height:8px;border-radius:4px;background:#d4af37;min-width:2px}
  .take{list-style:none;padding:0;margin:0} .take li{padding:6px 0;border-top:1px solid #2a261f}
  .up{color:#e7c668} .down{color:#c98f7a} .take b{color:#f5f1e6}
  .scroll{overflow-x:auto} .people{min-width:900px} tr.booked td{background:rgba(212,175,55,.08)}
`;

export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) {
    return new Response("Authentication required.", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="HSA insights", charset="UTF-8"',
        "Cache-Control": "no-store",
      },
    });
  }

  const requested = Number(new URL(request.url).searchParams.get("days"));
  const days = [7, 30, 90, 365].includes(requested) ? requested : 30;

  let body: string;
  if (!dbConfigured()) {
    body = `<p class="note">DATABASE_URL is not set, so nothing is being recorded yet.</p>`;
  } else {
    try {
      const labels = Object.keys(SEGMENTS) as (keyof typeof SEGMENTS)[];
      const [funnel, people, ...rows] = await Promise.all([
        loadFunnel(days),
        loadPeople(days),
        ...labels.map((label) => loadSegment(SEGMENTS[label], days)),
      ]);
      const segments = labels.map(
        (label, i) => [label, rows[i]] as [string, SegmentRow[]],
      );
      body = `${funnelHtml(funnel)}
        <h2>Why people book — what stands out</h2>${takeaways(segments, funnel)}
        <h2>Booking rate by segment</h2>
        <div class="grid">${segments.map(([l, r]) => segmentHtml(l, r)).join("")}</div>
        <h2>People (booked first)</h2><div class="scroll">${peopleHtml(people)}</div>`;
    } catch (err) {
      console.error(
        "[admin] insights query failed:",
        err instanceof Error ? err.message : err,
      );
      body = `<p class="note">The database could not be reached. Check DATABASE_URL and that the Docker container is running.</p>`;
    }
  }

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="robots" content="noindex,nofollow"><title>HSA booking insights</title>
    <style>${STYLE}</style></head><body><main>
    <h1>Pigmentation analyzer · booking insights</h1>
    <p class="range">${[7, 30, 90, 365]
      .map(
        (d) =>
          `<a class="${d === days ? "on" : ""}" href="?days=${d}">Last ${d} days</a>`,
      )
      .join("")}</p>
    ${body}</main></body></html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
