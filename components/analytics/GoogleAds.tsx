"use client";

import Script from "next/script";
import { useEffect, useSyncExternalStore } from "react";
import {
  ADVERTISING_CONSENT_CHANGE_EVENT, getAdvertisingConsent,
  isExactProductionHost, syncAdvertisingConsentFromStorage,
} from "@/lib/meta-consent";
import { GOOGLE_ADS_ID, initializeGoogleAds, revokeGoogleAds } from "@/lib/google-ads";

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

export default function GoogleAds() {
  const consent = useSyncExternalStore(subscribe, getAdvertisingConsent, () => "unset");
  const enabled = consent === "granted" && isExactProductionHost();
  useEffect(() => {
    if (enabled) initializeGoogleAds();
    else revokeGoogleAds();
  }, [enabled]);
  return enabled ? (
    <Script id="hsa-google-ads" src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
      strategy="afterInteractive" onReady={initializeGoogleAds} />
  ) : null;
}
