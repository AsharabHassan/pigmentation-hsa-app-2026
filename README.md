# AI Pigmentation Analyzer · Harley Street Aesthetics

A cinematic, standalone web-app lead magnet for **Harley Street Aesthetics** (London & Glasgow). A visitor takes a selfie, our AI maps the dark spots and uneven tone across their face, and they receive a personalised pigmentation analysis presenting the clinic's **Signature Pigmentation Removal Treatment** (VirtueRF Pulsed Mode + Exosome Therapy + Mesotherapy, from £399) as the solution. Qualified leads flow into **GoHighLevel** for AI sales-agent follow-up. Primary CTA: **Book Your Free Online Consultation**.

> The tool is a **cosmetic, informational pre-consultation guide — not a medical assessment or diagnosis.** It never names or diagnoses skin conditions; suitability is always confirmed by a practitioner.

This app is a sibling of the HSA Endomax Lift analyzer, sharing the same dark-gold luxury identity (near-black + metallic gold `#D4AF37`, Playfair Display + Montserrat) and wizard architecture, re-pointed at facial pigmentation.

## How it works

1. **Hero** → consent → **photo** (camera or upload).
2. **On-device scan** — MediaPipe draws a 478-point face mesh as an "AI analysis" animation while the real Claude Vision call runs behind it. The mesh never leaves the device.
3. **Lead gate** — name/email/phone + a *separate* marketing-consent checkbox. Submitting fires the lead to GoHighLevel.
4. **Result** — an animated verdict (strong / good / consultation / explore-options), a personalised narrative, an on-face **pigmentation map** (forehead, under-eye, nose, cheeks, upper lip, jawline — cropped from the user's own photo, on-device), the 3-step treatment protocol, and the booking CTA. A branded PDF report remains available for local download. Full face-containing CRM delivery is an optional, separately consented feature and is disabled by default.

### The safety model
- **Claude Vision** (`claude-sonnet-4-6`) chooses the cosmetic outcome and writes the narrative under a strict scope guard: observational cosmetic language only — it must never name medical conditions (no "melasma" etc.), never comment on moles or lesions, and routes anything medical-looking to a neutral "consultation" result.
- Claude returns **zone-level severities only** — all face geometry/crops come from on-device MediaPipe landmarks. The model is never asked for pixel coordinates.
- The photo is securely sent to the configured AI provider in a single `/api/analyze` request. This app does not persist the original photo to a database or file system and does not log it; the browser keeps it in memory while the visitor views their result. If Claude is unavailable, a deterministic on-brand fallback routes to a consultation, so a user always gets a result.
- The face-containing PDF is **not** uploaded to GHL by default. Full-report delivery requires explicit report-storage consent, `NEXT_PUBLIC_GHL_FULL_REPORT_STORAGE_ENABLED=true` to offer that choice, and server-side `GHL_FULL_REPORT_STORAGE_ENABLED=true` to permit delivery. Keep both flags off until a tested external workflow deletes the GHL media file, note, custom-field link and any copies within 30 days. The purge workflow is not implemented by this app.
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
| `GHL_WEBHOOK_URL` | server | GoHighLevel inbound webhook |
| `GHL_API_TOKEN` / `GHL_LOCATION_ID` / `GHL_REPORT_FIELD_KEY` | server (optional) | GHL Private Integration for separately consented full PDF delivery |
| `GHL_FULL_REPORT_STORAGE_ENABLED` | server (optional) | Defaults off; permits consented full-report delivery only after the external 30-day GHL purge workflow is tested |
| `NEXT_PUBLIC_BOOKING_URL` | public | free online consultation booking link |
| `NEXT_PUBLIC_SITE_URL` | public | canonical / OG URL |
| `NEXT_PUBLIC_GHL_FULL_REPORT_STORAGE_ENABLED` | public (optional) | Defaults off; controls whether the separate full-report storage choice is offered |
| `NEXT_PUBLIC_META_PIXEL_ID` | public | Meta dataset/pixel used by the campaign |

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
- **Have a qualified practitioner sign off** the treatment copy (`lib/constants.ts` `PROTOCOL_STEPS`, `REGION_COPY` in `lib/face-regions.ts`) and the system prompt's scope guard (`lib/prompts/system-pigmentation.ts`) — pigmentation borders dermatology and the no-diagnosis language carries liability weight.
- Run several test photos and **audit the narratives** for medical condition names before launch.
- Replace the **placeholder testimonials** in `components/result/Testimonials.tsx` with HSA's own verified reviews.
- Add HSA's own **consented before/after pairs** to `/public/results` and populate `CASES` in `components/result/ResultsGallery.tsx` (it ships empty — do not reuse imagery from any other clinic).
- Confirm the **GoHighLevel webhook URL** and that the AI-agent sequence keys off the `pigmentation-<bucket>` tags and the `marketingConsent` field.
- Keep both report-storage flags `false` unless the separate report-storage choice is live and an external GHL workflow has been tested to purge every face-containing report and reference within 30 days. This repository does not provide that purge.
- Confirm the **booking URL** (free online consultation) and clinic contact details in `lib/constants.ts`.
- A UK GDPR DPIA covering the selfie processing is recommended (the app avoids persisting the original image and keeps marketing and report-storage consent separate).
