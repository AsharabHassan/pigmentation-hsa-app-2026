"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Upload, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsentCheckbox } from "@/components/compliance/ConsentCheckbox";
import { DisclaimerBanner } from "@/components/compliance/DisclaimerBanner";
import { CameraCapture } from "@/components/scan/CameraCapture";
import { PhotoGuide } from "@/components/scan/PhotoGuide";
import { useWizard, type MediaType } from "@/store/wizard-store";
import { fileToDownscaledImage } from "@/lib/image";

const DEMO_CAPTURE_ASSET =
  "/assets/hsa-cinematic/source/pigmentation-model-pexels-24735911.jpg";

export function ConsentCaptureScreen() {
  const imageConsent = useWizard((s) => s.imageConsent);
  const setImageConsent = useWizard((s) => s.setImageConsent);
  const setImage = useWizard((s) => s.setImage);
  const beginScan = useWizard((s) => s.beginScan);

  const [mode, setMode] = useState<"choose" | "camera">("choose");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const demoCaptureStartedRef = useRef(false);

  // Development-only capture helper: after the normal consent step, load the
  // checked-in demo portrait into the actual file input and dispatch its native
  // change event. This deliberately reuses handleUpload unchanged, so image
  // normalisation, wizard state and the real scan follow the production path.
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "development" ||
      !imageConsent ||
      demoCaptureStartedRef.current ||
      new URLSearchParams(window.location.search).get("demoCapture") !== "1"
    ) {
      return;
    }

    const input = fileRef.current;
    if (!input) return;
    demoCaptureStartedRef.current = true;

    void (async () => {
      try {
        const response = await fetch(DEMO_CAPTURE_ASSET, { cache: "no-store" });
        if (!response.ok) throw new Error("demo-photo-fetch-failed");

        const blob = await response.blob();
        const file = new File([blob], "hsa-demo-pigmentation.jpg", {
          type: blob.type || "image/jpeg",
        });
        const transfer = new DataTransfer();
        transfer.items.add(file);
        input.files = transfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      } catch {
        demoCaptureStartedRef.current = false;
        setError("Sorry, we couldn't load the development capture photo.");
      }
    })();
  }, [imageConsent]);

  function handleCapture(base64: string, mediaType: MediaType) {
    setImage(base64, mediaType);
    beginScan();
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      input.value = "";
      return;
    }
    try {
      // Downscale + re-encode before storing. A full-resolution phone photo held
      // raw in memory can crash/reload the tab on mobile (which resets the wizard
      // back to the start) — this keeps it small and upright.
      const { base64, mediaType } = await fileToDownscaledImage(file);
      setImage(base64, mediaType);
      beginScan();
    } catch {
      setError("Sorry, we couldn't read that image. Please try another photo.");
    } finally {
      // Allow re-selecting the same file (onChange won't fire otherwise).
      input.value = "";
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-6 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-peach-deep">
        Step 1 · Your photo
      </p>
      <h2 className="mt-3 font-serif text-[32px] leading-tight text-heading sm:text-[38px]">
        A quick photo to begin
      </h2>
      <p className="mt-3 text-body">
        Our AI gently maps the tone across your face to tailor your result. Your
        photo is securely sent to our AI provider for this one-time analysis and
        remains in this browser while you view your result. This app does not
        save the original photo. If you later choose to store a face-containing
        report in our clinic CRM, we&rsquo;ll ask for separate consent.
      </p>

      {mode === "camera" ? (
        <div className="mt-8">
          <CameraCapture
            onCapture={handleCapture}
            onError={(m) => {
              setError(m);
              setMode("choose");
            }}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          <PhotoGuide />

          <ConsentCheckbox checked={imageConsent} onChange={setImageConsent}>
            <span>
              <Lock size={13} className="mr-1 inline text-sage-deep" />I consent
              to my photo being securely sent to the AI provider for this
              one-time analysis. I understand that storing a face-containing
              report in the clinic CRM requires a separate choice later.
            </span>
          </ConsentCheckbox>

          {error && (
            <p className="rounded-xl border border-peach/30 bg-peach/15 px-4 py-3 text-sm text-heading">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="flex-1"
              disabled={!imageConsent}
              onClick={() => setMode("camera")}
            >
              <Camera size={18} /> Use camera
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              disabled={!imageConsent}
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={18} /> Upload photo
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleUpload}
            />
          </div>

          <DisclaimerBanner className="mt-2" />
        </div>
      )}
    </div>
  );
}
