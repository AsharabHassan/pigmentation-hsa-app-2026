"use client";

import Script from "next/script";
import { useEffect, useSyncExternalStore } from "react";
import {
  ADVERTISING_CONSENT_CHANGE_EVENT, getAdvertisingConsent,
  isExactProductionHost, syncAdvertisingConsentFromStorage,
} from "@/lib/meta-consent";
import { GTM_CONTAINER_ID, initializeTagManager } from "@/lib/google-ads";

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    syncAdvertisingConsentFromStorage(event);
    onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(ADVERTISING_CONSENT_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(ADVERTISING_CONSENT_CHANGE_EVENT, onChange);
  };
}

/** Withdrawal is handled by GoogleAds, which flips Consent Mode back to denied. */
export default function GoogleTagManager() {
  const consent = useSyncExternalStore(subscribe, getAdvertisingConsent, () => "unset");
  const enabled = consent === "granted" && isExactProductionHost();
  useEffect(() => {
    if (enabled) initializeTagManager();
  }, [enabled]);
  return enabled ? (
    <Script id="hsa-gtm" src={`https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`}
      strategy="afterInteractive" />
  ) : null;
}
