"use client";

import { useState } from "react";
import type { AdvertisingConsent } from "@/lib/meta-consent";

interface AdvertisingConsentProps {
  consent: AdvertisingConsent;
  settingsOpen: boolean;
  onChoose: (consent: "granted" | "denied") => void;
  onOpenSettings: () => void;
  onCloseSettings: () => void;
}

export function AdvertisingConsentPanel({
  consent,
  settingsOpen,
  onChoose,
  onOpenSettings,
  onCloseSettings,
}: AdvertisingConsentProps) {
  const showPanel = consent === "unset" || settingsOpen;
  // Compact by default so the banner never hides the page a visitor (or an ad
  // click) lands on; the full disclosure is one tap away and always shown when
  // the visitor reopens cookie settings.
  const [expanded, setExpanded] = useState(false);
  const showDetails = expanded || settingsOpen;

  return (
    <>
      {showPanel ? (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby="advertising-consent-title"
          aria-describedby="advertising-consent-description"
          className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-h-[80vh] max-w-2xl sm:left-auto sm:right-5 sm:bottom-5 sm:mx-0 sm:max-w-md overflow-y-auto rounded-2xl border border-white/15 bg-[#111]/[0.98] p-4 text-left shadow-2xl backdrop-blur sm:p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="advertising-consent-title"
                className="font-serif text-lg text-heading"
              >
                Your advertising privacy
              </h2>
              <p
                id="advertising-consent-description"
                className="mt-1 text-sm leading-relaxed text-body"
              >
                We&apos;d like to use Google and Meta advertising cookies to measure
                our ads. Your analysis works the same either way.{" "}
                {showDetails ? null : (
                  <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    aria-expanded={false}
                    className="underline decoration-white/40 underline-offset-2 transition hover:text-heading"
                  >
                    Details
                  </button>
                )}
              </p>
              {showDetails ? (
                <p className="mt-2 text-xs leading-relaxed text-body sm:text-sm">
                With your permission, we use Google and Meta advertising cookies.
                Google measures completed enquiries using advertising identifiers;
                we do not send Google your name, email, phone, photo or analysis.
                If you
                submit your details, our CRM may also send Meta protected,
                hashed identifiers such as your name, email and phone, plus
                browser and network information, so Meta can match and measure
                this campaign. Optional Google and Meta tracking stays off if you reject, and your
                analysis still works normally.{" "}
                <a
                  href="https://www.facebook.com/privacy/policy/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-white/40 underline-offset-2 transition hover:text-heading"
                >
                How Meta uses information
                </a>
                {" · "}
                <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noreferrer"
                  className="underline decoration-white/40 underline-offset-2 transition hover:text-heading">
                  How Google uses information
                </a>.
              </p>
              ) : null}
            </div>
            {consent !== "unset" ? (
              <button
                type="button"
                onClick={onCloseSettings}
                className="shrink-0 rounded-full px-2 py-1 text-sm text-body transition hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach"
                aria-label="Close cookie settings"
              >
                Close
              </button>
            ) : null}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onChoose("denied")}
              aria-label="Reject optional advertising tracking"
              className="min-h-11 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-heading transition hover:border-white/40 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => onChoose("granted")}
              aria-label="Accept optional advertising tracking"
              className="min-h-11 rounded-full bg-peach px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-peach-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach-light focus-visible:ring-offset-2 focus-visible:ring-offset-[#111]"
            >
              Accept
            </button>
          </div>
        </section>
      ) : (
        <button
          type="button"
          onClick={onOpenSettings}
          data-cookie-pill
          className="fixed bottom-3 left-3 z-[90] rounded-full border border-white/15 bg-[#111]/95 px-3 py-2 text-xs font-medium text-body shadow-lg backdrop-blur transition hover:border-white/30 hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach"
        >
          Cookie settings
        </button>
      )}
    </>
  );
}
