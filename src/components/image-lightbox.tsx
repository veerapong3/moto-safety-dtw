"use client";

import { useEffect, useId, useState } from "react";

export type LightboxImage = {
  src: string;
  label?: string;
};

export function ImageThumbnails({
  images,
  sizeClass = "h-11 w-11",
}: {
  images: LightboxImage[];
  sizeClass?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const items = images.filter((img) => Boolean(img.src));

  if (items.length === 0) {
    return <span className="text-xs text-slate-400">ไม่มีรูป</span>;
  }

  return (
    <>
      <div className="flex gap-1.5">
        {items.map((img, i) => (
          <button
            key={`${img.src}-${i}`}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="group relative overflow-hidden rounded-xl ring-1 ring-slate-200 transition hover:ring-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title={img.label || "ดูรูปขยาย"}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt={img.label || `รูปที่ ${i + 1}`}
              className={`${sizeClass} object-cover transition group-hover:scale-105`}
            />
            <span className="pointer-events-none absolute inset-0 grid place-items-center bg-slate-900/0 text-white opacity-0 transition group-hover:bg-slate-900/35 group-hover:opacity-100">
              <i className="fa-solid fa-magnifying-glass-plus text-xs" />
            </span>
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <ImageLightbox
          images={items}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onIndexChange={setOpenIndex}
        />
      )}
    </>
  );
}

export function ImageLightbox({
  images,
  index,
  onClose,
  onIndexChange,
}: {
  images: LightboxImage[];
  index: number;
  onClose: () => void;
  onIndexChange: (next: number) => void;
}) {
  const titleId = useId();
  const current = images[index];
  const hasMany = images.length > 1;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasMany) {
        onIndexChange((index - 1 + images.length) % images.length);
      }
      if (e.key === "ArrowRight" && hasMany) {
        onIndexChange((index + 1) % images.length);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasMany, images.length, index, onClose, onIndexChange]);

  if (!current?.src) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-5xl flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 text-white">
          <div>
            <p id={titleId} className="text-sm font-bold">
              {current.label || `รูปที่ ${index + 1}`}
            </p>
            {hasMany && (
              <p className="text-xs text-white/70">
                {index + 1} / {images.length}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="ปิด"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="relative flex min-h-[50vh] items-center justify-center rounded-3xl bg-black/40 p-2 sm:p-4">
          {hasMany && (
            <button
              type="button"
              onClick={() =>
                onIndexChange((index - 1 + images.length) % images.length)
              }
              className="absolute left-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25 sm:left-4"
              aria-label="รูปก่อนหน้า"
            >
              <i className="fa-solid fa-chevron-left" />
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.src}
            alt={current.label || "รูปขยาย"}
            className="max-h-[78vh] max-w-full rounded-2xl object-contain shadow-2xl"
          />

          {hasMany && (
            <button
              type="button"
              onClick={() => onIndexChange((index + 1) % images.length)}
              className="absolute right-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25 sm:right-4"
              aria-label="รูปถัดไป"
            >
              <i className="fa-solid fa-chevron-right" />
            </button>
          )}
        </div>

        {hasMany && (
          <div className="flex justify-center gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={`${img.src}-thumb-${i}`}
                type="button"
                onClick={() => onIndexChange(i)}
                className={`overflow-hidden rounded-xl ring-2 transition ${
                  i === index
                    ? "ring-amber-400"
                    : "ring-transparent opacity-70 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt={img.label || `thumb ${i + 1}`}
                  className="h-14 w-14 object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function registrationImages(row: {
  bike_url?: string;
  plate_url?: string;
  rider_url?: string;
}): LightboxImage[] {
  return [
    { src: row.bike_url || "", label: "รูปรถจักรยานยนต์" },
    { src: row.plate_url || "", label: "รูปป้ายทะเบียน" },
    { src: row.rider_url || "", label: "รูปผู้ขับขี่" },
  ].filter((img) => Boolean(img.src));
}
