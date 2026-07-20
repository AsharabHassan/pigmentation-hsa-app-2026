"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Camera, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MediaType } from "@/store/wizard-store";

interface CameraCaptureProps {
  onCapture: (base64: string, mediaType: MediaType) => void;
  onError: (message: string) => void;
}

/** Live front-camera preview with a single-frame capture to base64 JPEG. */
export function CameraCapture({ onCapture, onError }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1350 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch {
        onError(
          "We couldn't access your camera. You can upload a photo instead, or just answer the questions.",
        );
      }
    }
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [onError]);

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const base64 = dataUrl.split(",")[1] ?? "";
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onCapture(base64, "image/jpeg");
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative aspect-[4/5] w-full max-w-xs overflow-hidden rounded-[2rem] border border-peach/20 bg-white/[0.04] shadow-soft">
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full -scale-x-100 object-cover"
        />
        {/* framing guide */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[68%] w-[58%] rounded-[50%] border-2 border-dashed border-white/70" />
        </div>
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">
            <RefreshCcw className="mr-2 animate-spin" size={16} /> Starting
            camera…
          </div>
        )}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: ready ? 1 : 0.4 }}>
        <Button size="lg" className="mt-6" onClick={capture} disabled={!ready}>
          <Camera size={18} /> Capture photo
        </Button>
      </motion.div>
      <p className="mt-3 text-xs text-body/60">
        Face the light, look straight at the camera.
      </p>
    </div>
  );
}
