"use client";

import { useEffect, useRef, useState } from "react";

type CameraCaptureProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  onCapture: (file: File) => void;
};

export function CameraCaptureModal({
  open,
  title,
  onClose,
  onCapture,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [shooting, setShooting] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setReady(false);
    setError("");
    setShooting(false);

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("เบราว์เซอร์นี้ไม่รองรับการเปิดกล้องสด กรุณาใช้มือถือหรืออัปเดตเบราว์เซอร์");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
        setReady(true);
      } catch (e) {
        if (cancelled) return;
        const name = e instanceof DOMException ? e.name : "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setError(
            "ยังไม่ได้รับสิทธิ์ใช้กล้อง กรุณาอนุญาตการเข้าถึงกล้องในเบราว์เซอร์ แล้วลองใหม่",
          );
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setError("ไม่พบกล้องบนอุปกรณ์นี้");
        } else if (name === "NotReadableError" || name === "TrackStartError") {
          setError("กล้องถูกใช้งานอยู่โดยแอปอื่น กรุณาปิดแล้วลองใหม่");
        } else {
          setError("เปิดกล้องไม่สำเร็จ กรุณาลองใหม่หรือเลือกรูปจากคลัง");
        }
      }
    }

    void start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [open]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  function handleClose() {
    stopCamera();
    onClose();
  }

  async function handleShoot() {
    const video = videoRef.current;
    if (!video || !ready || shooting) return;
    setShooting(true);
    try {
      const w = video.videoWidth || 1280;
      const h = video.videoHeight || 720;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.drawImage(video, 0, 0, w, h);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("toBlob"))),
          "image/jpeg",
          0.92,
        );
      });
      const file = new File([blob], `camera-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      stopCamera();
      onCapture(file);
      onClose();
    } catch {
      setError("บันทึกภาพจากกล้องไม่สำเร็จ กรุณาลองใหม่");
      setShooting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/80 p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0"
        onClick={handleClose}
        aria-hidden
      />
      <div className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-slate-900 shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between gap-3 px-5 py-4 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-200/80">
              ถ่ายแบบสด · ขอสิทธิ์กล้อง
            </p>
            <h3 className="mt-0.5 text-lg font-bold">{title}</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="ปิดกล้อง"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="relative aspect-[3/4] w-full overflow-hidden bg-black sm:aspect-video">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`h-full w-full object-cover transition ${
              ready ? "opacity-100" : "opacity-0"
            }`}
          />
          {!ready && !error && (
            <div className="absolute inset-0 grid place-items-center gap-3 text-center text-white">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <p className="text-sm text-white/80">กำลังขอสิทธิ์และเปิดกล้อง...</p>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 grid place-items-center px-8 text-center">
              <div>
                <i className="fa-solid fa-camera-slash mb-3 text-3xl text-rose-300" />
                <p className="text-sm leading-relaxed text-white/90">{error}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 bg-slate-900 px-5 py-5">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-2xl px-4 py-3 text-sm font-semibold text-white/80 hover:bg-white/10"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={!ready || shooting || Boolean(error)}
            onClick={() => void handleShoot()}
            className="grid h-16 w-16 place-items-center rounded-full border-4 border-white bg-blue-500 text-white shadow-lg transition hover:bg-blue-400 disabled:opacity-40"
            aria-label="ถ่ายภาพ"
          >
            <i className="fa-solid fa-camera text-xl" />
          </button>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setReady(false);
              setError("");
              void (async () => {
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                      facingMode: { ideal: "environment" },
                      width: { ideal: 1280 },
                      height: { ideal: 720 },
                    },
                  });
                  streamRef.current = stream;
                  if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                  }
                  setReady(true);
                } catch {
                  setError(
                    "ยังไม่ได้รับสิทธิ์ใช้กล้อง กรุณาอนุญาตการเข้าถึงกล้องในเบราว์เซอร์ แล้วลองใหม่",
                  );
                }
              })();
            }}
            className="rounded-2xl px-4 py-3 text-sm font-semibold text-white/80 hover:bg-white/10"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    </div>
  );
}
