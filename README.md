# AI Pigmentation Analyzer · Harley Street Aesthetics

A cinematic, standalone web-app lead magnet for **Harley Street Aesthetics** (London & Glasgow). A visitor takes a selfie, our AI maps the dark spots and uneven tone across their face, and they receive a personalised pigmentation analysis presenting the clinic's **Signature Pigmentation Removal Treatment** (VirtueRF Microneedling + Laser + Mesotherapy, minimum 2 sessions, from £399 per session) as the solution. Qualified leads flow into **GoHighLevel** for AI sales-agent follow-up. Primary CTA: **Book Your Free Online Consultation**.

> The tool is an **informational pre-consultation guide — not a diagnosis.** It names the pigmentation type a photo *appears most consistent with* (melasma, solar lentigines, post-inflammatory hyperpigmentation, ephelides, photodamage) and explains how the treatment addresses it; the type and suitability are always confirmed by a practitioner, and the report closes by saying so.

This app is a sibling of the HSA Endomax Lift analyzer, sharing the same dark-gold luxury identity (near-black + metallic gold `#D4AF37`, Playfair Display + Montserrat) and wizard architecture, re-pointed at facial pigmentation.

## How it works

1. **Hero** → **photo** (the camera/upload action explicitly confirms the
   just-in-time processing statement).
2. **On-device scan** — MediaPipe draws a 478-point face mesh as an "AI analysis" animation while the real Claude Vision call runs behind it. The mesh never leaves the device.
3. **Lead gate** — name/email/phone only. Submitting sends the requested lead and written result summary to GoHighLevel. No marketing opt-in is collected here; email/SMS consent is handled outside this app.
4. **Result** — an animated verdict (strong / good / consultation / explore-options), a personalised narrative, an on-face **pigmentation map** (forehead, under-eye, nose, cheeks, upper lip, jawline — cropped from the user's own photo, on-device), the 3-step treatment protocol, and the booking CTA. A branded PDF report is generated in the browser, offered as a direct download, and **automatically delivered**: uploaded to GoHighLevel, written onto the contact, and emailed to the patient with the PDF attached.

The London campaign lands on `/`; the Glasgow campaign lands on `/glasgow`.
Both use the same application and Meta `Lead` conversion, while the selected
route controls the clinic wording, address, phone, consultation link, PDF/email
details and the location fields/tags sent to GoHighLevel.

### The safety model
- **Claude Vision** (`claude-sonnet-4-6`) chooses the cosmetic outcome, writes the narrative, and **picks a pigmentation type from a fixed list** (or "none" when unclear). It never writes the medical copy: every word about a type — what it is, its cause, how each protocol step addresses it and why — is fixed, clinic-authored text in `lib/spot-types.ts`, reviewable in one place. Claude's own free text stays observational (no condition names). It must never classify or comment on a mole, raised spot or any single lesion — those route to a neutral "consultation" result with no type shown. No type is shown on a retake or an out-of-scope result.
- Claude returns **zone-level severities only** — all face geometry/crops come from on-device MediaPipe landmarks. The model is never asked for pixel coordinates.
- The photo is securely sent to the configured AI provider in a single `/api/analyze` request. This app does not persist the original photo to a database or file system and does not log it; the browser keeps it in memory while the visitor views their result. If Claude is unavailable, a deterministic on-brand fallback routes to a consultation, so a user always gets a result.
- Report delivery is **automatic and unconditional** — there is no feature flag and no separate opt-in. Every completed analysis emails the patient their report and stores the PDF in GoHighLevel. It is driven entirely by `GHL_API_TOKEN` + `GHL_LOCATION_ID`; if those are unset, `/api/report` no-ops and only the lead webhook fires. The report contains the patient's photo, so treat GHL retention/deletion as a process you own — the app does not purge.
- `/api/report` is same-origin only, compared against the request's **own** origin (so it works on localhost, previews and production alike). This stops the endpoint being driven cross-site to send arbitrary PDFs from the clinic's GHL account. Patient names are HTML-escaped into the email and uploads must carry a real `%PDF-` header under 10 MB.
- For the consent-gated HighLevel Funnel Event action, `metaFbclid` is derived server-side from a valid `_fbc` cookie. The browser cannot submit a separate raw `fbclid`, and the field is omitted when advertising consent is absent or the cookie is malformed.
- Makeup and obscured zones (beard, fringe, glasses, shadow) are detected and honestly caveated rather than guessed at.

## Stack
Next.js 16 (App Router) · TypeScript · Tailwind v4 · Motion · MediaPipe Tasks Vision · Anthropic SDK · Zustand · Vitest.

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in the values below
npm run dev                         # http://localhost:3000
```

### Environment variables (`.env.local`)
| Var | Scope | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | server | Claude Vision analysis |
| `ANTHROPIC_MODEL` | server (optional) | defaults to `claude-sonnet-4-6` |
| `GHL_WEBHOOK_URL` | server | GoHighLevel inbound webhook (contact + result summary) |
| `GHL_API_TOKEN` / `GHL_LOCATION_ID` | server | GHL Private Integration — **required** for the automatic patient report email; unset means no report is delivered |
| `GHL_REPORT_FIELD_KEY` | server (optional) | GHL custom field that receives the hosted report URL (defaults to `facial_app_report_pdf`) |
| `NEXT_PUBLIC_BOOKING_URL` | public | London free online consultation link |
| `NEXT_PUBLIC_GLASGOW_BOOKING_URL` | public | Glasgow free online consultation link |
| `NEXT_PUBLIC_BOOKING_CALENDAR_URL` | public | GHL calendar embedded on the result page |
| `DATABASE_URL` | server (optional) | Docker Postgres for booking insights |
| `BOOKING_WEBHOOK_SECRET` | server (optional) | authenticates the GHL booking webhook |
| `ADMIN_PASSWORD` | server (optional) | unlocks `/admin` (12+ characters) |
| `NEXT_PUBLIC_SITE_URL` | public | canonical / OG URL |
| `NEXT_PUBLIC_META_PIXEL_ID` | public | Meta dataset/pixel used by the campaign |

## Booking insights database

Every analysis is recorded in a self-hosted **Docker Postgres** so the clinic can
see who books a consultation and what they have in common. It stores the written
outcome (verdict, score, per-zone figures, narrative), the contact details the
visitor submitted, the campaign tags from the landing URL, what they tapped on
the result page, and the GoHighLevel booking. **It never stores the photo, face
landmarks or crops**, and no ad-platform identifier.

It is optional and fail-safe: with `DATABASE_URL` unset nothing is recorded, and a
database outage never blocks a result or a lead (writes are logged and dropped).

**1. Run the database on the VPS**
```bash
cd docker && cp .env.example .env     # set a long random POSTGRES_PASSWORD
docker compose up -d
```
Open the chosen port in the VPS firewall. Vercel has no fixed IPs, so the port is
internet-facing: the long password and TLS (on by default in the compose file)
are what protect it. Back it up — `docker compose exec db pg_dump -U hsa hsa_insights > backup.sql` on a cron.
The app creates its tables itself on first use.

**2. Set in Vercel:** `DATABASE_URL`, `BOOKING_WEBHOOK_SECRET`, `ADMIN_PASSWORD`.

**3. Tell the app about bookings (GoHighLevel workflow)**
Trigger: *Customer Booked Appointment* (add *Appointment Status* too, to catch
cancellations / no-shows), filtered to the consultation calendar.
Action: *Custom Webhook* → `POST https://pigmentation.harleystreetaesthetic.co.uk/api/booking`,
header `x-hsa-secret: <BOOKING_WEBHOOK_SECRET>`, JSON body:
```json
{
  "email": "{{contact.email}}",
  "phone": "{{contact.phone}}",
  "name": "{{contact.name}}",
  "appointmentId": "{{appointment.id}}",
  "status": "{{appointment.status}}",
  "startTime": "{{appointment.start_time}}",
  "calendar": "{{appointment.title}}"
}
```
Bookings are matched to the most recent analysis with the same email **or** phone
(last 10 digits, so format differences don't matter). Bookings from people who
never used the analyzer are kept and counted separately.

**4. Read it:** `https://…/admin` (any username + `ADMIN_PASSWORD`) — funnel,
booking rate by verdict / score / main concern zone / campaign / creative /
device / time of day, automatic "what stands out" takeaways once there is enough
data, and the list of people with their booking status.

The result page embeds the GHL calendar (`NEXT_PUBLIC_BOOKING_CALENDAR_URL`) with
first name, last name, email and phone passed as `first_name`, `last_name`,
`email`, `phone` query parameters.

## Tests & build
```bash
npm test        # unit tests (assessment, face regions, GHL payload, quality gate, wizard store)
npm run build   # production build + type-check
```

## Deploy (Vercel)
1. Push to a Git repo and import into Vercel. The Next.js app is at the **repository root**, so leave **Root Directory** empty (`./`). Framework Preset should auto-detect as **Next.js**.
2. Set the env vars above in the Vercel project.
3. Point your subdomain (e.g. `pigmentation.harleystreetaesthetic.co.uk`) at the deployment.

## Before go-live (HSA-specific)
- **Have a qualified practitioner sign off** the pigmentation-type and treatment-plan copy (`lib/spot-types.ts` — this names medical conditions to patients, so it carries the most liability weight), the treatment copy (`lib/constants.ts` `PROTOCOL_STEPS`, `REGION_COPY` in `lib/face-regions.ts`) and the system prompt's scope guard (`lib/prompts/system-pigmentation.ts`) — pigmentation borders dermatology and the no-diagnosis language carries liability weight.
- Run several test photos and **audit the narratives** for medical condition names before launch.
- Replace the **placeholder testimonials** in `components/result/Testimonials.tsx` with HSA's own verified reviews.
- Add HSA's own **consented before/after pairs** to `/public/results` and populate `CASES` in `components/result/ResultsGallery.tsx` (it ships empty — do not reuse imagery from any other clinic).
- Confirm the **GoHighLevel webhook URL** maps the received tags into the contact. Every lead now carries `hsa-pigmentation-lead`, `hsa-source-pigmentation-app`, an `hsa-clinic-london` or `hsa-clinic-glasgow` tag, a `pigmentation-<bucket>` tag, and the Meta consent-status tag. The flat `clinicLocation`, `clinicLocationLabel` and `clinicAddress` fields are also included. **No marketing consent tag is sent** — if your GHL automations previously branched on `hsa-marketing-opt-in` / `hsa-marketing-opt-out`, update them before deploying, or contacts will fall through those conditions.
- This app collects **no email/SMS marketing consent**. Anyone marketed to from these leads must be opted in through a separate, evidenced route that you control. The automatic report email is a service message fulfilling the visitor's own request, not marketing.
- **Verify the report email actually lands** after any deploy touching `/api/report` or `lib/ghl-report.ts` — send a real test lead and confirm the PDF arrives. This delivery was silently disabled once before by a feature flag that defaulted off, and nothing in the UI surfaces the failure (delivery is fire-and-forget by design, so the visitor's reveal never blocks).
- Confirm the **booking URL** (free online consultation) and clinic contact details in `lib/constants.ts`.
- A UK GDPR DPIA covering the selfie processing is recommended (the app avoids persisting the original image and keeps the analysis and advertising purposes separate).
