"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Lock, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { useWizard } from "@/store/wizard-store";
import { requestAnalysis, submitLead } from "@/lib/api-client";
import { getMetaAttribution } from "@/lib/meta-pixel";
import { hasMetaTrackingConsent } from "@/lib/meta-consent";
import type { Lead } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LeadGateScreen() {
  const imageBase64 = useWizard((s) => s.imageBase64);
  const imageMediaType = useWizard((s) => s.imageMediaType);
  const imageConsent = useWizard((s) => s.imageConsent);
  const imageConsentAt = useWizard((s) => s.imageConsentAt);
  const storedResult = useWizard((s) => s.result);
  const setLead = useWizard((s) => s.setLead);
  const setResult = useWizard((s) => s.setResult);
  const reveal = useWizard((s) => s.reveal);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 7) {
      setError("Please enter a valid phone number.");
      return;
    }
    setError(null);
    setBusy(true);

    const lead: Lead = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
    };
    setLead(lead);

    // The analysis already ran behind the scan loader; just reveal it. The inline
    // requestAnalysis is a defensive fallback for the rare case the result isn't
    // ready yet (e.g. a very slow first request), so the user is never stuck.
    let result = storedResult;
    if (!result) {
      result = await requestAnalysis({
        imageBase64,
        imageMediaType,
        imageConsent,
      });
      setResult(result);
    }

    // The browser sends no conversion event. GHL is the sole source of the
    // server-side Lead and receives Meta fields only after advertising consent.
    // The CRM gets the written result summary only — the selfie and the report
    // PDF never leave the browser.
    void submitLead({
      lead,
      result,
      imageProcessingConsent: imageConsent,
      imageProcessingConsentAt:
        imageConsentAt ?? new Date().toISOString(),
      metaTrackingConsent: hasMetaTrackingConsent(),
      attribution: getMetaAttribution(),
    });

    reveal();
  }

  return (
    <div className="mx-auto w-full max-w-md px-6 py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-[2rem] border border-peach/30 bg-white/[0.04] p-7 shadow-soft backdrop-blur"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-peach/30 bg-peach/10 px-3 py-1 text-xs font-semibold text-peach">
          <Sparkles size={13} /> Your guide is ready
        </span>
        <h2 className="mt-4 font-serif text-[30px] leading-tight text-heading">
          Where shall we send your result?
        </h2>
        <p className="mt-2 text-sm text-body">
          See your personalised pigmentation analysis. We&rsquo;ll securely add
          a written summary to your contact record so our doctor-led team can
          review it for your free online consultation.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
            />
            <TextField
              label="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
            />
          </div>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <TextField
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />

          <p className="rounded-2xl border border-sage/20 bg-sage/[0.06] px-4 py-3 text-xs leading-relaxed text-body/75">
            Your written result summary is added to your contact record. Your
            selfie and full PDF are not stored in the clinic CRM; you can
            download your copy after the reveal.
          </p>

          {error && (
            <p className="rounded-xl border border-peach/30 bg-peach/15 px-4 py-2.5 text-sm text-heading">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Preparing your
                result…
              </>
            ) : (
              "Reveal my result"
            )}
          </Button>

          <p className="flex items-center justify-center gap-1.5 text-xs text-body/55">
            <Lock size={12} /> We respect your privacy. No spam.
          </p>
        </form>
      </motion.div>
    </div>
  );
}
